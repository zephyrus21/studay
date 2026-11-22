export function themeFrom(v: string | undefined): 'light' | 'dark' | undefined {
  return v === 'light' || v === 'dark' ? v : undefined
}
