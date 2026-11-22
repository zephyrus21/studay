import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/server'
import { isAllowed } from '@/lib/allow'
import { todayIn } from '@/lib/progress'

type User = { id: string; name: string }

export async function apiUser(): Promise<User | null> {
  const { data: session } = await auth.getSession()
  const u = session?.user
  if (!u || !isAllowed(u.email)) return null
  return { id: u.id, name: u.name ?? '' }
}

export async function requireUser(): Promise<User> {
  const { data: session } = await auth.getSession()
  const u = session?.user
  if (!u) redirect('/auth/sign-in')
  if (!isAllowed(u.email)) redirect('/invite-only')
  return { id: u.id, name: u.name ?? '' }
}

export async function today(): Promise<string> {
  return todayIn((await cookies()).get('tz')?.value)
}
