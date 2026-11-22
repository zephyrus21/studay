export function passwordProblem(newPw: string, confirm: string): string | null {
  if (newPw !== confirm) return "Passwords don't match"
  if (newPw.length < 8) return 'Use at least 8 characters'
  return null
}
