import { UserProfile } from './user';

/**
 * Mentor Profile from mentors_view
 */
export interface MentorProfile extends Partial<UserProfile> {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  current_position: string | null;
  current_company: string | null;
  location: string | null;
  availability: 'available' | 'busy';
  years_experience: number | null;
  mentor_skills: string[] | null;
  languages: string[] | null;
  education_level: string | null;
  inclusion_tags: string[] | null;
  rating?: number;
  sessions?: number;
  reviews?: number;
}

export interface MentorFilters {
  search?: string;
  topics?: string[];
  languages?: string[];
  inclusionTags?: string[];
  experienceYears?: number[];
  educationLevels?: string[];
  city?: string;
  country?: string;
  availability?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedMentors {
  mentors: MentorProfile[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
