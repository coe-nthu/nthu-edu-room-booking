type CookieReader = {
  getAll(): { name: string }[]
}

export function hasSupabaseAuthCookie(cookieReader: CookieReader) {
  return cookieReader
    .getAll()
    .some(({ name }) => name.startsWith("sb-") && name.includes("auth-token"))
}

