"use client"

import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        router.push('/dashboard')
      }
    })

    return () => subscription.unsubscribe()
  }, [router, supabase.auth])

  if (!isMounted) return null

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
      <div className="w-full max-w-md space-y-4 rounded-xl border bg-card p-8 shadow-sm">
        <div className="text-center">
          <h1 className="text-2xl font-bold">竹師教育學院</h1>
          <p className="text-sm text-muted-foreground">空間借用系統</p>
        </div>
        <Auth
          supabaseClient={supabase}
          appearance={{ 
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: 'oklch(0.205 0 0)',
                  brandAccent: 'oklch(0.145 0 0)',
                }
              }
            }
          }}
          providers={[]} // No social providers for now as per MVP
          localization={{
            variables: {
              sign_up: {
                email_label: '電子郵件',
                password_label: '密碼',
                email_input_placeholder: 'Your email address',
                password_input_placeholder: 'Your password',
                button_label: '註冊',
                loading_button_label: '註冊中 ...',
                social_provider_text: '使用 {{provider}} 註冊',
                link_text: '還沒有帳號？點此註冊',
                confirmation_text: '請查看您的信箱以進行驗證',
              },
              sign_in: {
                email_label: '電子郵件',
                password_label: '密碼',
                email_input_placeholder: 'Your email address',
                password_input_placeholder: 'Your password',
                button_label: '登入',
                loading_button_label: '登入中 ...',
                social_provider_text: '使用 {{provider}} 登入',
                link_text: '已經有帳號？點此登入',
              },
              forgotten_password: {
                email_label: '電子郵件',
                password_label: '密碼',
                email_input_placeholder: 'Your email address',
                button_label: '發送重設密碼信件',
                loading_button_label: '發送中 ...',
                link_text: '忘記密碼？',
                confirmation_text: '請查看您的信箱以重設密碼',
              },
            },
          }}
          theme="light"
        />
      </div>
    </div>
  )
}

