'use client'

import { useState } from 'react'
import { useTheme, GrandSlam, SLAM_META, ColorMode } from '@/context/ThemeContext'
import { Sun, Moon, Palette, Check, X } from 'lucide-react'

export default function ThemeToggle() {
  const { theme, mode, setTheme, toggleMode } = useTheme()
  const [open, setOpen] = useState(false)
  const slams = Object.entries(SLAM_META) as [GrandSlam, typeof SLAM_META[GrandSlam]][]

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-2 rounded-full bg-surface-2 border border-theme text-muted hover:text-primary transition"
      >
        <Palette size={18} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />

          {/* Sheet */}
          <div className="relative w-full max-w-md rounded-t-3xl bg-surface border-t border-theme p-6 pb-10 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-base text-body">Thème</h2>
              <button onClick={() => setOpen(false)} className="p-1 text-muted">
                <X size={20} />
              </button>
            </div>

            {/* Slam grid */}
            <div className="grid grid-cols-2 gap-3">
              {slams.map(([key, meta]) => {
                const isActive = theme === key
                return (
                  <button
                    key={key}
                    onClick={() => { setTheme(key); setOpen(false) }}
                    className="flex flex-col items-center justify-center rounded-2xl py-4 border-2 transition-all active:scale-95"
                    style={{
                      backgroundColor: isActive ? `${meta.primary}18` : undefined,
                      borderColor: isActive ? meta.primary : 'var(--c-border)',
                    }}
                  >
                    <span className="text-2xl mb-1">{meta.flag}</span>
                    <span className="font-semibold text-sm text-body">{meta.label}</span>
                    <span className="text-xs mt-0.5 text-muted">{meta.court}</span>
                    {isActive && (
                      <div className="mt-1.5 rounded-full w-4 h-4 flex items-center justify-center"
                        style={{ backgroundColor: meta.primary }}>
                        <Check size={10} color="white" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Light/dark toggle */}
            <div className="rounded-2xl p-1 flex gap-1 bg-surface-2">
              {(['dark', 'light'] as ColorMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => { if (mode !== m) toggleMode() }}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition"
                  style={{
                    backgroundColor: mode === m ? 'var(--c-primary)' : 'transparent',
                    color: mode === m ? 'white' : 'var(--c-text-muted)',
                  }}
                >
                  {m === 'dark' ? <Moon size={15} /> : <Sun size={15} />}
                  {m === 'dark' ? 'Sombre' : 'Clair'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
