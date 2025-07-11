"use client"

import type React from "react"

import { Suspense, useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MapPin, Star, Search } from "lucide-react"
import Link from "next/link"

// Mock data para demonstração
const mockMentors = [
  {
    id: "1",
    name: "Ana Silva",
    title: "Senior Software Engineer",
    company: "Google",
    location: "São Paulo, SP",
    rating: 4.9,
    reviews: 127,
    expertise: ["React", "Node.js", "TypeScript"],
    avatar: "/placeholder.svg?height=100&width=100",
    price: "R$ 150/hora",
  },
  {
    id: "2",
    name: "Carlos Santos",
    title: "Product Manager",
    company: "Microsoft",
    location: "Rio de Janeiro, RJ",
    rating: 4.8,
    reviews: 89,
    expertise: ["Product Strategy", "Agile", "Leadership"],
    avatar: "/placeholder.svg?height=100&width=100",
    price: "R$ 200/hora",
  },
  {
    id: "3",
    name: "Maria Oliveira",
    title: "UX Designer",
    company: "Figma",
    location: "Belo Horizonte, MG",
    rating: 4.9,
    reviews: 156,
    expertise: ["UI/UX", "Design Systems", "Prototyping"],
    avatar: "/placeholder.svg?height=100&width=100",
    price: "R$ 120/hora",
  },
]

function MentorsList() {
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredMentors, setFilteredMentors] = useState(mockMentors)

  useEffect(() => {
    const search = searchParams.get("search") || ""
    setSearchTerm(search)

    if (search) {
      const filtered = mockMentors.filter(
        (mentor) =>
          mentor.name.toLowerCase().includes(search.toLowerCase()) ||
          mentor.title.toLowerCase().includes(search.toLowerCase()) ||
          mentor.expertise.some((skill) => skill.toLowerCase().includes(search.toLowerCase())),
      )
      setFilteredMentors(filtered)
    } else {
      setFilteredMentors(mockMentors)
    }
  }, [searchParams])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const filtered = mockMentors.filter(
      (mentor) =>
        mentor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mentor.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mentor.expertise.some((skill) => skill.toLowerCase().includes(searchTerm.toLowerCase())),
    )
    setFilteredMentors(filtered)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Encontre seu Mentor</h1>
        <p className="text-gray-600 mb-6">Conecte-se com profissionais experientes e acelere seu crescimento</p>

        <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar por nome, cargo ou habilidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit">Buscar</Button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMentors.map((mentor) => (
          <Card key={mentor.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={mentor.avatar || "/placeholder.svg"} alt={mentor.name} />
                  <AvatarFallback>
                    {mentor.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-lg">{mentor.name}</CardTitle>
                  <CardDescription>{mentor.title}</CardDescription>
                  <p className="text-sm text-gray-600">{mentor.company}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  {mentor.location}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{mentor.rating}</span>
                  </div>
                  <span className="text-sm text-gray-600">({mentor.reviews} avaliações)</span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {mentor.expertise.slice(0, 3).map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="font-semibold text-green-600">{mentor.price}</span>
                  <Link href={`/mentors/${mentor.id}`}>
                    <Button size="sm">Ver Perfil</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredMentors.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Nenhum mentor encontrado com os critérios de busca.</p>
        </div>
      )}
    </div>
  )
}

export default function MentorsPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8">Carregando mentores...</div>}>
      <MentorsList />
    </Suspense>
  )
}
