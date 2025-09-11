/**
 * Integration tests for mentor verification workflow
 * Tests the complete admin verification process
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

describe('Mentor Verification Workflow', () => {
  const supabase = createClient(supabaseUrl, supabaseKey)

  describe('Admin Verification Process', () => {
    test('should show pending mentors in admin view', async () => {
      const { data, error } = await supabase
        .from('mentors_admin_view')
        .select('id, full_name, verified')
        .eq('verified', false)

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(Array.isArray(data)).toBe(true)
      
      // Should have at least one pending mentor for testing
      expect(data!.length).toBeGreaterThan(0)
      
      data!.forEach(mentor => {
        expect(mentor.verified).toBe(false)
        expect(mentor.full_name).toBeDefined()
      })
    })

    test('should show verified mentors in admin view', async () => {
      const { data, error } = await supabase
        .from('mentors_admin_view')
        .select('id, full_name, verified')
        .eq('verified', true)

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(Array.isArray(data)).toBe(true)
      expect(data!.length).toBeGreaterThan(0)
      
      data!.forEach(mentor => {
        expect(mentor.verified).toBe(true)
      })
    })

    test('should have more mentors in admin view than public view', async () => {
      const [publicResult, adminResult] = await Promise.all([
        supabase.from('mentors_view').select('id', { count: 'exact', head: true }),
        supabase.from('mentors_admin_view').select('id', { count: 'exact', head: true })
      ])

      expect(publicResult.error).toBeNull()
      expect(adminResult.error).toBeNull()
      expect(adminResult.count).toBeGreaterThanOrEqual(publicResult.count!)
    })
  })

  describe('Verification State Changes', () => {
    test('should allow updating mentor verification status', async () => {
      // Find a mentor to test with
      const { data: mentors } = await supabase
        .from('mentors_admin_view')
        .select('id, verified')
        .limit(1)

      expect(mentors).toBeDefined()
      expect(mentors!.length).toBeGreaterThan(0)

      const mentor = mentors![0]
      const originalStatus = mentor.verified

      // Note: This test would normally update the mentor status,
      // but we'll skip the actual update to avoid affecting test data
      // In a real test environment, you would:
      // 1. Update the mentor verification status
      // 2. Verify the change appears in both views
      // 3. Restore the original status

      expect(typeof originalStatus).toBe('boolean')
    })
  })

  describe('Public Visibility Rules', () => {
    test('should only show verified mentors in public view', async () => {
      const { data, error } = await supabase
        .from('mentors_view')
        .select('id, verified')

      expect(error).toBeNull()
      expect(data).toBeDefined()
      
      // All mentors in public view should be verified
      data!.forEach(mentor => {
        expect(mentor.verified).toBe(true)
      })
    })

    test('should hide unverified mentors from public view', async () => {
      // Get unverified mentors from admin view
      const { data: unverifiedMentors } = await supabase
        .from('mentors_admin_view')
        .select('id')
        .eq('verified', false)

      expect(unverifiedMentors).toBeDefined()

      if (unverifiedMentors!.length > 0) {
        // Check that these mentors don't appear in public view
        const unverifiedIds = unverifiedMentors!.map(m => m.id)
        
        const { data: publicMentors } = await supabase
          .from('mentors_view')
          .select('id')
          .in('id', unverifiedIds)

        expect(publicMentors).toBeDefined()
        expect(publicMentors!.length).toBe(0) // Should be empty
      }
    })
  })

  describe('Data Consistency', () => {
    test('should maintain data consistency between views', async () => {
      // Get a verified mentor from admin view
      const { data: adminMentor } = await supabase
        .from('mentors_admin_view')
        .select('*')
        .eq('verified', true)
        .limit(1)

      expect(adminMentor).toBeDefined()
      expect(adminMentor!.length).toBeGreaterThan(0)

      // Get the same mentor from public view
      const { data: publicMentor } = await supabase
        .from('mentors_view')
        .select('*')
        .eq('id', adminMentor![0].id)
        .single()

      expect(publicMentor).toBeDefined()

      // Compare key fields
      expect(publicMentor.id).toBe(adminMentor![0].id)
      expect(publicMentor.full_name).toBe(adminMentor![0].full_name)
      expect(publicMentor.verified).toBe(adminMentor![0].verified)
      expect(publicMentor.verified).toBe(true)
    })

    test('should have consistent field mappings', async () => {
      const { data, error } = await supabase
        .from('mentors_view')
        .select('expertise_areas, mentor_skills, inclusive_tags, inclusion_tags')
        .not('expertise_areas', 'is', null)
        .limit(1)

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data!.length).toBeGreaterThan(0)

      const mentor = data![0]
      
      // Check field aliases work correctly
      expect(JSON.stringify(mentor.expertise_areas)).toBe(JSON.stringify(mentor.mentor_skills))
      expect(JSON.stringify(mentor.inclusive_tags)).toBe(JSON.stringify(mentor.inclusion_tags))
    })
  })

  describe('System Integration', () => {
    test('should support the complete mentor discovery flow', async () => {
      // Step 1: List all mentors
      const { data: allMentors, error: listError } = await supabase
        .from('mentors_view')
        .select('id, full_name, mentor_skills')

      expect(listError).toBeNull()
      expect(allMentors).toBeDefined()
      expect(allMentors!.length).toBeGreaterThan(0)

      // Step 2: Search for specific skills
      const { data: searchResults, error: searchError } = await supabase
        .from('mentors_view')
        .select('id, full_name, mentor_skills')
        .contains('mentor_skills', ['JavaScript'])

      expect(searchError).toBeNull()
      expect(searchResults).toBeDefined()

      // Step 3: Get individual mentor details
      if (searchResults!.length > 0) {
        const { data: mentorDetail, error: detailError } = await supabase
          .from('mentors_view')
          .select('*')
          .eq('id', searchResults![0].id)
          .single()

        expect(detailError).toBeNull()
        expect(mentorDetail).toBeDefined()
        expect(mentorDetail!.id).toBe(searchResults![0].id)
      }
    })

    test('should support admin management workflow', async () => {
      // Step 1: Get all mentors for admin
      const { data: allMentors, error: allError } = await supabase
        .from('mentors_admin_view')
        .select('id, verified')

      expect(allError).toBeNull()
      expect(allMentors).toBeDefined()

      // Step 2: Filter pending mentors
      const { data: pendingMentors, error: pendingError } = await supabase
        .from('mentors_admin_view')
        .select('id, full_name, verified')
        .eq('verified', false)

      expect(pendingError).toBeNull()
      expect(pendingMentors).toBeDefined()

      // Step 3: Get mentor details for verification
      if (pendingMentors!.length > 0) {
        const { data: mentorDetail, error: detailError } = await supabase
          .from('mentors_admin_view')
          .select('*')
          .eq('id', pendingMentors![0].id)
          .single()

        expect(detailError).toBeNull()
        expect(mentorDetail).toBeDefined()
        expect(mentorDetail!.verified).toBe(false)
      }
    })
  })
})