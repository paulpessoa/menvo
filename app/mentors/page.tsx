"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MapPin, Star, Clock } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/utils/supabase/client"

interface Mentor {
  id: string
  full_name: string
  avatar_url?: string
  bio?: string
  expertise: string[]
  location?: string
  rating?: number
  hourly_rate?: number
  availability_status: string
}

function MentorsList() {
  const searchParams = useSearchParams()
  const [mentors, setMentors] = useState<Mentor[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const search = searchParams.get("search") || ""
  const expertise = searchParams.get("expertise") || ""

  useEffect(() => {
    fetchMentors()
  }, [search, expertise])

  const fetchMentors = async () => {
    try {
      let query = supabase.from("profiles").select("*").eq("role", "mentor").eq("status", "active")

      if (search) {
        query = query.or(`full_name.ilike.%${search}%,bio.ilike.%${search}%`)
      }

      const { data, error } = await query

      if (error) {
        console.error("Erro ao buscar mentores:", error)
        return
      }

      setMentors(data || [])
    } catch (error) {
      console.error("Erro ao buscar mentores:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Encontre seu Mentor</h1>
        <p className="text-gray-600">Conecte-se com mentores experientes e acelere seu crescimento profissional</p>
      </div>

      {mentors.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum mentor encontrado</h3>
          <p className="text-gray-500">Tente ajustar seus filtros de busca</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mentors.map((mentor) => (
            <Card key={mentor.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={mentor.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback>{mentor.full_name?.charAt(0) || "M"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{mentor.full_name}</CardTitle>
                    {mentor.location && (
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPin className="w-4 h-4 mr-1" />
                        {mentor.location}
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {mentor.bio && <CardDescription className="mb-4 line-clamp-3">{mentor.bio}</CardDescription>}

                {mentor.expertise && mentor.expertise.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {mentor.expertise.slice(0, 3).map((skill, index) => (
                      <Badge key={index} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                    {mentor.expertise.length > 3 && (
                      <Badge variant="outline">+{mentor.expertise.length - 3} mais</Badge>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    {mentor.rating && (
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 mr-1" />
                        {mentor.rating.toFixed(1)}
                      </div>
                    )}
                    {mentor.availability_status === "available" && (
                      <div className="flex items-center text-green-600">
                        <Clock className="w-4 h-4 mr-1" />
                        Disponível
                      </div>
                    )}
                  </div>
                  {mentor.hourly_rate && <div className="text-lg font-semibold">R$ {mentor.hourly_rate}/h</div>}
                </div>

                <Button asChild className="w-full mt-4">
                  <Link href={`/mentors/${mentor.id}`}>Ver Perfil</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default function MentorsPage() {
  return (
    <Suspense fallback={<div>Carregando mentores...</div>}>
      <MentorsList />
    </Suspense>
  )
}
