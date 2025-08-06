"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { BookOpen, Briefcase, Calendar, Clock, ExternalLink, Flag, Globe, GraduationCap, Heart, Linkedin, MapPin, MessageSquare, Share2, Star, User, CheckCircle, Shield, Languages, Award } from 'lucide-react'
import { useUserProfile } from "@/hooks/useUserProfile"
import { useAuth } from "@/hooks/useAuth"
import { LoginRequiredModal } from "@/components/auth/LoginRequiredModal"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import ProtectedRoute from '@/components/auth/ProtectedRoute'

interface TalentProfilePageProps {
  params: { id: string }
}

export default function TalentProfilePage({ params }: TalentProfilePageProps) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { userProfile: talent, isLoading, error } = useUserProfile(params.id)
  const [showLoginModal, setShowLoginModal] = useState(false)

  // Fallback para não autenticado
  if (!user) {
    return (
      <div className="container flex flex-col items-center justify-center min-h-[60vh] py-12">
        <Shield className="h-12 w-12 text-primary mb-4" />
        <h2 className="text-2xl font-bold mb-2">{t("talent.loginRequired.title")}</h2>
        <p className="text-muted-foreground mb-6 max-w-md text-center">
          {t("talent.loginRequired.descriptionWithName", { talentName: "" })}
        </p>
        <div className="flex gap-4">
          <Button onClick={() => setShowLoginModal(true)}>{t("talent.loginRequired.login")}</Button>
          <Button variant="outline" onClick={() => setShowLoginModal(true)}>{t("talent.loginRequired.signUp")}</Button>
        </div>
        <LoginRequiredModal 
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          mentorName={talent ? talent.full_name || "" : ""}
        />
      </div>
    )
  }

  // Handle loading state
  if (isLoading) {
    return <TalentProfileSkeleton />
  }

  // Handle errors and not found
  if (error || !talent) {
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

  const handleSendMessage = () => {
    handleAuthRequiredAction(() => {
      // Navigate to messaging
      window.location.href = `/messages/new?talent=${params.id}`
    })
  }

  const handleSaveToFavorites = () => {
    handleAuthRequiredAction(() => {
      // TODO: Implement favorites functionality
      toast.success("Talento salvo nos favoritos!")
    })
  }

  const handleShare = async () => {
    try {
      await navigator.share({
        title: `${talent.full_name} - Perfil de Talento na Menvo`,
        text: talent.bio || "Conheça este talento incrível!",
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
    if (!talent.location) return null
    return talent.location
  }

  const formatExperience = () => {
    if (!talent.years_experience) return null
    const years = talent.years_experience
    return `${years} ${years === 1 ? 'ano' : 'anos'} de experiência`
  }

  const formatLanguages = () => {
    if (!talent.languages || talent.languages.length === 0) return null
    return talent.languages.join(", ")
  }

  return (
    <ProtectedRoute requiredRoles={['mentor', 'admin']}>
      <div className="container py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
          <div className="space-y-8">
            {/* Profile Header */}
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="relative h-32 w-32 rounded-full overflow-hidden border-4 border-background shadow-lg bg-muted flex-shrink-0">
                {talent.avatar_url ? (
                  <Image
                    src={talent.avatar_url || "/placeholder.svg"}
                    alt={talent.full_name || "Talent"}
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
                    {talent.full_name}
                  </h1>
                  {talent.role === 'mentee' && (
                    <Badge variant="outline" className="flex items-center gap-1 border-green-200 text-green-700">
                      <CheckCircle className="h-3 w-3" />
                      Mentee
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap gap-y-2 gap-x-4 text-muted-foreground">
                  {talent.current_position && talent.current_company && (
                    <div className="flex items-center gap-1">
                      <Briefcase className="h-4 w-4" />
                      <span>
                        {talent.current_position} 
                        {talent.current_company && ` na ${talent.current_company}`}
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
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {talent.skills?.filter(s => s.is_learning_skill).slice(0, 3).map((skill) => (
                    <Badge key={skill.id} variant="secondary">
                      {skill.skill_name}
                    </Badge>
                  ))}
                  {talent.skills?.filter(s => s.is_learning_skill).length > 3 && (
                    <Badge variant="outline">
                      +{talent.skills.filter(s => s.is_learning_skill).length - 3} mais
                    </Badge>
                  )}
                </div>

                {talent.bio && (
                  <p className="text-muted-foreground leading-relaxed">
                    {talent.bio}
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
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
              <TabsList className="grid w-full grid-cols-2 md:w-auto md:inline-flex">
                <TabsTrigger value="about">Sobre</TabsTrigger>
                <TabsTrigger value="skills">Habilidades</TabsTrigger>
              </TabsList>

              <TabsContent value="about" className="space-y-6 pt-4">
                {talent.bio && (
                  <div>
                    <h2 className="text-xl font-semibold mb-3">Sobre</h2>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {talent.bio}
                    </p>
                  </div>
                )}

                {talent.current_position && (
                  <div>
                    <h2 className="text-xl font-semibold mb-3">Experiência Profissional</h2>
                    <div className="flex gap-3">
                      <Briefcase className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <h3 className="font-medium">{talent.current_position}</h3>
                        {talent.current_company && (
                          <p className="text-muted-foreground">{talent.current_company}</p>
                        )}
                        {talent.years_experience && (
                          <p className="text-sm text-muted-foreground">
                            {formatExperience()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {talent.education_level && (
                  <div>
                    <h2 className="text-xl font-semibold mb-3">Educação</h2>
                    <div className="flex gap-3">
                      <GraduationCap className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <h3 className="font-medium">{talent.education_level}</h3>
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

                {talent.social_links && (
                  <div>
                    <h2 className="text-xl font-semibold mb-3">Redes Sociais</h2>
                    <div className="flex gap-4">
                      {talent.social_links.linkedin && (
                        <Link href={talent.social_links.linkedin} target="_blank" rel="noopener noreferrer" passHref>
                          <Button variant="outline" size="icon">
                            <Linkedin className="h-5 w-5" />
                            <span className="sr-only">LinkedIn</span>
                          </Button>
                        </Link>
                      )}
                      {talent.social_links.website && (
                        <Link href={talent.social_links.website} target="_blank" rel="noopener noreferrer" passHref>
                          <Button variant="outline" size="icon">
                            <Globe className="h-5 w-5" />
                            <span className="sr-only">Website</span>
                          </Button>
                        </Link>
                      )}
                      {/* Add other social links as needed */}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="skills" className="space-y-6 pt-4">
                {talent.skills?.filter(s => s.is_learning_skill).length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold mb-3">Habilidades que Deseja Aprender</h2>
                    <div className="flex flex-wrap gap-2">
                      {talent.skills.filter(s => s.is_learning_skill).map((skill) => (
                        <Badge key={skill.id} variant="secondary" className="text-sm py-1 px-3">
                          {skill.skill_name} ({skill.proficiency_level})
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {talent.skills?.filter(s => s.is_mentor_skill).length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold mb-3">Habilidades que Possui</h2>
                    <div className="flex flex-wrap gap-2">
                      {talent.skills.filter(s => s.is_mentor_skill).map((skill) => (
                        <Badge key={skill.id} variant="outline" className="text-sm py-1 px-3">
                          {skill.skill_name} ({skill.proficiency_level})
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {(talent.skills?.filter(s => s.is_learning_skill).length === 0 && talent.skills?.filter(s => s.is_mentor_skill).length === 0) && (
                  <p className="text-muted-foreground">Nenhuma habilidade informada.</p>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Conectar com {talent.full_name?.split(' ')[0]}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" onClick={handleSendMessage} className="w-full">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Enviar Mensagem
                </Button>
                <Button 
                  onClick={handleSaveToFavorites} 
                  className="w-full"
                  variant="secondary"
                >
                  <Heart className="h-4 w-4 mr-2" />
                  Salvar nos Favoritos
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Informações de Contato</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{talent.email}</span>
                </div>
                {/* Add phone if available */}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Login Required Modal */}
      <LoginRequiredModal 
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        mentorName={talent.full_name || ""}
      />
    </ProtectedRoute>
  )
}

function TalentProfileSkeleton() {
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
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
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
