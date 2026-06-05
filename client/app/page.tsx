'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import OnboardingTheme from '@/components/OnboardingTheme'

export default function Home() {
  const { user, loading } = useAuth()
  const { isOnboarded } = useTheme()
  const router = useRouter()

  useEffect(() => {
    if (!loading && isOnboarded) {
      router.replace(user ? '/dashboard' : '/login')
    }
  }, [user, loading, isOnboarded, router])

  if (!isOnboarded) return <OnboardingTheme />

  return (
    <div className="flex h-full items-center justify-center bg-page">
      <div className="h-8 w-8 animate-spin rounded-full border-2 spinner" />
    </div>
  )
}
