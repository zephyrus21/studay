export function isAllowed(
  email: string | null | undefined,
  list: string = process.env.ALLOWED_EMAILS ?? '',
): boolean {
  if (!email) return false
  const e = email.trim().toLowerCase()
  return list.split(',').some((x) => x.trim().toLowerCase() === e && e !== '')
}
