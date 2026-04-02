'use client'

import { useState } from 'react'

export default function EmailCapture() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('loading')
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      if (!res.ok) throw new Error()
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  return (
    <section className="bg-black-deep border-y border-border-subtle py-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-xl text-center">
        <h2 className="text-2xl font-bold text-white">
          Get the Brief Interrogation Checklist
        </h2>
        <p className="mt-2 text-sm text-white-muted">
          The 8-point checklist our AI uses to score your brief. Yours free.
        </p>
        {status === 'done' ? (
          <p className="mt-6 text-sm font-medium text-green-600">
            Check your inbox. The checklist is on its way.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 flex gap-2 max-w-md mx-auto">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@agency.com"
              className="flex-1 rounded-lg border border-border-subtle bg-black-card text-white placeholder-white-dim px-4 py-2.5 text-sm focus:border-red-hot focus:ring-2 focus:ring-red-hot outline-none"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="rounded-lg bg-red-hot px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-dim transition-colors disabled:opacity-60"
            >
              {status === 'loading' ? 'Sending...' : 'Send it'}
            </button>
          </form>
        )}
        {status === 'error' && (
          <p className="mt-2 text-xs text-red-500">Something went wrong. Try again.</p>
        )}
        <p className="mt-3 text-xs text-white-dim">No spam. Unsubscribe anytime.</p>
      </div>
    </section>
  )
}
