/**
 * Gemini AI first-response service for WhatsApp lead capture.
 *
 * Design principles:
 * - Bounded: Only answers from allowed topics using tenant data
 * - Safe: Never invents prices, confirms reservations, or makes promises
 * - Hospitality-focused: Tone matches tenant brand
 * - Escalation-first: When uncertain, hands off to human
 */

import { env } from '@/lib/env'
import type { WhatsAppSettings, WhatsAppAllowedTopic } from '@/types'

const GEMINI_MODEL = 'gemini-2.0-flash'
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

// ---------------------------------------------------------------------------
// Topic-to-context mapping
// ---------------------------------------------------------------------------

interface TenantContext {
  tenantName: string
  phone?: string | null
  address?: string | null
  city?: string | null
  email?: string | null
  businessHours?: Array<{ day: string; open: string; close: string; isOpen: boolean }>
  menuCategories?: string[]
  activeCampaigns?: Array<{ title: string; description?: string | null }>
  reservationEnabled?: boolean
  eventsEnabled?: boolean
}

function buildTopicContext(topics: WhatsAppAllowedTopic[], ctx: TenantContext): string {
  const sections: string[] = []

  if (topics.includes('opening_hours') && ctx.businessHours) {
    const hours = ctx.businessHours
      .map(h => `${h.day}: ${h.isOpen ? `${h.open} - ${h.close}` : 'Kapalı'}`)
      .join('\n')
    sections.push(`ÇALIŞMA SAATLERİ:\n${hours}`)
  }

  if (topics.includes('address')) {
    const parts = [ctx.address, ctx.city].filter(Boolean)
    if (parts.length) sections.push(`ADRES: ${parts.join(', ')}`)
  }

  if (topics.includes('contact_info')) {
    const info: string[] = []
    if (ctx.phone) info.push(`Telefon: ${ctx.phone}`)
    if (ctx.email) info.push(`E-posta: ${ctx.email}`)
    if (info.length) sections.push(`İLETİŞİM:\n${info.join('\n')}`)
  }

  if (topics.includes('menu_categories') && ctx.menuCategories?.length) {
    sections.push(`MENÜ KATEGORİLERİ: ${ctx.menuCategories.join(', ')}`)
  }

  if (topics.includes('reservation_guidance') && ctx.reservationEnabled) {
    sections.push('REZERVASYON: Online rezervasyon sistemi mevcuttur. Müşteriye web sitesi üzerinden rezervasyon yapabileceğini bildirin.')
  }

  if (topics.includes('event_inquiry') && ctx.eventsEnabled) {
    sections.push('ETKİNLİK: Özel etkinlik talepleri kabul edilmektedir. Detaylar için iletişime geçilmesini önerin.')
  }

  if (topics.includes('campaign_summary') && ctx.activeCampaigns?.length) {
    const campaigns = ctx.activeCampaigns
      .map(c => `- ${c.title}${c.description ? `: ${c.description}` : ''}`)
      .join('\n')
    sections.push(`AKTİF KAMPANYALAR:\n${campaigns}`)
  }

  return sections.join('\n\n')
}

// ---------------------------------------------------------------------------
// System prompt generation
// ---------------------------------------------------------------------------

function buildSystemPrompt(settings: WhatsAppSettings, ctx: TenantContext): string {
  const topicContext = buildTopicContext(settings.ai_allowed_topics, ctx)

  return `Sen ${ctx.tenantName} adlı işletmenin WhatsApp asistanısın.

GÖREVIN:
- Müşterilerin ilk mesajlarına hızlı ve yardımcı yanıt vermek
- SADECE aşağıda verilen bilgileri kullanarak cevap vermek
- Bilmediğin veya emin olmadığın konularda MUTLAKA yetkiliye yönlendirmek

YASAK DAVRANIŞLAR (KESİNLİKLE YAPMA):
- Fiyat söyleme veya tahmin etme
- Rezervasyon onaylama veya söz verme
- Menü öğelerinin içeriklerini tahmin etme
- İşletme politikaları hakkında varsayımda bulunma
- Tıbbi, hukuki veya kişisel tavsiye verme
- Rakip işletmeler hakkında yorum yapma
- Gerçek olmayan bilgi uydurma

ÜSLUP:
${settings.ai_business_tone}

KULLANILACAK BİLGİLER:
${topicContext || 'Şu an kullanılabilir bilgi yok. Müşteriyi yetkiliye yönlendir.'}

ESKALASYon METNİ (emin olmadığında kullan):
"${settings.ai_escalation_text}"

YANITLAMA KURALLARI:
1. Kısa ve öz yanıt ver (max 3-4 cümle)
2. Türkçe yanıt ver
3. Samimi ama profesyonel ol
4. Bilmiyorsan ASLA tahmin etme, yetkiliye yönlendir
5. Her yanıtın sonunda gerekirse yardımcı olabileceğini belirt`
}

