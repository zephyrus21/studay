import { expect, test } from 'vitest'
import { activeTab } from './BottomNav'

test('activeTab maps routes to tabs', () => {
  expect(activeTab('/')).toBe('home')
  expect(activeTab('/s/abc')).toBe('home')
  expect(activeTab('/t/abc')).toBe('home')
  expect(activeTab('/n/abc')).toBe('home')
  expect(activeTab('/revise')).toBe('revise')
  expect(activeTab('/ask')).toBe('mochi')
  expect(activeTab('/me')).toBe('me')
  expect(activeTab('/todo')).toBe('todo')
  expect(activeTab('/auth/sign-in')).toBeNull()
  expect(activeTab('/invite-only')).toBeNull()
})
