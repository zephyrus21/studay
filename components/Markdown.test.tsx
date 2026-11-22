import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Markdown } from './Markdown'

describe('Markdown', () => {
  it('notes do not render raw html', () => {
    const out = renderToStaticMarkup(<Markdown text={'<script>alert(1)</script><img src=x onerror=alert(1)>'} />)
    expect(out).not.toContain('<script')
    expect(out).not.toContain('<img')
  })
  it('markdown basics', () => {
    const out = renderToStaticMarkup(<Markdown text={'# Hi\n- a'} />)
    expect(out).toContain('<h1')
    expect(out).toContain('<li')
  })
})
