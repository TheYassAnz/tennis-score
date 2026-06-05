'use client'

import { useState } from 'react'
import { GrandSlam, ColorMode, SLAM_META, useTheme } from '@/context/ThemeContext'
import { Sun, Moon, Check } from 'lucide-react'

export default function OnboardingTheme() {
  const { completeOnboarding } = useTheme()
  const [selected, setSelected] = useState<GrandSlam>('roland-garros')
  const [mode, setMode] = useState<ColorMode>('dark')

  const slams = Object.entries(SLAM_META) as [GrandSlam, typeof SLAM_META[GrandSlam]][]

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6 py-12"
      style={{ backgroundColor: SLAM_META[selected][mode === 'dark' ? 'bg' : 'surface'] }}>

      <div className="w-full max-w-sm flex flex-col gap-6">
        {/* Header */}
        <div className="text-center">
          <div className="text-5xl mb-3">🎾</div>
          <h1 className="text-2xl font-bold text-white">Tennis Score</h1>
          <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Choisis ton Grand Chelem préféré
          </p>
        </div>

        {/* Grand Slam picker */}
        <div className="grid grid-cols-2 gap-3">
          {slams.map(([key, meta]) => {
            const isActive = selected === key
            return (
              <button
                key={key}
                onClick={() => setSelected(key)}
                className="flex flex-col items-center justify-center rounded-2xl py-5 border-2 transition-all active:scale-95"
                style={{
                  backgroundColor: isActive ? `${meta.primary}22` : 'rgba(255,255,255,0.06)',
                  borderColor: isActive ? meta.primary : 'rgba(255,255,255,0.12)',
                }}
              >
                <span className="text-3xl mb-2">{meta.flag}</span>
                <span className="font-semibold text-sm text-white">{meta.label}</span>
                <span className="text-xs mt-0.5" style={{ color: isActive ? meta.primary : 'rgba(255,255,255,0.4)' }}>
                  {meta.court}
                </span>
                {isActive && (
                  <div className="mt-2 rounded-full w-5 h-5 flex items-center justify-center"
                    style={{ backgroundColor: meta.primary }}>
                    <Check size={12} color="white" />
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Light / Dark toggle */}
        <div className="rounded-2xl p-1 flex gap-1"
          style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
          {(['dark', 'light'] as ColorMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition"
              style={{
                backgroundColor: mode === m ? SLAM_META[selected].primary : 'transparent',
                color: mode === m ? 'white' : 'rgba(255,255,255,0.5)',
              }}
            >
              {m === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
              {m === 'dark' ? 'Sombre' : 'Clair'}
            </button>
          ))}
        </div>

        {/* Preview band */}
        <div className="rounded-2xl overflow-hidden border"
          style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <div className="h-2" style={{ backgroundColor: SLAM_META[selected].primary }} />
          <div className="px-4 py-3 flex items-center justify-between"
            style={{ backgroundColor: SLAM_META[selected].surface }}>
            <span className="text-xs font-medium text-white">Aperçu</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{ backgroundColor: `${SLAM_META[selected].primary}22`, color: SLAM_META[selected].primary }}>
              {SLAM_META[selected].label}
            </span>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={() => completeOnboarding(selected, mode)}
          className="w-full rounded-xl py-4 font-semibold text-white text-base transition active:scale-95"
          style={{ backgroundColor: SLAM_META[selected].primary }}
        >
          Commencer
        </button>
      </div>
    </div>
  )
}
