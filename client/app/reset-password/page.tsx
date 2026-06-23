'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import { Target } from 'lucide-react'
import PasswordInput from '@/components/PasswordInput'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token) setError('Lien invalide ou expiré.')
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('Le mot de passe doit faire au moins 6 caractères')
      return
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas')
      return
    }
    setLoading(true)
    try {
      await api.resetPassword(token!, password)
      setSuccess(true)
      setTimeout(() => router.push('/login'), 2500)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lien invalide ou expiré')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-6 py-12 bg-page">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-2xl bg-primary-subtle">
              <Target size={36} className="text-primary" strokeWidth={1.5} />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-body">Nouveau mot de passe</h1>
          <p className="mt-1 text-sm text-muted">Choisissez un mot de passe sécurisé</p>
        </div>

        {success ? (
          <div className="rounded-2xl bg-primary-subtle border border-primary-subtle px-6 py-5 text-center">
            <p className="font-semibold text-primary mb-1">Mot de passe mis à jour !</p>
            <p className="text-sm text-muted">Redirection vers la connexion…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-body mb-1.5">
                Nouveau mot de passe
              </label>
              <PasswordInput value={password} onChange={setPassword} autoComplete="new-password" />
            </div>

            <div>
              <label className="block text-sm font-medium text-body mb-1.5">
                Confirmer le mot de passe
              </label>
              <PasswordInput value={confirm} onChange={setConfirm} autoComplete="new-password" />
            </div>

            {error && (
              <p className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !token}
              className="w-full rounded-xl bg-primary py-3.5 font-semibold text-white transition hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Enregistrement...' : 'Enregistrer le mot de passe'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-muted">
          <Link href="/login" className="text-primary font-medium hover:text-primary-hover">
            Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
