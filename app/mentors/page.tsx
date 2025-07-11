"use client"

import type React from "react"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, MapPin, Star, Users } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/utils/supabase/client"
import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"
import { WaitingList } from "@/components/WaitingList"

interface Mentor {
  id: string
  full_name: string
  avatar_url?: string
  bio?: string
  expertise: string[]
  location?: string
  rating?: number
  sessions_count?: number
  status: string
}

function MentorsContent() {
  const searchParams = useSearchParams()
  const { isAuthenticated } = useAuth()
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "")
  const supabase = createClient()

  const { data: mentors, isLoading } = useQuery({
    queryKey: ["mentors", searchTerm],
    queryFn: async () => {
      let query = supabase.from("profiles").select("*").eq("role", "mentor").eq("status", "active")

      if (searchTerm) {
        query = query.or(`full_name.ilike.%${searchTerm}%,bio.ilike.%${searchTerm}%,expertise.cs.{${searchTerm}}`)
      }

      const { data, error } = await query.order("created_at", { ascending: false })

      if (error) {
        console.error("Erro ao buscar mentores:", error)
        return []
      }

      return data as Mentor[]
    },
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // A query será refeita automaticamente devido ao queryKey
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Encontre um Mentor</h1>
          <p className="text-muted-foreground mb-6">
            Navegue pela nossa comunidade de mentores voluntários e encontre o match perfeito para suas necessidades
          </p>

          {/* Barra de Busca */}
          <form onSubmit={handleSearch} className="flex gap-2 max-w-md mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Buscar por nome, especialidade ou palavras-chave..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit">Buscar</Button>
          </form>
        </div>

        {/* Resultados */}
        {isLoading ? (
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
        ) : mentors && mentors.length > 0 ? (
          <>
            <div className="mb-4 text-sm text-muted-foreground">{mentors.length} mentores encontrados</div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mentors.map((mentor) => (
                <Card key={mentor.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center space-x-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={mentor.avatar_url || "/placeholder.svg"} alt={mentor.full_name} />
                        <AvatarFallback>
                          {mentor.full_name
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{mentor.full_name}</CardTitle>
                        {mentor.location && (
                          <CardDescription className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {mentor.location}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {mentor.bio && <p className="text-sm text-muted-foreground line-clamp-2">{mentor.bio}</p>}

                    {mentor.expertise && mentor.expertise.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Especialidades:</p>
                        <div className="flex flex-wrap gap-1">
                          {mentor.expertise.slice(0, 3).map((skill, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {mentor.expertise.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{mentor.expertise.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      {mentor.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span>{mentor.rating.toFixed(1)}</span>
                        </div>
                      )}
                      {mentor.sessions_count && (
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{mentor.sessions_count} sessões</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {isAuthenticated ? (
                        <>
                          <Button asChild className="flex-1">
                            <Link href={`/mentors/${mentor.id}`}>Ver Perfil</Link>
                          </Button>
                          <Button asChild variant="outline">
                            <Link href={`/mentors/${mentor.id}/schedule`}>Agendar</Link>
                          </Button>
                        </>
                      ) : (
                        <Button asChild className="w-full bg-transparent" variant="outline">
                          <Link href="/login">Fazer login para ver perfil</Link>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Nenhum mentor encontrado</h3>
              <p>Tente ajustar os filtros ou termos de busca</p>
            </div>
            {searchTerm && (
              <Button variant="outline" onClick={() => setSearchTerm("")} className="mt-4">
                Limpar busca
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}


// export default function MentorsPage() {
//   return (
//     <Suspense fallback={<div>Carregando...</div>}>
//       <MentorsContent />
//     </Suspense>
//   )
// }



export default function MentorsPage() {
  const router = useRouter()

  const estamosLotados = true

  return (
    <div className="relative">
      <div className={estamosLotados ? 'blur-sm pointer-events-none' : ''}>
        <Suspense fallback={<div>Carregando...</div>}>
          <MentorsContent />
        </Suspense>
      </div>
      {estamosLotados  && (
        <div className="fixed inset-0 z-30 flex items-center justify-center">
          <WaitingList isOpen={true} onClose={() => router.push('/')} />
        </div>
      )}
    </div>
  )
}
