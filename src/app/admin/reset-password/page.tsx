'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/ui/form-field'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Supabase automatically handles the token exchange from the URL hash
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        // User arrived via reset link — form is ready
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır.')
      return
    }
    if (password !== confirm) {
      setError('Şifreler eşleşmiyor.')
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const { error: updateError } = await supabase.auth.updateUser({ password })

      if (updateError) {
        setError('Şifre güncellenemedi. Bağlantı süresi dolmuş olabilir.')
        setLoading(false)
        return
      }

      setSuccess(true)
      setTimeout(() => router.replace('/admin'), 2000)
    } catch {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.')
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-serif">Şifre Güncellendi</CardTitle>
          <CardDescription>Yönetim paneline yönlendiriliyorsunuz...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-serif">Yeni Şifre Belirle</CardTitle>
        <CardDescription>Yeni şifrenizi girin</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Yeni Şifre">
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </FormField>

          <FormField label="Şifre Tekrar">
            <Input
              type="password"
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
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
            Şifreyi Güncelle
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
