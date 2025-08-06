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
import { BookOpen, Briefcase, Calendar, Clock, ExternalLink, Flag, Globe, GraduationCap, Heart, Linkedin, MapPin, MessageSquare, Share2, Star, User, Github, Building, Mail, Phone } from 'lucide-react'
import { useMentorAvailability, useMentorStats } from "@/hooks/useMentorship"
import { mockMentors } from "@/data/mock-mentors" // Reusing mockMentors for talent profiles
import { notFound } from "next/navigation"
import ProtectedRoute from "@/components/auth/ProtectedRoute"

interface TalentProfilePageProps {
  params: { id: string }
}

export default function TalentProfilePage({ params }: TalentProfilePageProps) {
  // For simplicity, reusing mockMentors data for talent profiles.
  // In a real app, you'd fetch from a 'talent' or 'mentees' specific data source.
  const talent = mockMentors.find((t) => t.id === params.id)

  if (!talent) {
    notFound()
  }

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  const { data: availability } = useMentorAvailability(talent.isMentor ? talent.id : '')
  const { data: mentorStats } = useMentorStats(talent.isMentor ? talent.id : '')

  const fullName = talent.name
  const primaryRole = talent.roles[0]
  const canMentor = talent.isMentor
  const isAvailable = talent.availability === 'available'

  const mentorSkills = talent.skills?.filter(skill => skill.isMentorSkill) || []
  const learningSkills = talent.skills?.filter(skill => !skill.isMentorSkill) || []

  return (
    <ProtectedRoute requiredRoles={['mentee', 'mentor', 'admin']}>
      <div className="container mx-auto px-4 py-8 md:py-12">
        <Card className="max-w-4xl mx-auto">
          <CardHeader className="flex flex-col md:flex-row items-center gap-6 p-6">
            <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-primary-foreground shadow-md">
              <Image
                src={talent.avatar || '/placeholder-user.jpg'}
                alt={talent.name}
                layout="fill"
                objectFit="cover"
              />
            </div>
            <div className="text-center md:text-left flex-grow">
              <CardTitle className="text-3xl font-bold">{talent.name}</CardTitle>
              <CardDescription className="text-lg text-muted-foreground">
                {talent.occupation}
              </CardDescription>
              <div className="flex items-center justify-center md:justify-start gap-2 mt-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{talent.location}</span>
              </div>
              <div className="mt-4 flex justify-center md:justify-start gap-3">
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
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Enviar Mensagem
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
          </CardHeader>

          <Separator className="my-6" />

          <CardContent className="p-6 space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-4">Sobre {talent.name.split(' ')[0]}</h2>
              <p className="text-muted-foreground leading-relaxed">
                {talent.bio}
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">Interesses e Habilidades</h2>
              <div className="flex flex-wrap gap-2">
                {talent.expertise.map((skill, index) => (
                  <Badge key={index} variant="secondary">{skill}</Badge>
                ))}
                {/* Assuming 'interests' would also be displayed here if available in talent data */}
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">Experiência Profissional</h2>
              <div className="space-y-4">
                {talent.experience.map((exp, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <Briefcase className="h-6 w-6 text-muted-foreground mt-1" />
                    <div>
                      <h3 className="font-semibold text-lg">{exp.title}</h3>
                      <p className="text-muted-foreground">{exp.company} ({exp.years})</p>
                      <p className="text-sm text-muted-foreground">{exp.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">Educação</h2>
              <div className="space-y-4">
                {talent.education.map((edu, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <GraduationCap className="h-6 w-6 text-muted-foreground mt-1" />
                    <div>
                      <h3 className="font-semibold text-lg">{edu.degree}</h3>
                      <p className="text-muted-foreground">{edu.institution} ({edu.years})</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {talent.languages && talent.languages.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Idiomas</h2>
                <div className="flex flex-wrap gap-2">
                  {talent.languages.map((lang, index) => (
                    <Badge key={index} variant="outline">{lang}</Badge>
                  ))}
                </div>
              </div>
            )}

            {talent.social && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Redes Sociais</h2>
                <div className="flex gap-4">
                  {talent.social.linkedin && (
                    <Link href={talent.social.linkedin} target="_blank" rel="noopener noreferrer" passHref>
                      <Button variant="outline" size="icon">
                        <Linkedin className="h-5 w-5" />
                        <span className="sr-only">LinkedIn</span>
                      </Button>
                    </Link>
                  )}
                  {/* Add other social links as needed */}
                </div>
              </div>
            )}

            {canMentor && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Mentoria</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-primary-600">
                        {mentorStats?.completed || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Sessões Completas
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {mentorStats?.pending || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Pendentes
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {mentorStats?.confirmed || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Confirmadas
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-gray-600">
                        {mentorStats?.total || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Total
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <div className="mt-6">
                  <h2 className="text-2xl font-bold mb-4">Disponibilidade</h2>
                  <div className="space-y-3">
                    {availability && availability.length > 0 && (
                      availability.map((slot) => (
                        <div key={slot.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {slot.dayOfWeek}
                            </span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {slot.startTime} - {slot.endTime}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {talent.company && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Informações da Empresa</h2>
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Building className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <h3 className="font-semibold">{talent.company.name}</h3>
                          {talent.company.verified && (
                            <Badge variant="default" className="mt-1">
                              Empresa Verificada
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {talent.company.description && (
                        <p className="text-muted-foreground">{talent.company.description}</p>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {talent.company.size && (
                          <div>
                            <span className="font-medium">Tamanho:</span>
                            <span className="ml-2 capitalize">{talent.company.size}</span>
                          </div>
                        )}
                        {talent.company.industry && (
                          <div>
                            <span className="font-medium">Setor:</span>
                            <span className="ml-2">{talent.company.industry}</span>
                          </div>
                        )}
                      </div>
                      
                      {talent.company.website && (
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <a 
                            href={talent.company.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:underline"
                          >
                            {talent.company.website}
                          </a>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Schedule Session Modal */}
      {canMentor && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-8 rounded-lg w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Agendar Mentoria com {fullName}</h2>
            <div className="space-y-4">
              {availability && availability.length > 0 && (
                availability.map((slot) => (
                  <div key={slot.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {slot.dayOfWeek}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {slot.startTime} - {slot.endTime}
                    </span>
                    <Button variant="outline" className="ml-auto">
                      Agendar
                    </Button>
                  </div>
                ))
              )}
            </div>
            <Button variant="ghost" className="mt-6" onClick={() => setIsScheduleModalOpen(false)}>
              Fechar
            </Button>
          </div>
        </div>
      )}
    </ProtectedRoute>
  )
}
