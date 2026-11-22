'use client'
import { useState } from 'react'
import { Mochi } from '@/components/Mochi'
import { authClient } from '@/lib/auth/client'

const input = 'rounded-full border-[1.5px] border-line bg-card px-4 py-2 text-sm'

export default function SignIn() {
  const [firstTime, setFirstTime] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    if (firstTime) {
      const { error } = await authClient.signUp.email({ name, email, password })
      if (error) {
        setError(
          error.code?.startsWith('USER_ALREADY_EXISTS')
            ? 'That email is already set up — sign in instead'
            : error.message || 'Something went wrong, try again',
        )
        setBusy(false)
        return
      }
    } else {
      const { error } = await authClient.signIn.email({ email, password })
      if (error) {
        setError('Wrong email or password')
        setBusy(false)
        return
      }
    }
    window.location.href = '/'
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-bg p-6 text-ink">
      <Mochi size={120} />
      <h1 className="text-2xl font-bold">Studay</h1>
      <form onSubmit={submit} className="flex w-full max-w-xs flex-col gap-3">
        {firstTime && (
          <input
            aria-label="Name"
            placeholder="Your first name"
            required
            maxLength={100}
            autoComplete="given-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={input}
          />
        )}
        <input
          aria-label="Email"
          type="email"
          placeholder="Email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={input}
        />
        <input
          aria-label="Password"
          type="password"
          placeholder="Password"
          required
          minLength={8}
          autoComplete={firstTime ? 'new-password' : 'current-password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={input}
        />
        {error && <p className="text-sm text-brand">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl bg-accent px-6 py-3 font-bold text-on-accent disabled:opacity-50"
        >
          {firstTime ? 'Set password' : 'Sign in'}
        </button>
        <button
          type="button"
          onClick={() => {
            setFirstTime(!firstTime)
            setError('')
          }}
          className="text-sm text-brand"
        >
          {firstTime ? 'Already set up? Sign in' : 'First time? Set your password'}
        </button>
      </form>
    </main>
  )
}
