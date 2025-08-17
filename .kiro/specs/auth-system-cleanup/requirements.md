# Requirements Document

## Introduction

This feature aims to clean up and consolidate the authentication system for the Menvo platform. Currently, there are multiple conflicting SQL scripts that create redundant tables, functions, and triggers, causing issues with user registration and authentication flow. The goal is to create a unified, clean authentication system that properly handles OAuth registration (Google/LinkedIn), role selection, and JWT token claims.

## Requirements

### Requirement 1

**User Story:** As a developer, I want a clean and consolidated database schema, so that there are no conflicting tables, functions, or triggers that prevent proper user registration.

#### Acceptance Criteria

1. WHEN reviewing the scripts folder THEN the system SHALL contain only non-redundant SQL scripts
2. WHEN a new user registers THEN the system SHALL successfully create entries in both auth.users and public.profiles without conflicts
3. WHEN database functions are executed THEN the system SHALL not have duplicate or conflicting function definitions
4. WHEN triggers are activated THEN the system SHALL execute without errors or conflicts

### Requirement 2

**User Story:** As a new user, I want to register using either email/password or OAuth providers (Google/LinkedIn), so that I can access the platform using my preferred authentication method.

#### Acceptance Criteria

1. WHEN a user registers with email/password THEN the system SHALL collect email, password, first_name, last_name, and user_type
2. WHEN a user authenticates via Google OAuth THEN the system SHALL create an entry in auth.users with provider metadata
3. WHEN a user authenticates via LinkedIn OAuth THEN the system SHALL create an entry in auth.users with provider metadata
4. WHEN OAuth registration occurs THEN the system SHALL extract user information from provider metadata
5. WHEN email/password registration occurs THEN the system SHALL validate all required fields
6. WHEN registration completes THEN the system SHALL redirect OAuth users to role selection and email users directly to their selected role

### Requirement 3

**User Story:** As a new user, I want to select my role (mentor/mentee), so that the system can provide me with appropriate permissions and features.

#### Acceptance Criteria

1. WHEN a user completes OAuth registration THEN the system SHALL present role selection options (mentor/mentee only)
2. WHEN a user registers with email/password THEN the system SHALL include user_type selection in the registration form (mentor/mentee only)
3. WHEN a user selects a role THEN the system SHALL update the user's profile with the chosen role
4. WHEN role selection is completed THEN the system SHALL save the role in the user_roles table
5. WHEN a mentor role is selected THEN the system SHALL set verification_status to 'pending_validation'
6. WHEN mentee role is selected THEN the system SHALL set verification_status to 'active'
7. WHEN admin or volunteer roles are needed THEN the system SHALL allow manual assignment by existing administrators only

### Requirement 4

**User Story:** As a system administrator, I want user roles and permissions to be returned in JWT access tokens, so that the frontend can properly authorize user actions.

#### Acceptance Criteria

1. WHEN a user authenticates THEN the system SHALL include role information in the JWT access token
2. WHEN a user authenticates THEN the system SHALL include status information in the JWT access token
3. WHEN a user authenticates THEN the system SHALL include permissions array in the JWT access token
4. WHEN JWT tokens are generated THEN the system SHALL use the custom_access_token_hook function
5. WHEN user roles change THEN the system SHALL reflect changes in subsequent JWT tokens

### Requirement 5

**User Story:** As a user, I want my profile information to be automatically populated from OAuth providers, so that I don't have to manually enter basic information.

#### Acceptance Criteria

1. WHEN OAuth registration occurs THEN the system SHALL extract first_name from provider metadata
2. WHEN OAuth registration occurs THEN the system SHALL extract last_name from provider metadata
3. WHEN OAuth registration occurs THEN the system SHALL extract email from provider metadata
4. WHEN OAuth registration occurs THEN the system SHALL extract avatar_url if available
5. WHEN provider metadata is incomplete THEN the system SHALL use fallback values for missing fields

### Requirement 6

**User Story:** As a developer, I want consolidated and non-redundant frontend authentication components, so that there are no conflicting implementations or duplicate logic.

#### Acceptance Criteria

1. WHEN reviewing authentication hooks THEN the system SHALL have a single, unified useAuth hook
2. WHEN reviewing authentication contexts THEN the system SHALL not have duplicate AuthContext implementations
3. WHEN reviewing permission systems THEN the system SHALL have consistent permission checking across components
4. WHEN reviewing route protection THEN the system SHALL use a single ProtectedRoute component approach
5. WHEN reviewing authentication guards THEN the system SHALL have clear separation of concerns between AuthGuard and ProtectedRoute

### Requirement 7

**User Story:** As a developer, I want a clear and documented authentication flow, so that I can understand and maintain the system effectively.

#### Acceptance Criteria

1. WHEN reviewing documentation THEN the system SHALL provide a clear flow diagram of the authentication process
2. WHEN reviewing documentation THEN the system SHALL explain the relationship between auth.users and public.profiles
3. WHEN reviewing documentation THEN the system SHALL document the RBAC system structure
4. WHEN reviewing documentation THEN the system SHALL explain JWT token customization
5. WHEN reviewing documentation THEN the system SHALL provide troubleshooting guidelines