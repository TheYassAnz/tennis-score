'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, History, Trophy, User } from 'lucide-react'

const links = [
  { href: '/dashboard', icon: Home, label: 'Accueil' },
  { href: '/history', icon: History, label: 'Historique' },
  { href: '/leaderboard', icon: Trophy, label: 'Classement' },
  { href: '/stats', icon: User, label: 'Stats' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-gray-900 border-t border-gray-800 z-50 safe-area-bottom">
      <div className="flex">
        {links.map(({ href, icon: Icon, label }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs transition-colors ${
                active ? 'text-green-400' : 'text-gray-500'
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
