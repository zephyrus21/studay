'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { Cat, House, Repeat, User, type LucideIcon } from 'lucide-react'

type Tab = 'home' | 'revise' | 'mochi' | 'me'

export function activeTab(path: string): Tab | null {
  if (path === '/' || /^\/[stn]\//.test(path)) return 'home'
  if (path === '/revise') return 'revise'
  if (path === '/ask') return 'mochi'
  if (path === '/me') return 'me'
  return null
}

const TABS: { id: Tab; href: string; icon: LucideIcon; label: string }[] = [
  { id: 'home', href: '/', icon: House, label: 'Home' },
  { id: 'revise', href: '/revise', icon: Repeat, label: 'Revise' },
  { id: 'mochi', href: '/ask', icon: Cat, label: 'Mochi' },
  { id: 'me', href: '/me', icon: User, label: 'Me' },
]

export function BottomNav() {
  const tab = activeTab(usePathname())
  if (!tab) return null
  return (
    <>
      <div aria-hidden className="h-[calc(5.75rem+env(safe-area-inset-bottom))] shrink-0" />
      <nav className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-30 mx-auto flex h-16 max-w-md items-stretch rounded-[22px] px-1 bg-card shadow-nav">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={t.href}
            aria-current={t.id === tab ? 'page' : undefined}
            className={`flex h-full min-h-11 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] leading-none font-bold ${t.id === tab ? 'text-brand' : 'opacity-70'}`}
          >
            <span className={`grid h-8 w-14 place-items-center rounded-full ${t.id === tab ? 'bg-chip' : ''}`}>
              <t.icon size={22} aria-hidden />
            </span>
            {t.label}
          </Link>
        ))}
      </nav>
    </>
  )
}
