'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Loader2, MailIcon, MapPinIcon, BriefcaseIcon, GraduationCapIcon, LanguagesIcon, LinkedinIcon, GlobeIcon, CalendarDaysIcon, StarIcon } from 'lucide-react'
import Link from 'next/link'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { user_profile, user_skill } from '@/types/database'

interface MentorProfile extends user_profile {
  skills: user_skill[];
}

async function fetchMentorProfile(id: string): Promise<MentorProfile> {
  const response = await fetch(`/api/mentors/${id}`)
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to fetch mentor profile')
  }
  const data = await response.json()
  return data.data
}

export default function MentorProfilePage() {
  const params = useParams()
  const mentorId = params.id as string

  const { data: mentor, isLoading, isError, error } = useQuery<MentorProfile, Error>({
    queryKey: ['mentorProfile', mentorId],
    queryFn: () => fetchMentorProfile(mentorId),
    enabled: !!mentorId,
  })

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando perfil do mentor...</span>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <h1 className="text-3xl font-bold mb-4">Erro ao carregar perfil do mentor</h1>
        <p className="text-lg mb-6">{error?.message || 'Ocorreu um erro inesperado.'}</p>
        <Link href="/mentors" passHref>
          <Button>Voltar para a lista de mentores</Button>
        </Link>
      </div>
    )
  }

  if (!mentor) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <h1 className="text-3xl font-bold mb-4">Mentor não encontrado</h1>
        <p className="text-lg mb-6">O perfil do mentor que você está procurando não existe ou não está verificado.</p>
        <Link href="/mentors" passHref>
          <Button>Voltar para a lista de mentores</Button>
        </Link>
      </div>
    )
  }

  return (
    <ProtectedRoute requiredRoles={['mentee', 'mentor', 'admin']}>
      <div className="container mx-auto px-4 py-8 md:py-12">
        <Card className="max-w-4xl mx-auto">
          <CardHeader className="flex flex-col md:flex-row items-center gap-6 p-6 md:p-8">
            <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-primary-foreground shadow-lg">
              <AvatarImage src={mentor.avatar_url || '/placeholder-user.jpg'} alt={mentor.full_name || 'Mentor'} />
              <AvatarFallback className="text-6xl">{mentor.full_name?.charAt(0) || 'M'}</AvatarFallback>
            </Avatar>
            <div className="text-center md:text-left flex-grow">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-50 mb-2">
                {mentor.full_name}
              </h1>
              <p className="text-xl text-muted-foreground mb-3">
                {mentor.current_position} {mentor.current_company && `na ${mentor.current_company}`}
              </p>
              <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
                {mentor.skills?.filter(s => s.is_mentor_skill).map((skill, index) => (
                  <Badge key={index} variant="secondary" className="text-sm">
                    {skill.skill_name}
                  </Badge>
                ))}
              </div>
              <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-muted-foreground">
                {mentor.location && (
                  <div className="flex items-center gap-1">
                    <MapPinIcon className="h-4 w-4" />
                    <span>{mentor.location}</span>
                  </div>
                )}
                {mentor.years_experience !== null && mentor.years_experience !== undefined && (
                  <div className="flex items-center gap-1">
                    <StarIcon className="h-4 w-4" />
                    <span>{mentor.years_experience} anos de experiência</span>
                  </div>
                )}
                {mentor.education_level && (
                  <div className="flex items-center gap-1">
                    <GraduationCapIcon className="h-4 w-4" />
                    <span>{mentor.education_level}</span>
                  </div>
                )}
                {mentor.languages && mentor.languages.length > 0 && (
                  <div className="flex items-center gap-1">
                    <LanguagesIcon className="h-4 w-4" />
                    <span>{mentor.languages.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-3 w-full md:w-auto">
              <Link href={`/mentors/${mentor.id}/schedule`} passHref>
                <Button className="w-full">
                  <CalendarDaysIcon className="mr-2 h-4 w-4" />
                  Agendar Mentoria
                </Button>
              </Link>
              <Button variant="outline" className="w-full">
                <MailIcon className="mr-2 h-4 w-4" />
                Enviar Mensagem
              </Button>
            </div>
          </CardHeader>

          <Separator className="my-0" />

          <CardContent className="p-6 md:p-8 space-y-8">
            <section>
              <h2 className="text-2xl font-bold mb-4">Sobre o Mentor</h2>
              <p className="text-muted-foreground leading-relaxed">
                {mentor.bio || 'Nenhuma biografia disponível.'}
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-bold mb-4">Habilidades de Mentoria</h2>
              <div className="flex flex-wrap gap-3">
                {mentor.skills?.filter(s => s.is_mentor_skill).length > 0 ? (
                  mentor.skills.filter(s => s.is_mentor_skill).map((skill, index) => (
                    <Badge key={index} className="px-4 py-2 text-base">
                      {skill.skill_name} - {skill.proficiency_level}
                    </Badge>
                  ))
                ) : (
                  <p className="text-muted-foreground">Nenhuma habilidade de mentoria listada.</p>
                )}
              </div>
            </section>

            {mentor.skills?.filter(s => s.is_learning_skill).length > 0 && (
              <>
                <Separator />
                <section>
                  <h2 className="text-2xl font-bold mb-4">Interesses de Aprendizagem</h2>
                  <div className="flex flex-wrap gap-3">
                    {mentor.skills.filter(s => s.is_learning_skill).map((skill, index) => (
                      <Badge key={index} variant="outline" className="px-4 py-2 text-base">
                        {skill.skill_name}
                      </Badge>
                    ))}
                  </div>
                </section>
              </>
            )}

            {(mentor.social_links?.linkedin || mentor.social_links?.website) && (
              <>
                <Separator />
                <section>
                  <h2 className="text-2xl font-bold mb-4">Links Sociais</h2>
                  <div className="flex gap-4">
                    {mentor.social_links?.linkedin && (
                      <Link href={mentor.social_links.linkedin} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" className="flex items-center gap-2">
                          <LinkedinIcon className="h-5 w-5" />
                          LinkedIn
                        </Button>
                      </Link>
                    )}
                    {mentor.social_links?.website && (
                      <Link href={mentor.social_links.website} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" className="flex items-center gap-2">
                          <GlobeIcon className="h-5 w-5" />
                          Website
                        </Button>
                      </Link>
                    )}
                  </div>
                </section>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
