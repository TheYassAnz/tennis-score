'use client'

import { useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { Target } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await api.forgotPassword(email)
    } finally {
      setLoading(false)
      setSubmitted(true)
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
          <h1 className="text-2xl font-bold text-body">Mot de passe oublié</h1>
          <p className="mt-1 text-sm text-muted">
            Entrez votre email pour recevoir un lien de réinitialisation
          </p>
        </div>

        {submitted ? (
          <div className="rounded-2xl bg-primary-subtle border border-primary-subtle px-6 py-5 text-center">
            <p className="font-semibold text-primary mb-1">Email envoyé !</p>
            <p className="text-sm text-muted">
              Si cet email est associé à un compte, vous recevrez un lien dans quelques instants.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-body mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="input-theme w-full rounded-xl px-4 py-3.5"
                placeholder="vous@exemple.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-primary py-3.5 font-semibold text-white transition hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Envoi...' : 'Envoyer le lien'}
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
