import type { Database } from '@/lib/types/supabase'

export type ProfileRow = Database['public']['Tables']['profiles']['Row']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
export type MentorViewRow = Database['public']['Views']['mentors_view']['Row']

export interface AdminUserUpdate {
    first_name?: string
    last_name?: string
    bio?: string
    avatar_url?: string
    verified?: boolean
    verification_notes?: string
    is_public?: boolean
    institution?: string
    course?: string
    academic_level?: string
    expected_graduation?: string
}

// The class this file used to export (`adminService`) ran every admin
// mutation - update/delete a profile, list mentors, list pending feedbacks -
// straight from the browser's Supabase client (docs/COMMUNITY_CONTACT_PLAN.md
// §13). Its callers now go through app/api/admin/** instead:
//   - getAllMentors  -> GET /api/admin/mentors
//   - getPendingFeedbacks -> GET /api/admin/feedbacks
//   - updateUserProfile/setUserRoles/deleteUser had no callers left; the
//     equivalent admin actions already live in app/api/admin/users/**.
// Only the types above are still imported (components/admin/EditUserModal.tsx).
