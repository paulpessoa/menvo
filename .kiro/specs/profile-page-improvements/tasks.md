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

- [ ] 8. Add comprehensive form validation
  - [x] 8.1 Implement client-side form validation


    - Add required field validation for name and surname
    - Implement real-time validation feedback
    - Prevent form submission with invalid data
    - _Requirements: 2.1, 2.6, 4.6_

  - [x] 8.2 Add unsaved changes detection





    - Implement form dirty state tracking
    - Show confirmation dialog when leaving with unsaved changes
    - Add visual indicators for unsaved changes
    - _Requirements: 4.7_

- [ ] 9. Create comprehensive tests
  - [x] 9.1 Write unit tests for hooks and utilities


    - Test useProfile hook with various scenarios (success, error, loading)
    - Test useFileUpload hook with different file types and sizes
    - Test file validation utilities with edge cases
    - _Requirements: All requirements validation_

  - [x] 9.2 Write integration tests for upload functionality


    - Test complete image upload flow from UI to storage
    - Test CV upload flow with PDF validation
    - Test error scenarios and proper error display
    - _Requirements: All requirements validation_

- [x] 10. Final integration and polish


  - [ ] 10.1 Integrate all components and test complete flow
    - Test complete profile update flow with all fields
    - Verify image upload works correctly with immediate display
    - Test CV upload and management functionality
    - Ensure all error scenarios are handled gracefully


    - _Requirements: All requirements integration_

  - [ ] 10.2 Performance optimization and cleanup
    - Optimize image upload with client-side compression
    - Implement proper cleanup of old files when replacing
    - Add caching for profile data to improve performance
    - _Requirements: Performance and cleanup_
