# Implementation Plan

- [x] 1. Apply database permission fixes



  - Apply the RLS policy fix for roles table access
  - Verify user_roles table permissions are working
  - Test role selection functionality in local environment
  - _Requirements: 2.1, 2.2_



- [x] 2. Fix middleware conflicts



  - Remove duplicate middleware implementations
  - Consolidate to single middleware approach in root middleware.ts
  - Update utils/supabase/middleware.ts to be utility-only

  - Test authentication flow after middleware consolidation
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 3. Test role selection end-to-end


  - Test role selection with OAuth users (Google/LinkedIn/GitHub)
  - Test role selection with manual registration users
  - Verify JWT claims are updated after role selection
  - Test redirect flow after successful role selection
  - _Requirements: 2.3, 2.4, 2.5_

- [ ] 4. Fix authentication context state management
  - Resolve conflicts between JWT claims and profile data
  - Implement profile-first approach (profile data as source of truth)
  - Add automatic profile refresh when role changes
  - Fix needsRoleSelection() and needsVerification() logic
  - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 5.1, 5.2, 5.3_

- [ ] 5. Standardize user metadata handling
  - Create consistent metadata mapping for all OAuth providers
  - Fix user creation trigger to handle all OAuth providers consistently
  - Ensure manual registration creates same profile structure as OAuth
  - Test with Google, LinkedIn, and GitHub OAuth flows
  - _Requirements: 3.4, 3.5_

- [x] 6. Improve error handling and user feedback


  - Add proper error handling in RoleSelectionModal
  - Implement graceful fallbacks for database permission errors
  - Add meaningful error messages for authentication failures
  - Test error scenarios and edge cases
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 7. Deploy fixes to production
  - Apply database migration to production Supabase instance
  - Deploy updated code to production environment
  - Test complete authentication flow in production
  - Monitor for any remaining issues
  - _Requirements: All requirements verification in production_