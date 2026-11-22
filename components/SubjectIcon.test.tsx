import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ICONS } from '@/lib/icons'
import { SUBJECT_LABELS, SubjectIcon } from './SubjectIcon'

describe('SubjectIcon', () => {
  it('renders a Lucide svg for a stored emoji key', () => {
    expect(renderToStaticMarkup(<SubjectIcon icon="🫀" />)).toContain('<svg')
  })
  it('falls back to a Lucide svg for an unknown key, distinct from the mapped one', () => {
    const fallback = renderToStaticMarkup(<SubjectIcon icon="nonsense" />)
    expect(fallback).toContain('<svg')
    expect(fallback).not.toBe(renderToStaticMarkup(<SubjectIcon icon="🫀" />))
  })
  it('every stored key maps to its own icon, except 🩺 which is the fallback', () => {
    const fallback = renderToStaticMarkup(<SubjectIcon icon="nonsense" />)
    for (const key of ICONS) {
      const markup = renderToStaticMarkup(<SubjectIcon icon={key} />)
      if (key === '🩺') expect(markup).toBe(fallback)
      else expect(markup, key).not.toBe(fallback)
    }
  })
  it('every stored key has an accessible label', () => {
    for (const key of ICONS) expect(SUBJECT_LABELS[key], key).toBeTruthy()
  })
})
