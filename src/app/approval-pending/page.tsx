"use client"

import { Button } from "@/components/ui/button"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { LogOut, Clock, RefreshCw } from "lucide-react"
import { useEffect, useState } from "react"

export default function ApprovalPendingPage() {
  const supabase = createClient()
  const router = useRouter()
  const [debugInfo, setDebugInfo] = useState<any>(null)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  const checkStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('role, is_approved')
            .eq('id', user.id)
            .single()
        
        setDebugInfo({
            email: user.email,
            id: user.id,
            role: profile?.role,
            is_approved: profile?.is_approved,
            error: error?.message
        })

        // If actually approved or admin, redirect
        if (profile?.role === 'admin' || profile?.is_approved) {
            router.push('/dashboard')
        }
    }
  }

  useEffect(() => {
    checkStatus()
  }, [])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/50 p-4">
      <div className="w-full max-w-md space-y-8 rounded-xl border bg-card p-8 shadow-sm text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-yellow-100">
          <Clock className="h-10 w-10 text-yellow-600" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">帳號審核中</h1>
          <p className="text-muted-foreground">
            您的帳號已成功註冊，目前正在等待管理員審核。
            <br />
            審核通過後，您將會收到電子郵件通知。
          </p>
        </div>

        <div className="space-y-4 pt-4">
          <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
            <p>若有急需，請聯繫系辦公室或系統管理員。</p>
          </div>
          
          <Button 
            variant="outline" 
            className="w-full gap-2"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            登出
          </Button>
        </div>
      </div>
    </div>
  )
}
