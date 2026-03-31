"use client"

import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
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
  CheckCircle,
  Shield,
  Languages,
  Award
} from "lucide-react"
import { useMentor } from "@/hooks/useMentors"
import { useAuth } from "@/lib/auth"
import { LoginRequiredModal } from "@/components/auth/LoginRequiredModal"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

interface MentorProfilePageProps {
  params: { id: string }
}

export default function MentorProfilePage({ params }: MentorProfilePageProps) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { data: mentor, isLoading, error } = useMentor(params.id)
  const [showLoginModal, setShowLoginModal] = useState(false)

  // Fallback para não autenticado
  if (!user) {
    return (
      <div className="container flex flex-col items-center justify-center min-h-[60vh] py-12">
        <Shield className="h-12 w-12 text-primary mb-4" />
        <h2 className="text-2xl font-bold mb-2">{t("mentors.loginRequired.title")}</h2>
        <p className="text-muted-foreground mb-6 max-w-md text-center">
          {t("mentors.loginRequired.descriptionWithName", { mentorName: "" })}
        </p>
        <div className="flex gap-4">
          <Button onClick={() => setShowLoginModal(true)}>{t("mentors.loginRequired.login")}</Button>
          <Button variant="outline" onClick={() => setShowLoginModal(true)}>{t("mentors.loginRequired.signUp")}</Button>
        </div>
        <LoginRequiredModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          mentorName={mentor ? `${mentor.first_name} ${mentor.last_name}` : ""}
        />
      </div>
    )
  }

  // Handle loading state
  if (isLoading) {
    return <MentorProfileSkeleton />
  }

  // Handle errors and not found
  if (error || !mentor) {
    notFound()
  }

  // Handle actions that require authentication
  const handleAuthRequiredAction = (action: () => void) => {
    if (!user) {
      setShowLoginModal(true)
      return
    }
    action()
  }

  const handleScheduleSession = () => {
    handleAuthRequiredAction(() => {
      // Navigate to scheduling page
      window.location.href = `/mentors/${params.id}/schedule`
    })
  }

  const handleSendMessage = () => {
    handleAuthRequiredAction(() => {
      // Navigate to messaging
      window.location.href = `/messages/new?mentor=${params.id}`
    })
  }

  const handleSaveToFavorites = () => {
    handleAuthRequiredAction(() => {
      // TODO: Implement favorites functionality
      toast.success("Mentor salvo nos favoritos!")
    })
  }

  const handleShare = async () => {
    try {
      await navigator.share({
        title: `${mentor.first_name} ${mentor.last_name} - Mentor na Menvo`,
        text: mentor.bio || "Conheça este mentor incrível!",
        url: window.location.href,
      })
    } catch (error) {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.href)
      toast.success("Link copiado para a área de transferência!")
    }
  }

  const handleReport = () => {
    handleAuthRequiredAction(() => {
      // TODO: Implement reporting functionality
      toast.info("Funcionalidade de denúncia em desenvolvimento")
    })
  }

  const formatLocation = () => {
    if (!mentor.location) return null
    return mentor.location
  }

  const formatExperience = () => {
    if (!mentor.years_experience) return null
    const years = mentor.years_experience
    return `${years} ${years === 1 ? 'ano' : 'anos'} de experiência`
  }

  const formatLanguages = () => {
    if (!mentor.languages || mentor.languages.length === 0) return null
    return mentor.languages.join(", ")
  }

  const getAvailabilityStatus = () => {
    switch (mentor.availability) {
      case 'available':
        return {
          text: 'Disponível',
          variant: 'default' as const,
          icon: CheckCircle,
          color: 'text-green-600'
        }
      case 'busy':
        return {
          text: 'Ocupado',
          variant: 'secondary' as const,
          icon: Clock,
          color: 'text-yellow-600'
        }
      default:
        return {
          text: 'Indisponível',
          variant: 'outline' as const,
          icon: Clock,
          color: 'text-gray-600'
        }
    }
  }

  const availabilityStatus = getAvailabilityStatus()

  return (
    <>
      <div className="container py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
          <div className="space-y-8">
            {/* Profile Header */}
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="relative h-32 w-32 rounded-full overflow-hidden border-4 border-background shadow-lg bg-muted flex-shrink-0">
                {mentor.avatar_url ? (
                  <Image
                    src={mentor.avatar_url}
                    alt={`${mentor.first_name} ${mentor.last_name}`}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10">
                    <User className="h-16 w-16 text-primary/40" />
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <h1 className="text-3xl font-bold">
                    {mentor.first_name} {mentor.last_name}
                  </h1>
                  {mentor.verified_at && (
                    <Badge variant="outline" className="flex items-center gap-1 border-blue-200 text-blue-700">
                      <Shield className="h-3 w-3" />
                      Verificado
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap gap-y-2 gap-x-4 text-muted-foreground">
                  {mentor.current_position && mentor.current_company && (
                    <div className="flex items-center gap-1">
                      <Briefcase className="h-4 w-4" />
                      <span>
                        {mentor.current_position}
                        {mentor.current_company && ` na ${mentor.current_company}`}
                      </span>
                    </div>
                  )}

                  {formatLocation() && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{formatLocation()}</span>
                    </div>
                  )}

                  {formatLanguages() && (
                    <div className="flex items-center gap-1">
                      <Languages className="h-4 w-4" />
                      <span>{formatLanguages()}</span>
                    </div>
                  )}

                  {formatExperience() && (
                    <div className="flex items-center gap-1">
                      <Award className="h-4 w-4" />
                      <span>{formatExperience()}</span>
                    </div>
                  )}

                  {mentor.total_sessions && (
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>{mentor.total_sessions} sessões realizadas</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <Badge
                    variant={availabilityStatus.variant}
                    className={`flex items-center gap-1 ${availabilityStatus.color}`}
                  >
                    <availabilityStatus.icon className="h-3 w-3" />
                    {availabilityStatus.text}
                  </Badge>

                  {mentor.mentor_skills.slice(0, 3).map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}

                  {mentor.mentor_skills.length > 3 && (
                    <Badge variant="outline">
                      +{mentor.mentor_skills.length - 3} mais
                    </Badge>
                  )}
                </div>

                {mentor.bio && (
                  <p className="text-muted-foreground leading-relaxed">
                    {mentor.bio}
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleScheduleSession} className="flex gap-2">
                <Calendar className="h-4 w-4" />
                <span>Agendar Sessão</span>
              </Button>
              <Button variant="outline" onClick={handleSendMessage} className="flex gap-2">
                <MessageSquare className="h-4 w-4" />
                <span>Enviar Mensagem</span>
              </Button>
              <Button variant="ghost" size="icon" onClick={handleSaveToFavorites} aria-label="Salvar nos favoritos">
                <Heart className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleShare} aria-label="Compartilhar perfil">
                <Share2 className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleReport} aria-label="Denunciar">
                <Flag className="h-5 w-5" />
              </Button>
            </div>

            <Separator />

            {/* Tabs */}
            <Tabs defaultValue="about" className="w-full">
              <TabsList className="grid w-full grid-cols-3 md:w-auto md:inline-flex">
                <TabsTrigger value="about">Sobre</TabsTrigger>
                <TabsTrigger value="expertise">Especialidades</TabsTrigger>
                <TabsTrigger value="availability">Disponibilidade</TabsTrigger>
              </TabsList>

              <TabsContent value="about" className="space-y-6 pt-4">
                {mentor.bio && (
                  <div>
                    <h2 className="text-xl font-semibold mb-3">Sobre</h2>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {mentor.bio}
                    </p>
                  </div>
                )}

                {mentor.current_position && (
                  <div>
                    <h2 className="text-xl font-semibold mb-3">Experiência Profissional</h2>
                    <div className="flex gap-3">
                      <Briefcase className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <h3 className="font-medium">{mentor.current_position}</h3>
                        {mentor.current_company && (
                          <p className="text-muted-foreground">{mentor.current_company}</p>
                        )}
                        {mentor.years_experience && (
                          <p className="text-sm text-muted-foreground">
                            {formatExperience()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {mentor.education_level && (
                  <div>
                    <h2 className="text-xl font-semibold mb-3">Educação</h2>
                    <div className="flex gap-3">
                      <GraduationCap className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <h3 className="font-medium">{mentor.education_level}</h3>
                      </div>
                    </div>
                  </div>
                )}

                {formatLanguages() && (
                  <div>
                    <h2 className="text-xl font-semibold mb-3">Idiomas</h2>
                    <div className="flex gap-3">
                      <Languages className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-muted-foreground">{formatLanguages()}</p>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="expertise" className="space-y-6 pt-4">
                {mentor.mentor_skills.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold mb-3">Áreas de Especialidade</h2>
                    <div className="flex flex-wrap gap-2">
                      {mentor.mentor_skills.map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-sm py-1 px-3">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h2 className="text-xl font-semibold mb-3">Como posso ajudar</h2>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-muted-foreground">
                      Este mentor pode ajudar você com conhecimentos em{" "}
                      <span className="font-medium text-foreground">
                        {mentor.mentor_skills.slice(0, 3).join(", ")}
                      </span>
                      {mentor.mentor_skills.length > 3 && " e mais"}.
                      {mentor.years_experience && (
                        <> Com {formatExperience()}, posso compartilhar experiências práticas e orientação personalizada.</>
                      )}
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="availability" className="pt-4">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold mb-2">Disponibilidade</h2>
                    <p className="text-muted-foreground">
                      Agende uma sessão de mentoria gratuita de 45 minutos.
                    </p>
                  </div>

                  <div className="grid gap-4">
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <availabilityStatus.icon className={`h-5 w-5 ${availabilityStatus.color}`} />
                          <span className="font-medium">Status: {availabilityStatus.text}</span>
                        </div>

                        {mentor.availability === 'available' ? (
                          <div className="space-y-4">
                            <p className="text-muted-foreground">
                              Este mentor está disponível para novas sessões de mentoria.
                            </p>
                            <Button onClick={handleScheduleSession} className="w-full">
                              Ver Horários Disponíveis
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <p className="text-muted-foreground">
                              Este mentor está temporariamente indisponível para novas sessões.
                            </p>
                            <Button disabled className="w-full">
                              Indisponível
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  <div className="bg-muted p-4 rounded-lg">
                    <h3 className="font-medium mb-2 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>Informações da Sessão</span>
                    </h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Sessões de 45 minutos</li>
                      <li>• Realizadas por videochamada</li>
                      <li>• Completamente gratuitas</li>
                      <li>• Cancelamentos devem ser feitos com 24h de antecedência</li>
                    </ul>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Agendar Sessão</CardTitle>
                <CardDescription>Reserve uma sessão gratuita de mentoria</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Duração</span>
                  <span>45 minutos</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Preço</span>
                  <span className="font-medium text-green-600">Gratuito</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Disponibilidade</span>
                  <Badge variant={availabilityStatus.variant} className={availabilityStatus.color}>
                    {availabilityStatus.text}
                  </Badge>
                </div>
                <Button
                  onClick={handleScheduleSession}
                  disabled={mentor.availability !== 'available'}
                  className="w-full"
                >
                  {mentor.availability === 'available' ? 'Verificar Disponibilidade' : 'Indisponível'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Informações de Contato</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" onClick={handleSendMessage} className="w-full">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Enviar Mensagem
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Estatísticas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {mentor.total_sessions && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Sessões realizadas</span>
                    <span className="font-medium">{mentor.total_sessions}</span>
                  </div>
                )}
                {mentor.rating && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Avaliação</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{mentor.rating.toFixed(1)}</span>
                    </div>
                  </div>
                )}
                {mentor.verified_at && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant="outline" className="border-blue-200 text-blue-700">
                      <Shield className="h-3 w-3 mr-1" />
                      Verificado
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        mentorName={`${mentor.first_name} ${mentor.last_name}`}
      />
    </>
  )
}

function MentorProfileSkeleton() {
  return (
    <div className="container py-8 md:py-12">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
        <div className="space-y-8">
          {/* Profile Header Skeleton */}
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <Skeleton className="h-32 w-32 rounded-full" />
            <div className="flex-1 space-y-4">
              <Skeleton className="h-8 w-64" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-96" />
                <Skeleton className="h-4 w-80" />
                <Skeleton className="h-4 w-72" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-16" />
              </div>
              <Skeleton className="h-16 w-full" />
            </div>
          </div>

          {/* Action Buttons Skeleton */}
          <div className="flex gap-3">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 w-10" />
          </div>

          {/* Tabs Skeleton */}
          <div className="space-y-6">
            <div className="flex gap-2">
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-28" />
              <Skeleton className="h-10 w-32" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        </div>

        {/* Sidebar Skeleton */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
