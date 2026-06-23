'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import AuthGuard from '@/components/AuthGuard'
import BottomNav from '@/components/BottomNav'
import PasswordInput from '@/components/PasswordInput'
import { ArrowLeft } from 'lucide-react'

export default function ProfileEditPage() {
  const { user, updateUser } = useAuth()
  const router = useRouter()

  // Section infos générales
  const [firstName, setFirstName] = useState(user?.firstName ?? '')
  const [lastName, setLastName] = useState(user?.lastName ?? '')
  const [username, setUsername] = useState(user?.username ?? '')
  const [infoLoading, setInfoLoading] = useState(false)
  const [infoError, setInfoError] = useState('')
  const [infoSuccess, setInfoSuccess] = useState(false)

  // Section sécurité
  const [email, setEmail] = useState(user?.email ?? '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [secLoading, setSecLoading] = useState(false)
  const [secError, setSecError] = useState('')
  const [secSuccess, setSecSuccess] = useState(false)

  async function handleInfoSubmit(e: React.FormEvent) {
    e.preventDefault()
    setInfoError('')
    setInfoSuccess(false)
    setInfoLoading(true)
    try {
      await updateUser({ firstName, lastName, username })
      setInfoSuccess(true)
    } catch (err: unknown) {
      setInfoError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour')
    } finally {
      setInfoLoading(false)
    }
  }

  async function handleSecuritySubmit(e: React.FormEvent) {
    e.preventDefault()
    setSecError('')
    setSecSuccess(false)
    if (newPassword && newPassword !== confirmPassword) {
      setSecError('Les mots de passe ne correspondent pas')
      return
    }
    setSecLoading(true)
    try {
      await updateUser({
        email,
        currentPassword,
        ...(newPassword ? { newPassword } : {}),
      })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setSecSuccess(true)
    } catch (err: unknown) {
      setSecError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour')
    } finally {
      setSecLoading(false)
    }
  }

  return (
    <AuthGuard>
      <div className="flex flex-col min-h-full pb-20 bg-page">
        <header className="flex items-center gap-3 px-4 pt-12 pb-6">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full bg-surface-2 border border-theme text-muted hover:text-body transition"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-xl font-bold text-body">Modifier le profil</h1>
        </header>

        <div className="px-4 space-y-4">
          {/* Informations générales */}
          <form onSubmit={handleInfoSubmit} className="rounded-2xl bg-surface border border-theme p-5 space-y-4">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">Informations</p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-body mb-1.5">Prénom</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="input-theme w-full rounded-xl px-4 py-3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-body mb-1.5">Nom</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="input-theme w-full rounded-xl px-4 py-3"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-body mb-1.5">Pseudo</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                required
                className="input-theme w-full rounded-xl px-4 py-3"
              />
            </div>

            {infoError && (
              <p className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                {infoError}
              </p>
            )}
            {infoSuccess && (
              <p className="rounded-lg bg-primary-subtle border border-primary-subtle px-4 py-3 text-sm text-primary">
                Informations mises à jour
              </p>
            )}

            <button
              type="submit"
              disabled={infoLoading}
              className="w-full rounded-xl bg-primary py-3 font-semibold text-white transition hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {infoLoading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </form>

          {/* Sécurité */}
          <form onSubmit={handleSecuritySubmit} className="rounded-2xl bg-surface border border-theme p-5 space-y-4">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">Sécurité</p>

            <div>
              <label className="block text-sm font-medium text-body mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-theme w-full rounded-xl px-4 py-3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-body mb-1.5">Nouveau mot de passe</label>
              <PasswordInput value={newPassword} onChange={setNewPassword} autoComplete="new-password" />
              <p className="text-xs text-muted mt-1">Laisser vide pour ne pas changer</p>
            </div>

            {newPassword && (
              <div>
                <label className="block text-sm font-medium text-body mb-1.5">Confirmer le mot de passe</label>
                <PasswordInput value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-body mb-1.5">Mot de passe actuel</label>
              <PasswordInput value={currentPassword} onChange={setCurrentPassword} autoComplete="current-password" />
            </div>

            {secError && (
              <p className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                {secError}
              </p>
            )}
            {secSuccess && (
              <p className="rounded-lg bg-primary-subtle border border-primary-subtle px-4 py-3 text-sm text-primary">
                Informations de sécurité mises à jour
              </p>
            )}

            <button
              type="submit"
              disabled={secLoading}
              className="w-full rounded-xl bg-primary py-3 font-semibold text-white transition hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {secLoading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </form>
        </div>

        <BottomNav />
      </div>
    </AuthGuard>
  )
}
