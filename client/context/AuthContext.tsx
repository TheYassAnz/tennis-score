'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { api, User } from '@/lib/api'
import { useRouter } from 'next/navigation'

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (identifier: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }
    api.me()
      .then(setUser)
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false))
  }, [])

  async function login(identifier: string, password: string) {
    const { user, token } = await api.login({ identifier, password })
    localStorage.setItem('token', token)
    setUser(user)
    router.push('/dashboard')
  }

  async function register(username: string, email: string, password: string) {
    const { user, token } = await api.register({ username, email, password })
    localStorage.setItem('token', token)
    setUser(user)
    router.push('/dashboard')
  }

  function logout() {
    localStorage.removeItem('token')
    setUser(null)
    router.push('/login')
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
