'use client'

import { useState } from 'react'
import { Monitor, Moon, Sun } from 'lucide-react'

type Choice = 'system' | 'light' | 'dark'

const OPTIONS: { value: Choice; label: string; Icon: typeof Sun }[] = [
  { value: 'system', label: 'System', Icon: Monitor },
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
]

function applyTheme(value: Choice) {
  if (value === 'system') {
    document.cookie = 'theme=; path=/; max-age=0; samesite=lax'
    delete document.documentElement.dataset.theme
  } else {
    document.cookie = `theme=${value}; path=/; max-age=31536000; samesite=lax`
    document.documentElement.dataset.theme = value
  }
}

export function ThemePicker({ initial }: { initial: Choice }) {
  const [choice, setChoice] = useState<Choice>(initial)
  const pick = (value: Choice) => {
    setChoice(value)
    applyTheme(value)
  }
  return (
    <div role="group" aria-label="Appearance" className="grid grid-cols-3 gap-1 rounded-full bg-chip p-1">
      {OPTIONS.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          aria-pressed={choice === value}
          onClick={() => pick(value)}
          className={`flex min-h-11 items-center justify-center gap-1.5 rounded-full text-sm font-bold ${choice === value ? 'bg-accent text-on-accent' : 'text-ink'}`}
        >
          <Icon size={16} aria-hidden />
          {label}
        </button>
      ))}
    </div>
  )
}
