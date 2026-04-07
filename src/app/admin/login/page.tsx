'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/ui/form-field'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const { addToast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError('Geçersiz e-posta veya şifre.')
        setLoading(false)
        return
      }

      addToast('Giriş başarılı — yönlendiriliyorsunuz.', 'success')
      router.replace('/admin')
    } catch {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.')
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="text-gold-500 text-sm tracking-[0.5em] mb-2">★ ★ ★</div>
        <CardTitle className="text-2xl font-serif">Yönetim Paneli</CardTitle>
        <CardDescription>Hesabınızla giriş yapın</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="E-posta" error={error ? ' ' : undefined}>
            <Input
              type="email"
              placeholder="ornek@isletme.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </FormField>

          <FormField label="Şifre">
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
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
            Giriş Yap
          </Button>

          <div className="text-center">
            <Link href="/admin/forgot-password" className="text-sm text-charcoal-500 hover:text-charcoal-700">
              Şifremi unuttum
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
