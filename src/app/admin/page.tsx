'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  CalendarDays, Users, Coffee, Clock, MessageSquare, Bell,
  Image as ImageIcon, Megaphone, Mail, TrendingUp, ArrowRight, BarChart3,
} from 'lucide-react'
import { useTenantOptional } from '@/lib/tenant'

import type { Reservation } from '@/types'

interface DashboardStats {
  todayReservations: number
  todayGuests: number
  pendingReservations: number
  totalReservations30d: number
  newEvents: number
  contacts30d: number
  menuItems: number
  galleryItems: number
  activeCampaigns: number
}

export default function AdminDashboardPage() {
  const tenant = useTenantOptional()
  const businessName = tenant?.tenant.name || 'İşletme'
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentReservations, setRecentReservations] = useState<Reservation[]>([])

  const loadData = useCallback(async () => {
    try {
      const [statsRes, resRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/reservations?limit=5'),
      ])
      if (statsRes.ok) {
        setStats(await statsRes.json())
      }
      if (resRes.ok) {
        const data = await resRes.json()
        setRecentReservations(data.data || [])
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-section-heading text-charcoal-900">Yönetim Paneli</h1>
          <p className="text-body text-charcoal-500 mt-1">
            {businessName} — Genel bakış
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-charcoal-400">
          <BarChart3 size={14} />
          Son güncelleme: Şimdi
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="p-3 rounded-button bg-forest-100">
              <CalendarDays size={20} className="text-forest-700" />
            </div>
            <div>
              <p className="text-caption text-charcoal-500">Bugünkü Rez.</p>
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
              <p className="text-xl font-semibold text-charcoal-900">{stats?.pendingReservations ?? '—'}</p>
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
        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="p-3 rounded-button bg-blue-100">
              <TrendingUp size={20} className="text-blue-700" />
            </div>
            <div>
              <p className="text-caption text-charcoal-500">Son 30 Gün Rez.</p>
              <p className="text-xl font-semibold text-charcoal-900">{stats?.totalReservations30d ?? '—'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="text-center py-3">
          <MessageSquare size={18} className="mx-auto text-orange-500 mb-1" />
          <p className="text-lg font-semibold text-charcoal-900">{stats?.newEvents ?? '—'}</p>
          <p className="text-xs text-charcoal-500">Yeni Etkinlik Talebi</p>
        </Card>
        <Card className="text-center py-3">
          <Mail size={18} className="mx-auto text-indigo-500 mb-1" />
          <p className="text-lg font-semibold text-charcoal-900">{stats?.contacts30d ?? '—'}</p>
          <p className="text-xs text-charcoal-500">İletişim (30 Gün)</p>
        </Card>
        <Card className="text-center py-3">
          <Coffee size={18} className="mx-auto text-amber-600 mb-1" />
          <p className="text-lg font-semibold text-charcoal-900">{stats?.menuItems ?? '—'}</p>
          <p className="text-xs text-charcoal-500">Menü Ürünü</p>
        </Card>
        <Card className="text-center py-3">
          <Megaphone size={18} className="mx-auto text-pink-500 mb-1" />
          <p className="text-lg font-semibold text-charcoal-900">{stats?.activeCampaigns ?? '—'}</p>
          <p className="text-xs text-charcoal-500">Aktif Kampanya</p>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { href: '/admin/reservations', title: 'Rezervasyonlar', icon: CalendarDays, count: stats?.pendingReservations },
          { href: '/admin/menu', title: 'Menü', icon: Coffee },
          { href: '/admin/events', title: 'Etkinlikler', icon: MessageSquare, count: stats?.newEvents },
          { href: '/admin/gallery', title: 'Galeri', icon: ImageIcon },
          { href: '/admin/campaigns', title: 'Kampanyalar', icon: Megaphone },
          { href: '/admin/settings', title: 'Ayarlar', icon: Bell },
        ].map((a) => (
          <Link key={a.href} href={a.href}>
            <Card hover className="flex flex-col items-center gap-2 cursor-pointer py-4 relative">
              <a.icon size={20} className="text-brand-primary" />
              <span className="text-xs font-medium text-charcoal-800">{a.title}</span>
              {a.count && a.count > 0 ? (
                <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                  {a.count}
                </span>
              ) : null}
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
            <Link href="/admin/reservations" className="text-sm text-brand-primary hover:underline flex items-center gap-1">
              Tümünü Gör <ArrowRight size={14} />
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
