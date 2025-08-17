# Implementation Plan

- [ ] 1. Database Schema Cleanup and Consolidation
  - Remove redundant SQL scripts and create unified schema
  - Backup existing data before making changes
  - Create single consolidated SQL script for authentication system
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 1.1 Analyze and backup existing database state


  - Create backup script for existing user data in auth.users and profiles tables
  - Document current table structures and relationships
  - Identify data that needs to be preserved during migration
  - _Requirements: 1.1_




- [ ] 1.2 Create consolidated authentication schema script
  - Write unified SQL script that replaces all existing scripts in /scripts folder
  - Include proper ENUM types, tables, functions, triggers, and RLS policies
  - Implement handle_new_user() function for both OAuth and email/password flows




  - Implement custom_access_token_hook() function for JWT customization



  - _Requirements: 1.1, 1.2, 1.3, 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 1.3 Remove redundant SQL scripts
  - Delete obsolete SQL files from /scripts folder
  - Keep only the new consolidated script and any necessary migration scripts
  - Update documentation to reference the new script structure
  - _Requirements: 1.1_


- [x] 2. Backend Authentication Functions Implementation


  - Implement unified user registration handling
  - Set up JWT token customization
  - Configure proper RBAC system

  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.3, 3.4, 3.5, 3.6, 3.7, 4.1, 4.2, 4.3, 4.4, 4.5_



- [ ] 2.1 Implement handle_new_user() trigger function
  - Create function that handles both OAuth and email/password registration

  - Extract user metadata from raw_user_meta_data for OAuth users
  - Create profiles table entries with proper role assignment
  - Handle role selection logic for OAuth users vs direct registration



  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.2, 3.3, 3.4, 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 2.2 Implement custom_access_token_hook() for JWT claims
  - Create function that adds role, status, and permissions to JWT tokens
  - Query user roles and permissions from RBAC tables
  - Ensure proper error handling and fallback values
  - Test JWT token generation with custom claims
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 2.3 Set up RBAC system with roles and permissions
  - Create roles table with system roles (admin, mentor, mentee, volunteer, moderator)



  - Create permissions table with granular permissions
  - Create role_permissions mapping table
  - Create user_roles table for user-role assignments
  - Insert default roles and permissions data
  - _Requirements: 3.3, 3.4, 3.7, 4.3_

- [ ] 3. Frontend Authentication System Consolidation
  - Consolidate authentication hooks and components
  - Remove redundant implementations
  - Create unified authentication flow
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 3.1 Consolidate useAuth hook implementation
  - Merge functionality from hooks/useAuth.tsx and app/context/auth-context.tsx
  - Create single source of truth for authentication state
  - Implement proper loading states and error handling
  - Add methods for needsRoleSelection() and needsVerification()
  - _Requirements: 6.1, 6.2_

- [ ] 3.2 Refactor usePermissions hook
  - Simplify permissions logic to work with JWT claims
  - Remove redundant permission checking methods
  - Ensure consistent permission validation across components
  - _Requirements: 6.3_

- [ ] 3.3 Update AuthGuard component
  - Integrate with consolidated useAuth hook
  - Handle role selection flow for OAuth users
  - Manage authentication state transitions properly
  - Remove duplicate authentication logic
  - _Requirements: 6.4, 6.5_

- [ ] 3.4 Simplify ProtectedRoute component
  - Focus on route-level protection only
  - Remove overlapping functionality with AuthGuard
  - Implement clean permission-based access control
  - Add proper fallback UI for unauthorized access
  - _Requirements: 6.4, 6.5_

- [ ] 4. Registration Flow Implementation
  - Create email/password registration form
  - Implement OAuth registration with role selection
  - Handle user type selection properly
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [ ] 4.1 Create email/password registration form component
  - Build form with fields: email, password, firstName, lastName, userType
  - Implement client-side validation for all fields
  - Add user type selection (mentor/mentee only for public registration)
  - Handle form submission and error states
  - _Requirements: 2.1, 2.5, 3.2, 3.7_

- [ ] 4.2 Implement OAuth registration flow
  - Update OAuth sign-in methods to handle registration
  - Create role selection modal for OAuth users without user_type
  - Handle OAuth callback and user metadata extraction
  - Implement proper error handling for OAuth failures
  - _Requirements: 2.2, 2.3, 2.4, 3.1, 3.2_

- [ ] 4.3 Create RoleSelectionModal component
  - Build modal that presents mentor/mentee options only
  - Integrate with user profile update API
  - Handle role assignment and verification status setting
  - Implement proper loading and error states
  - _Requirements: 3.1, 3.2, 3.4, 3.5, 3.6_

- [ ] 5. API Endpoints and Authentication Logic
  - Create registration API endpoint
  - Update authentication middleware
  - Implement proper error handling
  - _Requirements: 2.1, 2.5, 2.6_

- [ ] 5.1 Create /api/auth/register endpoint
  - Handle email/password registration requests
  - Validate input data and create Supabase auth user
  - Set proper user metadata for trigger function
  - Return appropriate success/error responses
  - _Requirements: 2.1, 2.5_

- [ ] 5.2 Update authentication middleware
  - Ensure proper JWT token validation
  - Handle custom claims from tokens
  - Implement route protection based on roles and permissions
  - Add proper error handling for authentication failures
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 6. Testing and Validation
  - Write tests for authentication flows
  - Test RBAC system functionality
  - Validate JWT token customization
  - _Requirements: All requirements validation_

- [ ] 6.1 Write unit tests for database functions
  - Test handle_new_user() function with various input scenarios
  - Test custom_access_token_hook() function with different user states
  - Test RBAC permission checking functions
  - Validate trigger behavior and error handling
  - _Requirements: 1.2, 1.4, 2.1, 2.2, 2.3, 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 6.2 Write integration tests for authentication flows
  - Test complete email/password registration flow
  - Test OAuth registration with role selection
  - Test JWT token generation and validation
  - Test permission-based access control
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 6.3 Write frontend component tests
  - Test AuthGuard component behavior with different user states
  - Test ProtectedRoute access control logic
  - Test registration form validation and submission
  - Test role selection modal functionality
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 7. Documentation and Migration
  - Create migration guide for existing data
  - Document new authentication flow
  - Update development setup instructions
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 7.1 Create database migration script
  - Write script to migrate existing user data to new schema
  - Handle edge cases and data inconsistencies
  - Provide rollback mechanism for migration
  - Test migration with production-like data
  - _Requirements: 1.1, 1.2_

- [ ] 7.2 Write authentication flow documentation
  - Document complete registration and login flows
  - Explain OAuth vs email/password differences
  - Document RBAC system structure and usage
  - Create troubleshooting guide for common issues
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 7.3 Update development setup documentation
  - Update environment variable requirements
  - Document Supabase configuration steps
  - Provide testing instructions for authentication flows
  - Include examples of JWT token structure
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_