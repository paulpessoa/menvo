import React from 'react'
import { render, screen } from '@testing-library/react'
import { MentorCard } from './MentorCard'

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'mentorCard.mentor': 'Mentor',
      'mentorCard.viewProfile': 'Ver perfil',
      'mentorCard.addFavorite': 'Favoritar',
      'mentorCard.removeFavorite': 'Desfavoritar',
      'mentorCard.yearsExp': 'anos de exp.',
    }
    return translations[key] ?? key
  },
}))

jest.mock('@/lib/auth', () => ({
  useAuth: () => ({ user: null }),
}))

jest.mock('@/hooks/useFavorites', () => ({
  useFavorites: () => ({
    favorites: [],
    toggleFavorite: jest.fn(),
  }),
}))

jest.mock('@/i18n/routing', () => ({
  Link: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

describe('MentorCard', () => {
  const baseMentor = {
    id: 'm-1',
    full_name: 'Ana Souza',
    avatar_url: null,
    bio: 'Desenvolvedora e mentora.',
    job_title: 'Tech Lead',
    company: 'TechCorp',
    city: 'Recife',
    state: 'PE',
    country: 'Brasil',
    languages: ['Português'],
    mentorship_topics: ['Frontend', 'Carreira'],
    inclusive_tags: null,
    expertise_areas: null,
    availability_status: 'available',
    average_rating: 4.9,
    total_reviews: 12,
    total_sessions: 20,
    experience_years: 8,
    slug: 'ana-souza',
  }

  it('renders mentor basic information correctly', () => {
    render(<MentorCard mentor={baseMentor} />)

    expect(screen.getByRole('heading', { name: 'Ana Souza' })).toBeInTheDocument()
    expect(screen.getByText('Tech Lead')).toBeInTheDocument()
    expect(screen.getByText('Recife, PE')).toBeInTheDocument()
    expect(screen.queryByText(/Mentor da/)).not.toBeInTheDocument()
  })

  it('renders "Mentor da {org.name}" chip when mentor belongs to an open organization (C-O4)', () => {
    const mentorWithOrg = {
      ...baseMentor,
      organization: {
        name: 'Giral',
        slug: 'giral',
      },
    }

    render(<MentorCard mentor={mentorWithOrg} />)

    expect(screen.getByText('Mentor da Giral')).toBeInTheDocument()
  })
})
