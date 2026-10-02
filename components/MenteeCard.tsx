"use client"

import { useTranslations } from "next-intl"
import { ContactMenteeModal } from "./ContactMenteeModal"
import { MessageCircle, Linkedin, AlertCircle, X, Eye, Sparkles, User, FileText, Briefcase } from "lucide-react"
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

  return (
    <>
      <div
        className={`group relative flex flex-col h-full bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${
          isAIHighlighted
            ? 'border-primary/40 dark:border-primary-400/40 ring-1 ring-primary/20'
            : 'border-slate-200/80 dark:border-slate-800'
        }`}
      >
        {isAIHighlighted && (
          <div className="absolute top-4 left-4 z-[2] inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/90 text-white backdrop-blur-md shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Recomendado pela IA</span>
          </div>
        )}

        {/* HERO IMAGE */}
        <div className="relative w-full aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-800">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.full_name || "Membro"}
              className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500 ease-out"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-primary-50/20 to-slate-200 dark:from-slate-800 dark:via-slate-850 dark:to-slate-900 select-none">
              <div className="w-20 h-20 rounded-full bg-white dark:bg-slate-800 shadow-md border border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-primary-700 dark:text-primary-300">
                <User className="w-10 h-10 opacity-50" />
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-1.5">
            <h3 className="text-xl font-black text-white leading-tight drop-shadow-md">
              {profile.full_name || "Membro Menvo"}
            </h3>
            {profile.job_title && (
              <div className="flex items-center gap-1.5 text-white/90 text-sm font-medium">
                <Briefcase className="w-3.5 h-3.5 opacity-80" />
                <span className="truncate">
                  {profile.job_title}
                  {profile.company ? ` @ ${profile.company}` : ''}
                </span>
              </div>
            )}
            <div className="flex items-center gap-3 pt-1">
              {profile.linkedin_url && (
                <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors" title="Ver LinkedIn">
                  <Linkedin className="h-4 w-4" />
                </a>
              )}
              {profile.cv_url && (
                <a href={profile.cv_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors" title="Ver currículo">
                  <FileText className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 p-5 flex flex-col">
          <div className="space-y-3 flex-1">
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
                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed italic">
                  "{profile.bio || tCommunity("noBioProvided")}"
                </p>
              </>
            )}

            {topics && topics.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {topics.slice(0, 3).map((area, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="text-[9px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-none px-2"
                  >
                    {area}
                  </Badge>
                ))}
              </div>
            )}
          </div>


          <div className="flex items-center gap-3 pt-6">
            {!isSelf && (
              <ContactMenteeModal
                menteeId={profile.id}
                menteeName={profile.full_name || "Mentorado"}
                isLoggedIn={isAuthenticated}
              >
                <Button
                  variant="outline"
                  className="flex-[1] rounded-xl text-sm font-bold text-primary hover:text-primary hover:border-primary h-12"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  {tCommunity("offerHelp")}
                </Button>
              </ContactMenteeModal>
            )}

            <Button
              size="lg"
              onClick={handleViewProfile}
              className="flex-[1.5] gap-2 font-bold rounded-xl h-12 transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.01]"
            >
              {isSelf ? (
                <>
                  <User className="h-5 w-5" /> Meu Perfil
                </>
              ) : (
                <>
                  Ver Perfil
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

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
