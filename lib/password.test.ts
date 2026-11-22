import { expect, test } from 'vitest'
import { passwordProblem } from '@/lib/password'

test('passwordProblem reports the spec message or null', () => {
  expect(passwordProblem('abc', 'abc')).toBe('Use at least 8 characters')
  expect(passwordProblem('abcdefgh', 'abcdefgx')).toBe("Passwords don't match")
  expect(passwordProblem('abcdefgh', 'abcdefgh')).toBeNull()
})
