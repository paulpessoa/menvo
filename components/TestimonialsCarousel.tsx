"use client"

import { useRef } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star, ChevronLeft, ChevronRight, MapPin } from "lucide-react"

interface Testimonial {
    id: number
    name: string
    role: string
    company?: string
    type: 'mentor' | 'mentee'
    rating: number
    text: string
    avatar: string
    mentorshipArea?: string
    city?: string
    country?: string
}

export function TestimonialsCarousel() {
    const scrollContainerRef = useRef<HTMLDivElement>(null)

    // Mock de depoimentos reais com áreas diversificadas
    const testimonials: Testimonial[] = [
        {
            id: 1,
            name: "Ana Silva",
            role: "Desenvolvedora Frontend",
            company: "Tech Corp",
            type: "mentee",
            rating: 5,
            text: "A mentoria mudou completamente minha carreira! Em 3 meses consegui minha primeira vaga como dev.",
            avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
            mentorshipArea: "Desenvolvimento Web",
            city: "São Paulo",
            country: "Brasil"
        },
        {
            id: 2,
            name: "Carlos Mendes",
            role: "Psicólogo Organizacional",
            company: "RH Consultoria",
            type: "mentor",
            rating: 5,
            text: "Ser mentor no MENVO é uma das experiências mais gratificantes. Ajudar pessoas a desenvolverem inteligência emocional não tem preço.",
            avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
            mentorshipArea: "Psicologia & RH",
            city: "Lisboa",
            country: "Portugal"
        },
        {
            id: 3,
            name: "Mariana Costa",
            role: "Chef de Cozinha",
            company: "Restaurante Gourmet",
            type: "mentee",
            rating: 5,
            text: "Estava perdida na transição de carreira. Minha mentora me guiou desde o básico até abrir meu próprio negócio.",
            avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop",
            mentorshipArea: "Gastronomia",
            city: "Buenos Aires",
            country: "Argentina"
        },
        {
            id: 4,
            name: "Roberto Santos",
            role: "Arquiteto Sustentável",
            company: "EcoDesign Studio",
            type: "mentor",
            rating: 5,
            text: "Mentorear através do MENVO me permite compartilhar práticas sustentáveis. Já ajudei mais de 20 profissionais!",
            avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop",
            mentorshipArea: "Arquitetura",
            city: "Barcelona",
            country: "Espanha"
        },
        {
            id: 5,
            name: "Juliana Oliveira",
            role: "Professora de Yoga",
            company: "Bem-Estar Studio",
            type: "mentee",
            rating: 5,
            text: "Saí de uma área completamente diferente para o bem-estar. Hoje tenho meu próprio estúdio!",
            avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop",
            mentorshipArea: "Saúde & Bem-Estar",
            city: "Rio de Janeiro",
            country: "Brasil"
        },
        {
            id: 6,
            name: "Pedro Lima",
            role: "Advogado Trabalhista",
            company: "Lima & Associados",
            type: "mentor",
            rating: 5,
            text: "O MENVO democratiza o acesso à orientação jurídica. A satisfação de ajudar é indescritível.",
            avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop",
            mentorshipArea: "Direito",
            city: "Porto",
            country: "Portugal"
        },
        {
            id: 7,
            name: "Fernanda Rocha",
            role: "Designer de Moda",
            company: "Atelier Criativo",
            type: "mentee",
            rating: 5,
            text: "A mentoria me ajudou a entender o mercado de moda e lançar minha primeira coleção.",
            avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop",
            mentorshipArea: "Moda & Design",
            city: "Milão",
            country: "Itália"
        },
        {
            id: 8,
            name: "Lucas Ferreira",
            role: "Contador Sênior",
            company: "Contabilidade Plus",
            type: "mentor",
            rating: 5,
            text: "Compartilhar conhecimento sobre finanças e contabilidade é minha forma de retribuir à comunidade.",
            avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop",
            mentorshipArea: "Contabilidade",
            city: "Belo Horizonte",
            country: "Brasil"
        }
    ]

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 400
            const newScrollLeft = scrollContainerRef.current.scrollLeft + (direction === 'right' ? scrollAmount : -scrollAmount)
            scrollContainerRef.current.scrollTo({
                left: newScrollLeft,
                behavior: 'smooth'
            })
        }
    }

    return (
        <div className="w-full space-y-6">
            {/* Carrossel */}
            <div className="max-w-7xl mx-auto">
                <div
                    ref={scrollContainerRef}
                    className="overflow-x-auto scrollbar-hide"
                    style={{
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                    }}
                >
                    <div className="flex gap-6">
                        {testimonials.map((testimonial) => (
                            <Card
                                key={testimonial.id}
                                className="flex-shrink-0 w-96 border border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg"
                            >
                                <CardContent className="p-6">
                                    {/* Header com Avatar e Info */}
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="relative w-12 h-12 flex-shrink-0">
                                            <Image
                                                src={testimonial.avatar}
                                                alt={testimonial.name}
                                                width={48}
                                                height={48}
                                                className="rounded-full object-cover"
                                            />
                                            <div className="absolute -bottom-1 -right-1">
                                                <Badge
                                                    variant={testimonial.type === 'mentor' ? 'default' : 'secondary'}
                                                    className="text-xs px-1.5 py-0.5 h-5"
                                                >
                                                    {testimonial.type === 'mentor' ? '👨‍🏫' : '👨‍🎓'}
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-sm truncate">{testimonial.name}</h3>
                                            <p className="text-xs text-muted-foreground truncate">{testimonial.role}</p>
                                            {testimonial.company && (
                                                <p className="text-xs text-muted-foreground truncate">{testimonial.company}</p>
                                            )}
                                            {(testimonial.city || testimonial.country) && (
                                                <div className="flex items-center gap-1 mt-1">
                                                    <MapPin className="w-3 h-3 text-muted-foreground" />
                                                    <p className="text-xs text-muted-foreground truncate">
                                                        {testimonial.city}{testimonial.city && testimonial.country && ', '}{testimonial.country}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Rating */}
                                    <div className="flex gap-1 mb-3">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <Star
                                                key={i}
                                                className={`w-3 h-3 ${i < testimonial.rating
                                                    ? 'fill-yellow-400 text-yellow-400'
                                                    : 'text-gray-300'
                                                    }`}
                                            />
                                        ))}
                                    </div>

                                    {/* Depoimento */}
                                    <blockquote className="text-sm leading-relaxed text-foreground/80 mb-4">
                                        "{testimonial.text}"
                                    </blockquote>

                                    {/* Área de Mentoria */}
                                    {testimonial.mentorshipArea && (
                                        <Badge variant="outline" className="text-xs">
                                            {testimonial.mentorshipArea}
                                        </Badge>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>

            {/* Botões de Navegação */}
            <div className="flex justify-center gap-4">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => scroll('left')}
                    className="rounded-full"
                    aria-label="Ver depoimentos anteriores"
                >
                    <ChevronLeft className="w-5 h-5" />
                    <span className="sr-only">Ver depoimentos anteriores</span>
                </Button>

                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => scroll('right')}
                    className="rounded-full"
                    aria-label="Ver próximos depoimentos"
                >
                    <ChevronRight className="w-5 h-5" />
                    <span className="sr-only">Ver próximos depoimentos</span>
                </Button>
            </div>

            <style jsx>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </div>
    )
}
