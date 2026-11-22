import Link from 'next/link'
import type { ReactNode } from 'react'

export function PageHeader({ title, back, right }: { title: ReactNode; back?: { href: string; label: string }; right?: ReactNode }) {
  return (
    <header className="sticky top-0 z-20 -mx-4 bg-bg/90 px-4 pb-2 pt-3 backdrop-blur">
      {back && (
        <Link href={back.href} className="flex min-h-11 max-w-full items-center truncate font-bold text-brand">
          ‹ {back.label}
        </Link>
      )}
      <div className="flex items-center justify-between gap-2">
        <h1 className="min-w-0 flex-1 truncate text-2xl font-black">{title}</h1>
        {right}
      </div>
    </header>
  )
}
