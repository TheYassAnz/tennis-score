'use client'

import Image from 'next/image'

interface AvatarUser {
  firstName?: string | null
  lastName?: string | null
  username?: string
  avatarUrl?: string | null
}

interface Props {
  user: AvatarUser
  size?: number
  className?: string
}

function hashColor(str: string): string {
  const colors = [
    '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B',
    '#10B981', '#EF4444', '#14B8A6', '#F97316',
  ]
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

export default function Avatar({ user, size = 40, className = '' }: Props) {
  const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? ''
  const src = user.avatarUrl ? `${apiBase}${user.avatarUrl}` : null

  const initials = [user.firstName?.[0], user.lastName?.[0]]
    .filter(Boolean)
    .join('')
    .toUpperCase() || (user.username?.[0]?.toUpperCase() ?? '?')

  const seed = (user.firstName ?? '') + (user.lastName ?? '') + (user.username ?? '')
  const bg = hashColor(seed)

  if (src) {
    return (
      <div
        className={`relative rounded-full overflow-hidden shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        <Image src={src} alt={initials} fill className="object-cover" unoptimized />
      </div>
    )
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full shrink-0 font-bold text-white ${className}`}
      style={{ width: size, height: size, backgroundColor: bg, fontSize: size * 0.38 }}
    >
      {initials}
    </div>
  )
}
