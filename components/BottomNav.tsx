'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { Cat, House, ListChecks, Repeat, User, type LucideIcon } from 'lucide-react'

type Tab = 'home' | 'revise' | 'todo' | 'mochi' | 'me'

export function activeTab(path: string): Tab | null {
  if (path === '/' || /^\/[stn]\//.test(path)) return 'home'
  if (path === '/revise') return 'revise'
  if (path === '/todo') return 'todo'
  if (path === '/ask') return 'mochi'
  if (path === '/me') return 'me'
  return null
}

const TABS: { id: Tab; href: string; icon: LucideIcon; label: string }[] = [
  { id: 'home', href: '/', icon: House, label: 'Home' },
  { id: 'revise', href: '/revise', icon: Repeat, label: 'Revise' },
  { id: 'todo', href: '/todo', icon: ListChecks, label: 'To-do' },
  { id: 'mochi', href: '/ask', icon: Cat, label: 'Mochi' },
  { id: 'me', href: '/me', icon: User, label: 'Me' },
]

export function BottomNav() {
  const tab = activeTab(usePathname())
  if (!tab) return null
  return (
    <>
      <div aria-hidden className="h-[calc(6.5rem+env(safe-area-inset-bottom))] shrink-0" />
      <nav className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-30 mx-auto flex h-16 max-w-md items-stretch rounded-[22px] px-1 bg-card shadow-nav">
        {TABS.map((t) => {
          const on = t.id === tab
          const raised = t.id === 'todo'
          return (
            <Link
              key={t.id}
              href={t.href}
              aria-current={on ? 'page' : undefined}
              className={`relative flex h-full min-h-11 flex-1 flex-col items-center text-[11px] leading-none font-bold ${raised ? 'justify-end pb-1.5' : 'justify-center gap-0.5'} ${on ? 'text-brand' : 'opacity-70'}`}
            >
              {raised ? (
                <span className={`absolute -top-5 grid h-14 w-14 place-items-center rounded-full ring-4 ring-bg shadow-fab text-on-accent ${on ? 'bg-brand' : 'bg-accent'}`}>
                  <t.icon size={24} aria-hidden />
                </span>
              ) : (
                <span className={`grid h-8 w-14 place-items-center rounded-full ${on ? 'bg-chip' : ''}`}>
                  <t.icon size={22} aria-hidden />
                </span>
              )}
              {t.label}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
