'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

export type GrandSlam = 'roland-garros' | 'wimbledon' | 'us-open' | 'australian-open'
export type ColorMode = 'dark' | 'light'

export const SLAM_META: Record<GrandSlam, { label: string; countryCode: string; court: string; primary: string; bg: string; surface: string }> = {
  'roland-garros': {
    label: 'Roland Garros',
    countryCode: 'FR',
    court: 'Terre battue',
    primary: '#D4541E',
    bg: '#1E1008',
    surface: '#2C1A0E',
  },
  wimbledon: {
    label: 'Wimbledon',
    countryCode: 'GB',
    court: 'Gazon',
    primary: '#4CAF50',
    bg: '#0D1A0D',
    surface: '#142514',
  },
  'us-open': {
    label: 'US Open',
    countryCode: 'US',
    court: 'Surface dure',
    primary: '#418FDE',
    bg: '#081828',
    surface: '#0D2038',
  },
  'australian-open': {
    label: 'Australian Open',
    countryCode: 'AU',
    court: 'Surface dure',
    primary: '#00AEEF',
    bg: '#071525',
    surface: '#0A2035',
  },
}

interface ThemeContextValue {
  theme: GrandSlam
  mode: ColorMode
  setTheme: (t: GrandSlam) => void
  setMode: (m: ColorMode) => void
  toggleMode: () => void
  isOnboarded: boolean
  completeOnboarding: (t: GrandSlam, m: ColorMode) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<GrandSlam>('us-open')
  const [mode, setModeState] = useState<ColorMode>('dark')
  const [isOnboarded, setIsOnboarded] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const savedTheme = localStorage.getItem('tennis-theme') as GrandSlam | null
    const savedMode = localStorage.getItem('tennis-mode') as ColorMode | null
    const onboarded = localStorage.getItem('tennis-onboarded')

    if (savedTheme) setThemeState(savedTheme)
    if (savedMode) setModeState(savedMode)
    if (!onboarded) setIsOnboarded(false)
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    const root = document.documentElement
    root.setAttribute('data-theme', theme)
    root.setAttribute('data-mode', mode)
  }, [theme, mode, mounted])

  function setTheme(t: GrandSlam) {
    setThemeState(t)
    localStorage.setItem('tennis-theme', t)
  }

  function setMode(m: ColorMode) {
    setModeState(m)
    localStorage.setItem('tennis-mode', m)
  }

  function toggleMode() {
    setMode(mode === 'dark' ? 'light' : 'dark')
  }

  function completeOnboarding(t: GrandSlam, m: ColorMode) {
    setTheme(t)
    setMode(m)
    setIsOnboarded(true)
    localStorage.setItem('tennis-onboarded', 'true')
  }

  return (
    <ThemeContext.Provider value={{ theme, mode, setTheme, setMode, toggleMode, isOnboarded, completeOnboarding }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}
