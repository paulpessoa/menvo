# Implementation Plan

- [x] 1. Audit and document current authentication system




  - Create comprehensive inventory of all auth-related files and their purposes
  - Document current data flow and identify redundancies
  - Map out all authentication hooks, contexts, and services currently in use
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_




- [ ] 2. Remove duplicate and conflicting authentication hooks
  - [ ] 2.1 Remove redundant useRoleManagement hook
    - Delete `hooks/useRoleManagement.ts` file
    - Find and update all imports to use simplified auth instead
    - _Requirements: 1.1, 1.4_

  - [ ] 2.2 Remove redundant useRoleSelection hook  
    - Delete `hooks/useRoleSelection.ts` file
    - Update components to use main auth context for role selection
    - _Requirements: 1.1, 1.4_

  - [ ] 2.3 Remove redundant usePermissions hook
    - Delete `hooks/usePermissions.ts` file


    - Integrate simple permission logic into main auth context
    - _Requirements: 1.1, 1.4, 3.1, 3.2, 3.3, 3.4, 3.5_


- [ ] 3. Consolidate authentication services
  - [ ] 3.1 Remove JWT-based roleService complexity
    - Simplify `services/auth/roleService.ts` to use database-only approach
    - Remove JWT metadata dependencies and complex state management
    - _Requirements: 1.3, 2.3_



  - [ ] 3.2 Remove redundant userService
    - Delete `services/auth/userService.ts` file

    - Move essential user operations to main auth service
    - _Requirements: 1.3, 4.2_

- [ ] 4. Unify authentication context and hooks
  - [x] 4.1 Consolidate auth context implementation


    - Merge functionality from `lib/auth/auth-context.tsx` and `lib/auth/use-auth.ts`
    - Create single, comprehensive auth context with all needed functionality
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 2.4, 2.5_



  - [ ] 4.2 Update main useAuth hook
    - Simplify `hooks/useAuth.ts` to be the single source of auth functionality
    - Include role management, permissions, and session management
    - _Requirements: 1.1, 2.1, 2.2, 2.3, 2.4, 2.5_



- [ ] 5. Simplify API endpoints
  - [ ] 5.1 Consolidate role selection APIs
    - Keep only `/api/auth/select-role` endpoint
    - Remove `/api/auth/update-role` duplicate endpoint


    - Update endpoint to handle all role selection scenarios
    - _Requirements: 1.5, 2.3_

  - [ ] 5.2 Remove unnecessary auth APIs
    - Remove `/api/auth/custom-claims` endpoint
    - Remove OAuth diagnostic endpoints if not essential
    - Keep only essential endpoints: `/api/auth/me`, `/api/auth/select-role`
    - _Requirements: 1.5_

- [ ] 6. Simplify authentication redirect logic
  - [ ] 6.1 Streamline auth-redirect utility
    - Simplify `lib/auth-redirect.ts` to basic role-based redirects
    - Remove complex profile completion and verification status checks
    - Implement simple redirect: no role → role selection, has role → dashboard
    - _Requirements: 2.1, 2.2, 2.3_



  - [ ] 6.2 Update auth guard components
    - Simplify `lib/auth/auth-guard.tsx` to use new simplified logic

    - Remove complex verification and profile completion checks
    - _Requirements: 2.1, 2.4_

- [ ] 7. Update authentication components
  - [x] 7.1 Update role selection components


    - Simplify role selection modal and components to use new auth context
    - Remove complex state management and use simple role selection
    - _Requirements: 2.2, 2.3_


  - [ ] 7.2 Update login and registration forms
    - Update forms to use simplified auth context
    - Remove complex redirect logic and use simple role-based redirects
    - _Requirements: 2.1, 2.5_



- [ ] 8. Implement simplified permission system
  - [ ] 8.1 Create simple permission checking logic
    - Implement basic role-based permissions: admin (all), mentor (mentorship), mentee (booking)

    - Remove complex permission matrices and use simple role checks
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ] 8.2 Update components to use simplified permissions
    - Update all components using permission checks to use new simple system


    - Replace complex permission logic with basic role checks
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 9. Clean up database and remove unused structures
  - [ ] 9.1 Verify database schema consistency
    - Ensure profiles, roles, and user_roles tables are properly structured
    - Verify RLS policies are working correctly for simplified system
    - _Requirements: 4.1, 4.2, 4.4, 4.5_

  - [ ] 9.2 Remove unused database functions and triggers
    - Remove any complex database functions related to JWT management
    - Keep only essential triggers for profile creation and updates
    - _Requirements: 4.2, 4.3, 4.5_

- [ ] 10. Test and validate simplified authentication system
  - [ ] 10.1 Test complete authentication flows
    - Test user registration → role selection → dashboard access
    - Test login with existing users and proper role-based redirects
    - Test logout and session cleanup
    - _Requirements: 5.1, 5.2, 5.4_

  - [ ] 10.2 Test permission system functionality
    - Test role-based access to different features
    - Test admin access to all features
    - Test mentor and mentee specific permissions
    - _Requirements: 5.3, 3.2, 3.3, 3.4_

  - [ ] 10.3 Validate error handling and edge cases
    - Test authentication errors and recovery
    - Test network failures and retry mechanisms
    - Ensure no console errors related to authentication
    - _Requirements: 5.5_
