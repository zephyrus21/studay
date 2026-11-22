'use client'
import { useEffect } from 'react'

export default function TzCookie() {
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (!document.cookie.split('; ').includes(`tz=${tz}`)) {
      document.cookie = `tz=${tz}; path=/; max-age=31536000; samesite=lax`
    }
  }, [])
  return null
}
