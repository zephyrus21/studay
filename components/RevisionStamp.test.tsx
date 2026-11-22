import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { RevisionStamp } from './RevisionStamp'

describe('RevisionStamp', () => {
  it('stamp', () => {
    expect(renderToStaticMarkup(<RevisionStamp count={2} done />)).toContain('REVISED ×2')
    expect(renderToStaticMarkup(<RevisionStamp count={0} done />)).toContain('DUE')
    expect(renderToStaticMarkup(<RevisionStamp count={0} done={false} />)).toBe('')
  })
})
