# Implementation Plan

- [x] 1. Create error handling infrastructure


  - Create centralized error handler service with user-friendly error messages
  - Implement error logging utilities for debugging
  - Add error boundary components for graceful error handling
  - _Requirements: 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 2. Create file upload utilities and hooks

  - [x] 2.1 Create useFileUpload hook for reusable upload logic


    - Implement file validation (type, size) with proper error messages
    - Add upload progress tracking and cancellation support
    - Create generic upload function that works with different endpoints
    - _Requirements: 3.2, 3.6, 3.7, 4.1, 4.6_

  - [x] 2.2 Create file validation utilities


    - Implement client-side file type validation for images and PDFs
    - Add file size validation with configurable limits
    - Create MIME type checking functions
    - _Requirements: 1.1, 3.1, 3.2, 3.6, 3.7_

- [ ] 3. Fix and enhance profile data saving
  - [x] 3.1 Debug and fix useProfile hook updateProfile function


    - Add proper error handling and logging to identify save issues
    - Implement optimistic updates for better user experience
    - Add validation for required fields before API calls
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [x] 3.2 Enhance profile update API error handling


    - Add detailed error logging in profile update operations
    - Implement proper error response formatting
    - Add validation for profile data on server side
    - _Requirements: 2.2, 2.3, 2.5, 4.3, 5.2, 5.4_

- [x] 4. Fix image upload functionality


  - [x] 4.1 Debug existing profile photo upload issues


    - Test and fix the existing /api/upload/profile-photo endpoint
    - Verify Supabase storage bucket permissions and configuration
    - Add proper error handling for storage operations
    - _Requirements: 1.2, 1.3, 1.5, 5.3_

  - [x] 4.2 Enhance profile page image upload component


    - Replace direct Supabase calls with API endpoint calls
    - Add proper loading states during image upload
    - Implement immediate image preview after successful upload
    - Add error display for failed uploads
    - _Requirements: 1.1, 1.3, 1.4, 1.5, 1.6, 1.7, 4.1, 4.2_

- [x] 5. Create CV upload infrastructure




  - [x] 5.1 Create Supabase storage bucket for CVs





    - Set up 'cvs' bucket in Supabase with proper permissions
    - Configure RLS policies for CV file access
    - Set file size limits and allowed MIME types
    - _Requirements: 3.3, 3.8_





  - [x] 5.2 Create CV upload API endpoint


    - Implement /api/upload/cv route with PDF-only validation
    - Add file size validation (5MB limit)

    - Implement CV file replacement logic (remove old file)



    - Update profile cv_url field after successful upload


    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.8_


- [ ] 6. Implement CV upload UI components





  - [x] 6.1 Create CV upload button and file handling


    - Replace placeholder CV upload button with functional implementation
    - Add PDF file type validation on frontend
    - Implement file size checking before upload
    - _Requirements: 3.1, 3.2, 3.6, 3.7_




  - [x] 6.2 Create CV management interface


    - Display current CV filename and upload date when CV exists
    - Add "View CV" link that opens PDF in new tab
    - Implement "Remove CV" functionality with confirmation
    - Show upload progress during CV upload

    - _Requirements: 3.4, 3.5, 3.8, 3.9, 4.1_

- [x] 7. Enhance user feedback and loading states

  - [x] 7.1 Implement comprehensive loading states


    - Add loading spinners for all async operations (save, upload)
    - Disable form submission during save operations


    - Show progress indicators for file uploads
    - _Requirements: 4.1, 4.2_

  - [x] 7.2 Implement success and error messaging


    - Add success messages for profile save, image upload, CV upload
    - Implement specific error messages for different failure scenarios
    - Add auto-dismiss for success messages after 3 seconds
    - Create confirmation dialogs for destructive actions
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

- [ ] 8. Fix CV persistence and state management
  - [x] 8.1 Debug and fix CV state initialization



    - Investigate why CV state is not properly initialized from profile data
    - Fix form state synchronization to reflect saved CV in database
    - Ensure CV upload state is properly displayed after page reload
    - Add proper debugging logs for CV state management
    - _Requirements: 5.1, 5.2, 5.4, 5.5_



  - [ ] 8.2 Enhance CV state management in useProfile hook
    - Ensure profile data loading includes cv_url field
    - Fix form data initialization to properly set CV state
    - Add proper error handling for CV state inconsistencies
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_


