import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const type = requestUrl.searchParams.get('type')
  const next = requestUrl.searchParams.get('next') || '/dashboard'
  const authErrorCode = requestUrl.searchParams.get('error_code')
  const authError = requestUrl.searchParams.get('error')

  if (authError || authErrorCode) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('reset', 'expired')
    return NextResponse.redirect(loginUrl)
  }

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
            getAll() {
                return cookieStore.getAll()
            },
            setAll(cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options }) =>
                    cookieStore.set(name, value, options)
                    )
                } catch {}
            },
        },
      }
    )
    
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
        // 根據 type 決定重定向目標
        // signup: 註冊確認後導向 dashboard
        // recovery: 重設密碼流程導向 reset-password
        const redirectPath = type === 'recovery' ? '/reset-password' : next
        return NextResponse.redirect(new URL(redirectPath, request.url))
    }
  }

  // Return the user to login with a clear recovery path.
  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set('reset', 'expired')
  return NextResponse.redirect(loginUrl)
}
