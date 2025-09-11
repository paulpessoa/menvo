"use client"

import { RequireRole } from "@/lib/auth/auth-guard"
import { MentorManagementPanel } from "@/components/admin/MentorManagementPanel"
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb"

export default function AdminMentorsPage() {
    return (
        <RequireRole roles={['admin']}>
            <div className="container mx-auto px-4 py-8">
                <AdminBreadcrumb />
                <MentorManagementPanel />
            </div>
        </RequireRole>
    )
}