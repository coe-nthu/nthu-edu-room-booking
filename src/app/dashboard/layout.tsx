import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 w-full">
        <div className="p-4 flex items-center gap-2 border-b bg-background sticky top-0 z-10">
          <SidebarTrigger />
          <h1 className="text-lg font-semibold">空間借用系統</h1>
        </div>
        <div className="p-4 md:p-8 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </SidebarProvider>
  )
}

