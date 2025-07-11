import { supabase } from '@/services/auth/supabase'

interface CompleteVerificationParams {
  verificationId: string
  adminId: string
  passed: boolean
  notes?: string
}

interface Verification {
  id: string
  mentor_id: string
  verification_type: string
  status: string
  created_at: string
  mentor_name: string
  mentor_email: string
  mentor_title: string
  mentor_company: string
}

class VerificationServiceClass {
  async getPendingVerifications(adminId: string): Promise<Verification[]> {
    // Fetch pending verifications
    const { data: verifications, error } = await supabase
      .from('mentor_verification')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(50)

    if (error) {
      throw new Error(`Error fetching pending verifications: ${error.message}`)
    }

    if (!verifications || verifications.length === 0) {
      return []
    }

    // Fetch mentor info for each verification
    const mentorIds = verifications.map(v => v.mentor_id)
    const { data: mentors, error: mentorsError } = await supabase
      .from('mentors')
      .select(`
        id,
        user_id,
        title,
        company
      `)
      .in('id', mentorIds)

    if (mentorsError) {
      throw new Error(`Error fetching mentors: ${mentorsError.message}`)
    }

    // Fetch profiles for mentors
    const userIds = mentors?.map(m => m.user_id) || []
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        email
      `)
      .in('id', userIds)

    if (profilesError) {
      throw new Error(`Error fetching profiles: ${profilesError.message}`)
    }

    // Map mentor and profile info to verifications
    const mentorMap = new Map(mentors?.map(m => [m.id, m]))
    const profileMap = new Map(profiles?.map(p => [p.id, p]))

    const result: Verification[] = verifications.map(v => {
      const mentor = mentorMap.get(v.mentor_id)
      const profile = mentor ? profileMap.get(mentor.user_id) : null
      return {
        id: v.id,
        mentor_id: v.mentor_id,
        verification_type: v.verification_type,
        status: v.status,
        created_at: v.created_at,
        mentor_name: profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown',
        mentor_email: profile ? profile.email : 'Unknown',
        mentor_title: mentor?.title || '',
        mentor_company: mentor?.company || ''
      }
    })

    return result
  }

  async completeVerification(params: CompleteVerificationParams): Promise<void> {
    const { verificationId, adminId, passed, notes } = params

    const updates = {
      status: passed ? 'completed' : 'rejected',
      completed_at: new Date().toISOString(),
      verified_by: adminId,
      verification_notes: notes || null,
      updated_at: new Date().toISOString()
    }

    const { data: verification, error } = await supabase
      .from('mentor_verification')
      .select('mentor_id')
      .eq('id', verificationId)
      .single()

    if (error || !verification) {
      throw new Error(`Verification not found: ${error?.message || 'No data'}`)
    }

    const { error: updateError } = await supabase
      .from('mentor_verification')
      .update(updates)
      .eq('id', verificationId)

    if (updateError) {
      throw new Error(`Error updating verification: ${updateError.message}`)
    }

    if (passed) {
      // Update mentor status to 'verified' and set verified_by and verified_at
      const { error: mentorError } = await supabase
        .from('mentors')
        .update({
          status: 'verified',
          verified_at: new Date().toISOString(),
          verified_by: adminId,
          updated_at: new Date().toISOString()
        })
        .eq('id', verification.mentor_id)

      if (mentorError) {
        throw new Error(`Error updating mentor status: ${mentorError.message}`)
      }
    }
  }
}

export const VerificationService = new VerificationServiceClass()
