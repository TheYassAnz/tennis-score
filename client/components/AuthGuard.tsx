'use client'

import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [user, loading, router])

  if (loading || !user) {
    return (
      <div className="flex h-full items-center justify-center bg-page">
        <div className="h-8 w-8 animate-spin rounded-full border-2 spinner" />
      </div>
    )
  }

  return <>{children}</>
}
