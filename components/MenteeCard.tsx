"use client"

import { useTranslations } from "next-intl"
import { MessageCircle, Linkedin, AlertCircle, X, Eye, Sparkles, User, FileText } from "lucide-react"
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
  cv_url?: string | null
  expertise_areas: string[] | null
  mentorship_topics?: string[] | null
  learning_goals?: string | null
  slug: string | null
  role: string
}

interface MenteeCardProps {
  profile: UserProfile
  isMentor: boolean
  onChat: (userId: string) => void
  /** Highlights the card as an AI-recommended match */
  isAIHighlighted?: boolean
  /** Short AI-generated reason for the recommendation */
  aiReason?: string
}

export function MenteeCard({ profile, isMentor, onChat, isAIHighlighted = false, aiReason }: MenteeCardProps) {
  // Mentees fill "mentorship_topics" (what they want to learn); expertise_areas is a mentor field
  const topics = profile.mentorship_topics?.length ? profile.mentorship_topics : profile.expertise_areas
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
      <Card
        className={`hover:shadow-xl transition-all duration-300 flex flex-col h-full shadow-sm bg-white group overflow-hidden rounded-[2rem] relative ${
          isAIHighlighted ? "border-primary/40 ring-1 ring-primary/20" : "border-none"
        }`}
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 to-primary opacity-0 group-hover:opacity-100 transition-opacity" />

        {isAIHighlighted && (
          <div className="absolute top-4 left-4 z-[2] inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/90 text-white backdrop-blur-md shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Recomendado pela IA</span>
          </div>
        )}
        
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
            </div>
            <div className="space-y-1">
              <CardTitle className="text-xl font-extrabold text-gray-900 group-hover:text-primary transition-colors">
                {profile.full_name || "Membro Menvo"}
              </CardTitle>
              {profile.job_title && (
                <div className="flex flex-col items-center text-sm font-semibold text-primary/70">
                  <span>{profile.job_title}</span>
                  {profile.company && (
                    <span className="text-xs text-muted-foreground font-medium">@{profile.company}</span>
                  )}
                </div>
              )}
              <div className="flex items-center justify-center gap-2 pt-1">
                {profile.linkedin_url && (
                  <div className="flex items-center gap-1 text-blue-500" title="Tem LinkedIn">
                    <Linkedin className="h-3.5 w-3.5" />
                  </div>
                )}
                {profile.cv_url && (
                  <div className="flex items-center gap-1 text-primary" title="Tem currículo">
                    <FileText className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 flex-1 flex flex-col px-8 pb-8">
          <div className="space-y-3 flex-1 text-center">
            {aiReason ? (
              <p className="text-xs text-primary italic line-clamp-3 leading-relaxed border-l-2 border-primary/40 pl-2.5 bg-primary/5 py-1.5 rounded-r-md text-left">
                <Sparkles className="w-3 h-3 inline-block mr-1 -mt-0.5" />
                {aiReason}
              </p>
            ) : (
              <>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                  {tCommunity("seekingHelpWith")}
                </p>
                <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed italic">
                  "{profile.bio || tCommunity("noBioProvided")}"
                </p>
              </>
            )}
          </div>

          {topics && topics.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1.5 pt-2">
              {topics.slice(0, 3).map((area, i) => (
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

          <div className="flex items-center gap-3 pt-6">
            <Button
              variant="outline"
              onClick={handleViewProfile}
              className="flex-1 rounded-xl text-sm font-bold text-muted-foreground hover:text-primary hover:border-primary h-12"
            >
              {tCommunity("viewProfile")}
            </Button>

            <Button
              size="lg"
              onClick={handleHelpClick}
              variant={isSelf ? "outline" : "default"}
              className={`flex-[1.5] gap-2 font-bold rounded-xl h-12 transition-all ${
                isSelf
                  ? "border-primary/30 text-primary hover:bg-primary/5 hover:border-primary"
                  : "shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.01]"
              }`}
            >
              {isSelf ? (
                <>
                  <User className="h-5 w-5 text-primary" /> {tCommunity("myProfile")}
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
              <Link href="/profile?tab=mentorship">
                {tCommunity("disclaimer.becomeMentor")}
              </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
