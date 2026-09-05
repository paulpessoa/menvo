"use client"

import { useTranslations } from "next-intl"
import { MessageCircle, Linkedin, Github, AlertCircle, X, Eye, Sparkles, User } from "lucide-react"
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
  const { isAuthenticated, user, isMentor: authIsMentor, cachedRoles } = useAuth()
  const router = useRouter()
  const [showDisclaimer, setShowDisclaimer] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)

  const effectiveIsMentor =
    isMentor ||
    authIsMentor ||
    cachedRoles?.mentor ||
    cachedRoles?.roles?.includes("mentor") ||
    false

  const isSelf = user?.id === profile.id

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

    if (isSelf) {
      router.push("/profile")
      return
    }

    if (!effectiveIsMentor) {
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
              variant={isSelf ? "outline" : "default"}
              className={`w-full gap-2 font-bold rounded-xl h-12 transition-all ${
                isSelf
                  ? "border-primary/30 text-primary hover:bg-primary/5 hover:border-primary"
                  : "shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.01]"
              }`}
            >
              {isSelf ? (
                <>
                  <User className="h-5 w-5 text-primary" /> Meu Perfil
                </>
              ) : (
                <>
                  <MessageCircle className="h-5 w-5" /> {tCommunity("offerHelp")}
                </>
              )}
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
        <DialogContent className="max-w-md p-6 sm:p-8 rounded-3xl border shadow-2xl">
          <DialogHeader className="text-left space-y-3">
            <div className="bg-amber-500/10 text-amber-600 border border-amber-500/20 w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black text-gray-900 tracking-tight">
                {tCommunity("disclaimer.title")}
              </DialogTitle>
              <DialogDescription className="text-sm pt-2 text-muted-foreground leading-relaxed">
                {tCommunity("disclaimer.description", {
                  name: profile.full_name || "este membro"
                })}
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="bg-muted/40 p-4 rounded-2xl border border-border/50 text-sm space-y-1.5 mt-2">
            <p className="font-bold text-gray-900 flex items-center gap-1.5 text-xs uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              {tCommunity("disclaimer.whyTitle")}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {tCommunity("disclaimer.whyDescription")}
            </p>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-6 sm:space-x-0">
            <Button
              variant="outline"
              className="sm:flex-1 h-12 rounded-xl font-bold border-2 hover:bg-muted"
              onClick={() => {
                setShowDisclaimer(false)
                onChat(profile.id)
              }}
            >
              {tCommunity("disclaimer.chatAnyway")}
            </Button>
            <Button
              className="sm:flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20 rounded-xl"
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
