'use client'

import { useState } from 'react'
import { KeyRound } from 'lucide-react'
import { Sheet } from '@/components/Sheet'
import { btn, input } from '@/components/Forms'
import { authClient } from '@/lib/auth/client'
import { passwordProblem } from '@/lib/password'

function PasswordBody({ close }: { close: () => void }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const problem = passwordProblem(next, confirm)
    if (problem) return setError(problem)
    setBusy(true)
    setError('')
    try {
      const { error } = await authClient.changePassword({ currentPassword: current, newPassword: next, revokeOtherSessions: true })
      if (error) throw error
      setDone(true)
    } catch (err) {
      // Neon's client throws a 4xx as AuthApiError and renames INVALID_PASSWORD to invalid_credentials.
      const code = (err as { code?: string })?.code
      setError(code === 'invalid_credentials' || code === 'INVALID_PASSWORD' ? 'Current password is wrong' : 'Something went wrong, try again')
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <div className="space-y-3">
        <p className="font-bold">Password changed</p>
        <button type="button" onClick={close} className={`${btn} w-full`}>Done</button>
      </div>
    )
  }

  return (
    <form noValidate className="space-y-3" onSubmit={submit}>
      <input type="password" required autoComplete="current-password" aria-label="Current password" placeholder="Current password" value={current} onChange={(e) => setCurrent(e.target.value)} className={input} />
      <input type="password" required autoComplete="new-password" aria-label="New password" placeholder="New password (min 8)" value={next} onChange={(e) => setNext(e.target.value)} className={input} />
      <input type="password" required autoComplete="new-password" aria-label="Confirm new password" placeholder="Confirm new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={input} />
      {error && <p role="alert" className="text-sm text-brand">{error}</p>}
      <button disabled={busy} className={`${btn} w-full`}>Change password</button>
    </form>
  )
}

export function ChangePassword() {
  return (
    <Sheet
      title="Change password"
      trigger={(open) => (
        <button type="button" onClick={open} className="flex min-h-11 w-full items-center gap-2 rounded-[20px] bg-card px-4 py-3 font-bold shadow-card">
          <KeyRound size={18} aria-hidden />
          Change password
        </button>
      )}
    >
      {(close) => <PasswordBody close={close} />}
    </Sheet>
  )
}
