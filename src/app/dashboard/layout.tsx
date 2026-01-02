import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 w-full">
        <div className="p-4 md:p-8 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </SidebarProvider>
  )
}

