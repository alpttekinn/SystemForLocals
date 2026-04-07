'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/ui/form-field'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const supabase = createClient()
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/admin/reset-password`,
      })

      if (resetError) {
        setError('İşlem başarısız. Lütfen tekrar deneyin.')
        setLoading(false)
        return
      }

      setSent(true)
    } catch {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-serif">E-posta Gönderildi</CardTitle>
          <CardDescription>
            Şifre sıfırlama bağlantısı <strong>{email}</strong> adresine gönderildi.
            Lütfen gelen kutunuzu kontrol edin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/admin/login">
            <Button variant="secondary" className="w-full">Giriş Sayfasına Dön</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-serif">Şifremi Unuttum</CardTitle>
        <CardDescription>E-posta adresinize sıfırlama bağlantısı göndereceğiz</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="E-posta">
            <Input
              type="email"
              placeholder="ornek@isletme.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </FormField>

          {error && (
            <p className="text-sm text-burgundy-600">{error}</p>
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            loading={loading}
          >
            Sıfırlama Bağlantısı Gönder
          </Button>

          <div className="text-center">
            <Link href="/admin/login" className="text-sm text-charcoal-500 hover:text-charcoal-700">
              Giriş sayfasına dön
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
