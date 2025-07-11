"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  BookOpen,
  Briefcase,
  Calendar,
  Clock,
  ExternalLink,
  Flag,
  Globe,
  GraduationCap,
  Heart,
  Linkedin,
  MapPin,
  MessageSquare,
  Share2,
  Star,
  User,
  Github,
  Building,
  Mail,
  Phone
} from "lucide-react"
// import { useTalent, useCompleteUserProfile } from "@/hooks/useTalents"
import { useMentorAvailability, useMentorStats } from "@/hooks/useMentorship"
// import { talentsUtils } from "@/services/talents/talents"
import { mentorshipUtils } from "@/services/mentorship/mentorship"
import { ScheduleSessionModal } from "@/components/mentorship/ScheduleSessionModal"
const useTalent: any = {}
const useCompleteUserProfile : any = {}
interface TalentProfilePageProps {
  params: { id: string }
}

export default function TalentProfilePage({ params }: TalentProfilePageProps) {
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  
  const { data: talent, isLoading: talentLoading } = useTalent(params.id)
  const { 
    profile, 
    roles, 
    skills, 
    companyProfile,
    isMentor,
    isRecruiter,
    hasCompanyRole 
  } = useCompleteUserProfile(params.id)
  
  const { data: availability } = useMentorAvailability(isMentor ? params.id : '')
  const { data: mentorStats } = useMentorStats(isMentor ? params.id : '')

  if (talentLoading || !talent) {
    return <TalentProfileSkeleton />
  }
const talentsUtils : any = {} 

  const fullName = talentsUtils.getFullName(talent)
  const primaryRole = talentsUtils.getPrimaryRole(talent.active_roles)
  const canMentor = talentsUtils.canMentor(talent)
  const isAvailable = talentsUtils.isAvailable(talent)

  const mentorSkills = skills?.filter(skill => skill.is_mentor_skill) || []
  const learningSkills = skills?.filter(skill => skill.is_learning_skill) || []

  return (
    <div className="container py-8 md:py-12">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-8">
        <div className="space-y-8">
          {/* Profile Header */}
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <Avatar className="h-32 w-32">
              <AvatarImage src={talent.avatar_url} alt={fullName} />
              <AvatarFallback className="text-2xl">
                {talent.first_name[0]}{talent.last_name[0]}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <h1 className="text-3xl font-bold">{fullName}</h1>
                  <Badge 
                    variant={isAvailable ? "default" : "secondary"}
                    className={isAvailable ? "bg-green-500" : ""}
                  >
                    {talent.availability === 'available' ? 'Disponível' : 
                     talent.availability === 'busy' ? 'Ocupado' : 'Indisponível'}
                  </Badge>
                </div>
                
                {/* Current Position */}
                {talent.current_position && (
                  <div className="flex items-center gap-2 text-lg text-muted-foreground">
                    <Briefcase className="h-5 w-5" />
                    <span>{talent.current_position}</span>
                    {talent.current_company && (
                      <span> • {talent.current_company}</span>
                    )}
                  </div>
                )}

                {/* Location */}
                {talent.location && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{talent.location}</span>
                  </div>
                )}

                {/* Roles */}
                <div className="flex flex-wrap gap-2">
                  {talent.active_roles.map((role) => (
                    <Badge 
                      key={role} 
                      variant="secondary" 
                      className={talentsUtils.getRoleColor(role)}
                    >
                      {talentsUtils.formatRoles([role])[0]}
                    </Badge>
                  ))}
                </div>

                {/* Bio */}
                {talent.bio && (
                  <p className="text-muted-foreground">{talent.bio}</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                {canMentor && (
                  <Button 
                    className="flex gap-2"
                    onClick={() => setIsScheduleModalOpen(true)}
                  >
                    <Calendar className="h-4 w-4" />
                    <span>Agendar Mentoria</span>
                  </Button>
                )}
                <Button variant="outline" className="flex gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>Enviar Mensagem</span>
                </Button>
                <Button variant="ghost" size="icon" aria-label="Favoritar">
                  <Heart className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" aria-label="Compartilhar">
                  <Share2 className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" aria-label="Reportar">
                  <Flag className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Tabs */}
          <Tabs defaultValue="about">
            <TabsList className="grid w-full grid-cols-4 md:w-auto md:inline-flex">
              <TabsTrigger value="about">Sobre</TabsTrigger>
              <TabsTrigger value="skills">Habilidades</TabsTrigger>
              {canMentor && <TabsTrigger value="mentorship">Mentoria</TabsTrigger>}
              {hasCompanyRole && <TabsTrigger value="company">Empresa</TabsTrigger>}
            </TabsList>

            <TabsContent value="about" className="space-y-6 pt-4">
              {/* About Section */}
              {talent.bio && (
                <div>
                  <h2 className="text-xl font-semibold mb-3">Sobre</h2>
                  <p className="text-muted-foreground leading-relaxed">{talent.bio}</p>
                </div>
              )}

              {/* Contact Information */}
              <div>
                <h2 className="text-xl font-semibold mb-3">Contato</h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{talent.email}</span>
                  </div>
                  
                  {profile?.linkedin_url && (
                    <div className="flex items-center gap-3">
                      <Linkedin className="h-4 w-4 text-muted-foreground" />
                      <a 
                        href={profile.linkedin_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-primary-600 hover:underline"
                      >
                        LinkedIn
                      </a>
                    </div>
                  )}
                  
                  {profile?.github_url && (
                    <div className="flex items-center gap-3">
                      <Github className="h-4 w-4 text-muted-foreground" />
                      <a 
                        href={profile.github_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-primary-600 hover:underline"
                      >
                        GitHub
                      </a>
                    </div>
                  )}
                  
                  {profile?.website_url && (
                    <div className="flex items-center gap-3">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a 
                        href={profile.website_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-primary-600 hover:underline"
                      >
                        Website
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Experience */}
              {profile?.years_experience && (
                <div>
                  <h2 className="text-xl font-semibold mb-3">Experiência</h2>
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-5 w-5 text-muted-foreground" />
                    <span>{profile.years_experience} anos de experiência</span>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="skills" className="space-y-6 pt-4">
              {/* Mentor Skills */}
              {mentorSkills.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-3">Habilidades de Mentoria</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {mentorSkills.map((skill) => (
                      <div key={skill.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h3 className="font-medium">{skill.skill_name}</h3>
                          <p className="text-sm text-muted-foreground capitalize">
                            {skill.skill_category.replace('_', ' ')}
                          </p>
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {skill.proficiency_level}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Learning Skills */}
              {learningSkills.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-3">Aprendendo</h2>
                  <div className="flex flex-wrap gap-2">
                    {learningSkills.map((skill) => (
                      <Badge key={skill.id} variant="secondary">
                        {skill.skill_name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {canMentor && (
              <TabsContent value="mentorship" className="space-y-6 pt-4">
                {/* Mentor Stats */}
                {mentorStats && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-primary-600">
                          {mentorStats.completed}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Sessões Completas
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {mentorStats.pending}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Pendentes
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {mentorStats.confirmed}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Confirmadas
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-gray-600">
                          {mentorStats.total}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Total
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Availability */}
                {availability && availability.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold mb-3">Disponibilidade</h2>
                    <div className="space-y-3">
                      {availability.map((slot) => (
                        <div key={slot.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {mentorshipUtils.getDayName(slot.day_of_week)}
                            </span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {mentorshipUtils.formatTime(slot.start_time)} - {mentorshipUtils.formatTime(slot.end_time)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
            )}

            {hasCompanyRole && companyProfile && (
              <TabsContent value="company" className="space-y-6 pt-4">
                <div>
                  <h2 className="text-xl font-semibold mb-3">Informações da Empresa</h2>
                  <Card>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <Building className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <h3 className="font-semibold">{companyProfile.company_name}</h3>
                            {companyProfile.verified && (
                              <Badge variant="default" className="mt-1">
                                Empresa Verificada
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        {companyProfile.description && (
                          <p className="text-muted-foreground">{companyProfile.description}</p>
                        )}
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          {companyProfile.company_size && (
                            <div>
                              <span className="font-medium">Tamanho:</span>
                              <span className="ml-2 capitalize">{companyProfile.company_size}</span>
                            </div>
                          )}
                          {companyProfile.industry && (
                            <div>
                              <span className="font-medium">Setor:</span>
                              <span className="ml-2">{companyProfile.industry}</span>
                            </div>
                          )}
                        </div>
                        
                        {companyProfile.website && (
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <a 
                              href={companyProfile.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary-600 hover:underline"
                            >
                              {companyProfile.website}
                            </a>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {canMentor && (
                <Button 
                  className="w-full" 
                  onClick={() => setIsScheduleModalOpen(true)}
                >
                  Agendar Mentoria
                </Button>
              )}
              <Button variant="outline" className="w-full">
                Enviar Mensagem
              </Button>
              <Button variant="outline" className="w-full">
                Conectar no LinkedIn
              </Button>
            </CardContent>
          </Card>

          {/* Languages */}
          {profile?.languages && profile.languages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Idiomas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profile.languages.map((lang) => (
                    <Badge key={lang} variant="secondary">
                      {lang}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Member Since */}
          <Card>
            <CardHeader>
              <CardTitle>Membro desde</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {new Date(talent.created_at).toLocaleDateString('pt-BR', {
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Schedule Session Modal */}
      {canMentor && (
        <ScheduleSessionModal
          isOpen={isScheduleModalOpen}
          onClose={() => setIsScheduleModalOpen(false)}
          mentorId={params.id}
          mentorName={fullName}
          availability={availability || []}
        />
      )}
    </div>
  )
}

function TalentProfileSkeleton() {
  return (
    <div className="container py-8 md:py-12">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-8">
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="h-32 w-32 rounded-full bg-gray-200 animate-pulse" />
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
                <div className="h-5 w-48 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                <div className="flex gap-2">
                  <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse" />
                  <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse" />
                </div>
              </div>
              <div className="flex gap-3">
                <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
                <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="h-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-32 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    </div>
  )
}
