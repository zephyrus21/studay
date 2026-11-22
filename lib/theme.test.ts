import { expect, test } from 'vitest'
import { themeFrom } from '@/lib/theme'

test('themeFrom accepts only light and dark', () => {
  expect(themeFrom('light')).toBe('light')
  expect(themeFrom('dark')).toBe('dark')
  expect(themeFrom(undefined)).toBeUndefined()
  expect(themeFrom('')).toBeUndefined()
  expect(themeFrom('blue')).toBeUndefined()
})
