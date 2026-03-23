import { Suspense } from "react"
import { AdminUsersClient } from "./admin-users-client"
import { getUsers } from "@/app/actions/admin-users"
import { Loader2 } from "lucide-react"

export const dynamic = 'force-dynamic'

async function UsersLoader() {
    const users = await getUsers()
    return <AdminUsersClient initialUsers={users} />
}

export default function AdminUsersPage() {
    return (
        <Suspense fallback={
            <div className="flex h-[50vh] w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        }>
            <UsersLoader />
        </Suspense>
    )
}
