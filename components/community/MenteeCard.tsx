"use client"

import { useTranslations } from "next-intl"
import { MessageCircle, Linkedin, Github, AlertCircle, X, Eye } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Link, useRouter } from "@/i18n/routing"
import { LoginRequiredModal } from "@/components/auth/LoginRequiredModal"
import { useAuth } from "@/lib/auth"

interface UserProfile {
  id: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  job_title: string | null
  company: string | null
  linkedin_url: string | null
  github_url: string | null
  expertise_areas: string[] | null
  slug: string | null
  role: string
}

interface MenteeCardProps {
  profile: UserProfile
  isMentor: boolean
  onChat: (userId: string) => void
}

export function MenteeCard({ profile, isMentor, onChat }: MenteeCardProps) {
  const tCommunity = useTranslations("community")
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const [showDisclaimer, setShowDisclaimer] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)

  const handleProtectedAction = (e: React.MouseEvent, callback: () => void) => {
    e.preventDefault()
    if (!isAuthenticated) {
      setShowLoginModal(true)
      return
    }
    callback()
  }

  const handleViewProfile = () => {
    if (!isAuthenticated) {
      setShowLoginModal(true)
      return
    }
    if (profile.slug) {
      router.push(`/mentee/${profile.slug}`)
    }
  }

  const handleHelpClick = () => {
    if (!isAuthenticated) {
      setShowLoginModal(true)
      return
    }

    if (!isMentor) {
      setShowDisclaimer(true)
    } else {
      onChat(profile.id)
    }
  }

  return (
    <>
      <Card className="hover:shadow-xl transition-all duration-300 flex flex-col h-full border-none shadow-sm bg-white group overflow-hidden rounded-[2rem]">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 to-primary opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <CardHeader className="pb-3 px-6 pt-8">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="relative">
              <Avatar className="h-20 w-20 border-4 border-white shadow-xl group-hover:scale-105 transition-transform duration-300">
                <AvatarImage
                  src={profile.avatar_url || ""}
                  alt={profile.full_name || "Membro"}
                />
                <AvatarFallback className="bg-primary/5 text-primary text-xl font-bold">
                  {profile.full_name?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 bg-green-500 h-4 w-4 rounded-full border-2 border-white shadow-sm" title="Disponível para aprender" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-xl font-extrabold text-gray-900 group-hover:text-primary transition-colors">
                {profile.full_name || "Membro Menvo"}
              </CardTitle>
              <div className="flex flex-col items-center text-sm font-semibold text-primary/70">
                <span>{profile.job_title || "Mentorado"}</span>
                {profile.company && (
                    <span className="text-xs text-muted-foreground font-medium">@{profile.company}</span>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 flex-1 flex flex-col px-8 pb-8">
          <div className="space-y-3 flex-1 text-center">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
              {tCommunity("seekingHelpWith")}
            </p>
            <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed italic">
              "{profile.bio || tCommunity("noBioProvided")}"
            </p>
          </div>

          {profile.expertise_areas && profile.expertise_areas.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1.5 pt-2">
              {profile.expertise_areas.slice(0, 3).map((area, i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="text-[9px] font-bold uppercase tracking-wider bg-primary/5 text-primary border-none px-2"
                >
                  {area}
                </Badge>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-4 pt-6">
            <div className="flex items-center justify-between gap-4">
               <div className="flex gap-2">
                {profile.linkedin_url && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-xl text-blue-600 bg-blue-50/50 hover:bg-blue-100 hover:scale-110 transition-all"
                    onClick={(e) => handleProtectedAction(e, () => window.open(profile.linkedin_url!, '_blank'))}
                  >
                    <Linkedin className="h-4 w-4" />
                  </Button>
                )}
                {profile.github_url && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-xl text-gray-900 bg-gray-100/50 hover:bg-gray-200 hover:scale-110 transition-all"
                    onClick={(e) => handleProtectedAction(e, () => window.open(profile.github_url!, '_blank'))}
                  >
                    <Github className="h-4 w-4" />
                  </Button>
                )}
               </div>
               
               <Button
                  variant="outline"
                  size="sm"
                  onClick={handleViewProfile}
                  className="rounded-xl text-xs font-bold text-muted-foreground hover:text-primary hover:border-primary px-4"
               >
                 Ver Perfil
               </Button>
            </div>

            <Button
              size="lg"
              onClick={handleHelpClick}
              className="w-full gap-2 font-bold shadow-lg shadow-primary/20 rounded-xl h-12"
            >
              <MessageCircle className="h-5 w-5" /> {tCommunity("offerHelp")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Login Necessário */}
      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />

      {/* Disclaimer Modal (Para usuários logados que não são mentores) */}
      <Dialog open={showDisclaimer} onOpenChange={setShowDisclaimer}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="bg-yellow-100 w-14 h-14 rounded-full flex items-center justify-center mb-4 text-yellow-600 shadow-inner">
              <AlertCircle className="h-8 w-8" />
            </div>
            <DialogTitle className="text-2xl font-bold text-gray-900">
              {tCommunity("disclaimer.title")}
            </DialogTitle>
            <DialogDescription className="text-base pt-2 text-gray-600 leading-relaxed">
              {tCommunity("disclaimer.description", {
                name: profile.full_name || "este membro"
              })}
            </DialogDescription>
          </DialogHeader>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm space-y-2 mt-2">
            <p className="font-bold text-gray-900">
              {tCommunity("disclaimer.whyTitle")}
            </p>
            <p className="text-gray-500 leading-snug">
              {tCommunity("disclaimer.whyDescription")}
            </p>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button
              variant="outline"
              className="sm:flex-1 h-11 font-semibold"
              onClick={() => {
                setShowDisclaimer(false)
                onChat(profile.id)
              }}
            >
              {tCommunity("disclaimer.chatAnyway")}
            </Button>
            <Button
              className="sm:flex-1 h-11 bg-green-600 hover:bg-green-700 font-bold shadow-lg"
              asChild
            >
              <Link href="/profile">
                {tCommunity("disclaimer.becomeMentor")}
              </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
