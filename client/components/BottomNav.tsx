'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, History, Trophy } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import Avatar from './Avatar'

const navLinks = [
  { href: '/dashboard', icon: Home, label: 'Accueil' },
  { href: '/history', icon: History, label: 'Historique' },
  { href: '/leaderboard', icon: Trophy, label: 'Classement' },
]

export default function BottomNav() {
  const pathname = usePathname()
  const { user } = useAuth()

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-nav-theme border-t border-theme z-50">
      <div className="flex">
        {navLinks.map(({ href, icon: Icon, label }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs transition-colors ${
                active ? 'text-primary' : 'text-muted'
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              <span>{label}</span>
            </Link>
          )
        })}

        <Link
          href="/profile"
          className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs transition-colors ${
            pathname === '/profile' ? 'text-primary' : 'text-muted'
          }`}
        >
          <div className={`rounded-full ${pathname === '/profile' ? 'ring-2 ring-primary' : ''}`}>
            {user ? (
              <Avatar user={user} size={22} />
            ) : (
              <div className="h-[22px] w-[22px] rounded-full bg-surface-2" />
            )}
          </div>
          <span>Profil</span>
        </Link>
      </div>
    </nav>
  )
}
