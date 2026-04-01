'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CalendarDays, Users, Coffee, Clock, MessageSquare, Bell } from 'lucide-react'
import { useTenantOptional } from '@/lib/tenant'

import type { Reservation } from '@/types'

interface DashboardStats {
  todayReservations: number
  pendingCount: number
  todayGuests: number
  menuItems: number
  newEvents: number
  unreadContacts: number
}

export default function AdminDashboardPage() {
  const tenant = useTenantOptional()
  const businessName = tenant?.tenant.name || 'İşletme'
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentReservations, setRecentReservations] = useState<Reservation[]>([])

  const loadData = useCallback(async () => {
    try {
      const [resRes] = await Promise.all([
        fetch('/api/reservations?limit=5'),
        fetch('/api/events?limit=5'),
      ])
      if (resRes.ok) {
        const data = await resRes.json()
        setRecentReservations(data.data || [])

        const today = new Date().toISOString().split('T')[0]
        const todayRes = (data.data || []).filter((r: Reservation) => r.reservation_date === today)
        setStats({
          todayReservations: todayRes.length,
          pendingCount: (data.data || []).filter((r: Reservation) => r.status === 'pending').length,
          todayGuests: todayRes.reduce((s: number, r: Reservation) => s + r.party_size, 0),
          menuItems: 0,
          newEvents: 0,
          unreadContacts: 0,
        })
      }
    } catch {
      // Silently fail for dashboard
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const statusLabels: Record<string, string> = {
    pending: 'Bekliyor',
    confirmed: 'Onaylandı',
    rejected: 'Reddedildi',
    cancelled: 'İptal',
    completed: 'Tamamlandı',
    no_show: 'Gelmedi',
  }
  const statusVariants: Record<string, 'warning' | 'success' | 'error' | 'default' | 'info'> = {
    pending: 'warning',
    confirmed: 'success',
    rejected: 'error',
    cancelled: 'error',
    completed: 'info',
    no_show: 'default',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-section-heading text-charcoal-900">Yönetim Paneli</h1>
        <p className="text-body text-charcoal-500 mt-1">
          {businessName} — Genel bakış
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="p-3 rounded-button bg-forest-100">
              <CalendarDays size={20} className="text-forest-700" />
            </div>
            <div>
              <p className="text-caption text-charcoal-500">Bugünkü Rezervasyonlar</p>
              <p className="text-xl font-semibold text-charcoal-900">{stats?.todayReservations ?? '—'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="p-3 rounded-button bg-gold-300/20">
              <Clock size={20} className="text-gold-700" />
            </div>
            <div>
              <p className="text-caption text-charcoal-500">Bekleyen Onay</p>
              <p className="text-xl font-semibold text-charcoal-900">{stats?.pendingCount ?? '—'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="p-3 rounded-button bg-burgundy-100">
              <Users size={20} className="text-burgundy-700" />
            </div>
            <div>
              <p className="text-caption text-charcoal-500">Toplam Kişi (Bugün)</p>
              <p className="text-xl font-semibold text-charcoal-900">{stats?.todayGuests ?? '—'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { href: '/admin/reservations', title: 'Rezervasyonlar', icon: CalendarDays },
          { href: '/admin/menu', title: 'Menü', icon: Coffee },
          { href: '/admin/events', title: 'Etkinlikler', icon: MessageSquare },
          { href: '/admin/settings', title: 'Ayarlar', icon: Bell },
        ].map((a) => (
          <Link key={a.href} href={a.href}>
            <Card hover className="flex items-center gap-3 cursor-pointer">
              <a.icon size={18} className="text-brand-primary shrink-0" />
              <span className="text-sm font-medium text-charcoal-800">{a.title}</span>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Reservations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Son Rezervasyonlar</CardTitle>
              <CardDescription>En son 5 rezervasyon</CardDescription>
            </div>
            <Link href="/admin/reservations" className="text-sm text-brand-primary hover:underline">
              Tümünü Gör →
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentReservations.length === 0 ? (
            <p className="text-sm text-charcoal-400 text-center py-4">Henüz rezervasyon yok.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-charcoal-100 text-left">
                    <th className="pb-2 font-medium text-charcoal-500">Misafir</th>
                    <th className="pb-2 font-medium text-charcoal-500">Tarih</th>
                    <th className="pb-2 font-medium text-charcoal-500">Saat</th>
                    <th className="pb-2 font-medium text-charcoal-500">Kişi</th>
                    <th className="pb-2 font-medium text-charcoal-500">Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {recentReservations.map((r) => (
                    <tr key={r.id} className="border-b border-charcoal-50">
                      <td className="py-2 text-charcoal-900">{r.guest_name}</td>
                      <td className="py-2 text-charcoal-600">{r.reservation_date}</td>
                      <td className="py-2 text-charcoal-600">{r.reservation_time?.slice(0, 5)}</td>
                      <td className="py-2 text-charcoal-600">{r.party_size}</td>
                      <td className="py-2">
                        <Badge variant={statusVariants[r.status] || 'default'}>
                          {statusLabels[r.status] || r.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