- [ ] 9. Restore missing mentor fields
  - [ ] 9.1 Add language selection field
    - Implement multi-language selection with Português, English, Español options
    - Add proper form state management for languages array

    - Ensure languages field is saved and loaded correctly
    - _Requirements: 6.1, 6.9_

  - [ ] 9.2 Add mentor-specific fields to form
    - Add "Áreas de Expertise" field with suggestions and chip input
    - Add "Tópicos de Mentoria" field with suggestions
    - Add "Tags Inclusivas" field with appropriate options
    - Add "Abordagem da Mentoria" textarea field

    - Add "O que Esperar" textarea field
    - Add "Mentee Ideal" textarea field
    - _Requirements: 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [ ] 9.3 Add mentorship information section
    - Create dedicated mentorship tab/section in the form

    - Add informational text about free mentorship
    - Ensure all mentor fields are properly organized and labeled
    - _Requirements: 6.8, 6.9_

- [x] 10. Add missing basic and professional fields

  - [ ] 10.1 Add slug do perfil field
    - Implement profile slug field with URL preview
    - Add validation for slug format (kebab-case, unique)
    - Show preview URL as "menvo.com.br/perfil/{slug}"
    - _Requirements: 7.1, 7.5_



  - [ ] 10.2 Add location fields
    - Add address, city, state, country fields
    - Implement proper form section for location information
    - Add privacy notice about address visibility
    - Ensure location fields are saved and loaded correctly
    - _Requirements: 7.3, 7.4, 7.5_

  - [ ] 10.3 Enhance documents and integrations section
    - Ensure CV upload section is properly labeled and organized
    - Add information about automatic CV analysis
    - Organize professional fields in logical sections
    - _Requirements: 7.2, 7.6, 7.7_

- [ ] 11. Add comprehensive form validation
  - [x] 11.1 Implement client-side form validation
    - Add required field validation for name and surname
    - Implement real-time validation feedback
    - Prevent form submission with invalid data
    - _Requirements: 2.1, 2.6, 4.6_

  - [x] 11.2 Add unsaved changes detection
    - Implement form dirty state tracking
    - Show confirmation dialog when leaving with unsaved changes
    - Add visual indicators for unsaved changes
    - _Requirements: 4.7_

- [ ] 12. Create comprehensive tests
  - [x] 12.1 Write unit tests for hooks and utilities
    - Test useProfile hook with various scenarios (success, error, loading)
    - Test useFileUpload hook with different file types and sizes
    - Test file validation utilities with edge cases
    - _Requirements: All requirements validation_

  - [x] 12.2 Write integration tests for upload functionality
    - Test complete image upload flow from UI to storage
    - Test CV upload flow with PDF validation
    - Test error scenarios and proper error display
    - _Requirements: All requirements validation_

  - [ ] 12.3 Test new mentor fields functionality
    - Test all mentor-specific fields save and load correctly
    - Test language selection and chip inputs work properly
    - Test form state management for all new fields
    - _Requirements: 6.1-6.9_

  - [ ] 12.4 Test CV persistence after page reload
    - Test CV state is properly restored after browser refresh
    - Test CV management buttons appear correctly when CV exists
    - Test CV removal and re-upload functionality
    - _Requirements: 5.1-5.7_

- [ ] 13. Final integration and polish
  - [ ] 13.1 Integrate all components and test complete flow
    - Test complete profile update flow with all fields including new mentor fields
    - Verify CV persistence works correctly after page reload
    - Test all mentor-specific fields save and display properly
    - Test location fields and privacy notices work correctly
    - Ensure all error scenarios are handled gracefully
    - _Requirements: All requirements integration_

  - [ ] 13.2 Performance optimization and cleanup
    - Optimize form rendering with proper field organization
    - Ensure proper form state management for all fields
    - Add proper loading states for all sections
    - Optimize profile data loading and caching
    - _Requirements: Performance and cleanup_

  - [ ] 13.3 Final UI/UX polish
    - Ensure proper form section organization and labeling
    - Add proper help text and instructions for all fields
    - Verify responsive design works on all screen sizes
    - Test accessibility and keyboard navigation
    - _Requirements: User experience optimization_