// ---------------------------------------------------------------------------
// AI response types
// ---------------------------------------------------------------------------

export interface AiResponse {
  content: string
  confidence: number  // 0.0 - 1.0
  escalated: boolean  // true = AI decided to hand off
  model: string
}

export interface AiResponseError {
  error: string
  fallbackUsed: true
  content: string
}

export type AiResult = AiResponse | AiResponseError

// ---------------------------------------------------------------------------
// Main: generate first response
// ---------------------------------------------------------------------------

export async function generateFirstResponse(
  customerMessage: string,
  settings: WhatsAppSettings,
  tenantContext: TenantContext,
): Promise<AiResult> {
  const apiKey = env.gemini.apiKey()?.trim()
  if (!apiKey) {
    return {
      error: 'GEMINI_API_KEY not configured',
      fallbackUsed: true,
      content: settings.ai_fallback_text,
    }
  }

  const systemPrompt = buildSystemPrompt(settings, tenantContext)

  try {
    const response = await fetch(
      `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: customerMessage }],
            },
          ],
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
          generationConfig: {
            temperature: 0.3,      // Low creativity for factual responses
            topP: 0.8,
            maxOutputTokens: 300,   // Keep responses short
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_LOW_AND_ABOVE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_LOW_AND_ABOVE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_LOW_AND_ABOVE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_LOW_AND_ABOVE' },
          ],
        }),
      },
    )

    if (!response.ok) {
      const errBody = await response.text().catch(() => 'Unknown error')
      console.error('[Gemini] API error:', response.status, errBody)
      return {
        error: `Gemini API error: ${response.status}`,
        fallbackUsed: true,
        content: settings.ai_fallback_text,
      }
    }

    const data = await response.json()
    const candidate = data.candidates?.[0]

    if (!candidate?.content?.parts?.[0]?.text) {
      // Blocked by safety or no response
      return {
        error: 'No content in Gemini response (possibly blocked by safety filters)',
        fallbackUsed: true,
        content: settings.ai_fallback_text,
      }
    }

    const aiText = candidate.content.parts[0].text.trim()

    // Check if AI decided to escalate (look for escalation keywords in response)
    const escalationIndicators = [
      settings.ai_escalation_text.slice(0, 30),
      'yetkilimiz',
      'yetkiliye',
      'size dönüş',
      'iletişime geçecek',
    ]
    const isEscalated = escalationIndicators.some(
      indicator => aiText.toLowerCase().includes(indicator.toLowerCase()),
    )

    // Confidence heuristic: lower if response is very short or contains uncertainty markers
    let confidence = 0.85
    if (aiText.length < 30) confidence = 0.5
    if (isEscalated) confidence = 0.3
    if (aiText.includes('emin değilim') || aiText.includes('bilmiyorum')) confidence = 0.3

    return {
      content: aiText,
      confidence,
      escalated: isEscalated,
      model: GEMINI_MODEL,
    }
  } catch (err) {
    console.error('[Gemini] Request failed:', err)
    return {
      error: err instanceof Error ? err.message : 'Unknown error',
      fallbackUsed: true,
      content: settings.ai_fallback_text,
    }
  }
}

/**
 * Check if the AI result is an error/fallback.
 */
export function isAiError(result: AiResult): result is AiResponseError {
  return 'fallbackUsed' in result
}
