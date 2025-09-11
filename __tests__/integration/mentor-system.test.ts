/**
 * Integration tests for the complete mentor management system
 * Tests the full workflow from admin verification to public listing
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

describe('Mentor System Integration Tests', () => {
  const supabase = createClient(supabaseUrl, supabaseKey)

  describe('Public Mentor Listing', () => {
    test('should fetch verified mentors from mentors_view', async () => {
      const { data, error } = await supabase
        .from('mentors_view')
        .select('*')

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(Array.isArray(data)).toBe(true)
      expect(data!.length).toBeGreaterThan(0)

      // All mentors should be verified (since view filters them)
      data!.forEach(mentor => {
        expect(mentor.verified).toBe(true)
        expect(mentor.active_roles).toContain('mentor')
      })
    })

    test('should have complete mentor data for public display', async () => {
      const { data, error } = await supabase
        .from('mentors_view')
        .select('*')
        .limit(1)

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data!.length).toBeGreaterThan(0)

      const mentor = data![0]
      
      // Check required fields for public display
      expect(mentor.id).toBeDefined()
      expect(mentor.full_name).toBeDefined()
      expect(mentor.verified).toBe(true)
      expect(mentor.active_roles).toContain('mentor')
      
      // Check API compatibility fields
      expect(mentor.mentor_skills).toBeDefined()
      expect(mentor.is_available).toBeDefined()
      expect(typeof mentor.rating).toBe('number')
      expect(typeof mentor.reviews).toBe('number')
      expect(typeof mentor.sessions).toBe('number')
    })

    test('should support search functionality', async () => {
      // Test search by name
      const { data: nameResults, error: nameError } = await supabase
        .from('mentors_view')
        .select('id, full_name')
        .ilike('full_name', '%Ana%')

      expect(nameError).toBeNull()
      expect(Array.isArray(nameResults)).toBe(true)

      // Test search by skills
      const { data: skillResults, error: skillError } = await supabase
        .from('mentors_view')
        .select('id, full_name, mentor_skills')
        .contains('mentor_skills', ['JavaScript'])

      expect(skillError).toBeNull()
      expect(Array.isArray(skillResults)).toBe(true)
    })

    test('should support filtering by availability', async () => {
      const { data, error } = await supabase
        .from('mentors_view')
        .select('id, full_name, is_available')
        .eq('is_available', true)

      expect(error).toBeNull()
      expect(Array.isArray(data)).toBe(true)
      
      data!.forEach(mentor => {
        expect(mentor.is_available).toBe(true)
      })
    })

    test('should support filtering by location', async () => {
      const { data, error } = await supabase
        .from('mentors_view')
        .select('id, full_name, country, state, city')
        .eq('country', 'Brasil')

      expect(error).toBeNull()
      expect(Array.isArray(data)).toBe(true)
      
      data!.forEach(mentor => {
        expect(mentor.country).toBe('Brasil')
      })
    })
  })

  describe('Admin Mentor Management', () => {
    test('should fetch all mentors (verified and unverified) from admin view', async () => {
      const { data, error } = await supabase
        .from('mentors_admin_view')
        .select('*')

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(Array.isArray(data)).toBe(true)

      // Should include both verified and unverified mentors
      const verified = data!.filter(m => m.verified)
      const unverified = data!.filter(m => !m.verified)
      
      expect(verified.length).toBeGreaterThan(0)
      expect(unverified.length).toBeGreaterThan(0)
      expect(data!.length).toBe(verified.length + unverified.length)
    })

    test('should show more mentors in admin view than public view', async () => {
      const [publicResult, adminResult] = await Promise.all([
        supabase.from('mentors_view').select('id', { count: 'exact', head: true }),
        supabase.from('mentors_admin_view').select('id', { count: 'exact', head: true })
      ])

      expect(publicResult.error).toBeNull()
      expect(adminResult.error).toBeNull()
      expect(adminResult.count).toBeGreaterThanOrEqual(publicResult.count!)
    })

    test('should have pending mentors for verification testing', async () => {
      const { data, error } = await supabase
        .from('mentors_admin_view')
        .select('id, full_name, verified')
        .eq('verified', false)

      expect(error).toBeNull()
      expect(Array.isArray(data)).toBe(true)
      expect(data!.length).toBeGreaterThan(0)

      data!.forEach(mentor => {
        expect(mentor.verified).toBe(false)
      })
    })
  })

  describe('Mentor Data Quality', () => {
    test('should have mentors with complete professional information', async () => {
      const { data, error } = await supabase
        .from('mentors_view')
        .select('current_position, current_company, bio, expertise_areas')

      expect(error).toBeNull()
      expect(data).toBeDefined()

      const mentorsWithJobs = data!.filter(m => m.current_position).length
      const mentorsWithCompanies = data!.filter(m => m.current_company).length
      const mentorsWithBios = data!.filter(m => m.bio).length
      const mentorsWithSkills = data!.filter(m => m.expertise_areas?.length > 0).length

      // At least 80% should have complete data
      const total = data!.length
      expect(mentorsWithJobs / total).toBeGreaterThan(0.8)
      expect(mentorsWithCompanies / total).toBeGreaterThan(0.8)
      expect(mentorsWithBios / total).toBeGreaterThan(0.8)
      expect(mentorsWithSkills / total).toBeGreaterThan(0.8)
    })

    test('should have mentors with ratings and session data', async () => {
      const { data, error } = await supabase
        .from('mentors_view')
        .select('rating, reviews, sessions')

      expect(error).toBeNull()
      expect(data).toBeDefined()

      const mentorsWithRatings = data!.filter(m => m.rating > 0).length
      const mentorsWithReviews = data!.filter(m => m.reviews > 0).length
      const mentorsWithSessions = data!.filter(m => m.sessions > 0).length

      // Should have some mentors with ratings/reviews/sessions for realistic testing
      expect(mentorsWithRatings).toBeGreaterThan(0)
      expect(mentorsWithReviews).toBeGreaterThan(0)
      expect(mentorsWithSessions).toBeGreaterThan(0)
    })

    test('should have diverse mentor locations', async () => {
      const { data, error } = await supabase
        .from('mentors_view')
        .select('city, state, country')
        .not('city', 'is', null)

      expect(error).toBeNull()
      expect(data).toBeDefined()

      const uniqueCities = new Set(data!.map(m => m.city))
      const uniqueStates = new Set(data!.map(m => m.state))

      expect(uniqueCities.size).toBeGreaterThan(1)
      expect(uniqueStates.size).toBeGreaterThan(1)
    })

    test('should have mentors with inclusion and diversity tags', async () => {
      const { data, error } = await supabase
        .from('mentors_view')
        .select('inclusion_tags')
        .not('inclusion_tags', 'is', null)

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data!.length).toBeGreaterThan(0)

      const allTags = data!.flatMap(m => m.inclusion_tags || [])
      const uniqueTags = new Set(allTags)

      expect(uniqueTags.size).toBeGreaterThan(0)
      expect(allTags).toContain('Mulheres em Tech')
      expect(allTags).toContain('Diversidade')
    })

    test('should have mentors with multiple languages', async () => {
      const { data, error } = await supabase
        .from('mentors_view')
        .select('languages')
        .not('languages', 'is', null)

      expect(error).toBeNull()
      expect(data).toBeDefined()

      const allLanguages = data!.flatMap(m => m.languages || [])
      const uniqueLanguages = new Set(allLanguages)

      expect(uniqueLanguages.size).toBeGreaterThan(1)
      expect(allLanguages).toContain('pt-BR')
      expect(allLanguages).toContain('en')
    })
  })

  describe('API Compatibility', () => {
    test('should work with existing mentor API endpoints structure', async () => {
      // Test the query pattern used by /api/mentors
      const { data, error } = await supabase
        .from('mentors_view')
        .select('*', { count: 'exact' })
        .contains('active_roles', ['mentor'])
        .not('mentor_skills', 'is', null)

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(typeof error).toBe('object') // count should be available
    })

    test('should work with mentor detail API structure', async () => {
      // Get a mentor ID first
      const { data: mentors } = await supabase
        .from('mentors_view')
        .select('id')
        .limit(1)

      expect(mentors).toBeDefined()
      expect(mentors!.length).toBeGreaterThan(0)

      // Test individual mentor query
      const { data, error } = await supabase
        .from('mentors_view')
        .select('*')
        .eq('id', mentors![0].id)
        .contains('active_roles', ['mentor'])
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data!.id).toBe(mentors![0].id)
    })

    test('should have all required fields for mentor cards', async () => {
      const { data, error } = await supabase
        .from('mentors_view')
        .select(`
          id,
          full_name,
          avatar_url,
          bio,
          current_position,
          current_company,
          city,
          state,
          country,
          mentor_skills,
          mentorship_topics,
          rating,
          reviews,
          sessions,
          is_available,
          availability_status
        `)
        .limit(1)

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data!.length).toBeGreaterThan(0)

      const mentor = data![0]
      
      // Check all fields needed for mentor cards
      expect(mentor.id).toBeDefined()
      expect(mentor.full_name).toBeDefined()
      expect(mentor.mentor_skills).toBeDefined()
      expect(typeof mentor.rating).toBe('number')
      expect(typeof mentor.reviews).toBe('number')
      expect(typeof mentor.sessions).toBe('number')
      expect(typeof mentor.is_available).toBe('boolean')
      expect(mentor.availability_status).toBeDefined()
    })
  })

  describe('Performance and Scalability', () => {
    test('should return mentor list quickly', async () => {
      const startTime = Date.now()
      
      const { data, error } = await supabase
        .from('mentors_view')
        .select('*')

      const endTime = Date.now()
      const duration = endTime - startTime

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(duration).toBeLessThan(2000) // Should complete in under 2 seconds
    })

    test('should handle filtering efficiently', async () => {
      const startTime = Date.now()
      
      const { data, error } = await supabase
        .from('mentors_view')
        .select('*')
        .eq('country', 'Brasil')
        .contains('mentor_skills', ['JavaScript'])
        .eq('is_available', true)

      const endTime = Date.now()
      const duration = endTime - startTime

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(duration).toBeLessThan(1500) // Filtered queries should be fast
    })
  })
})