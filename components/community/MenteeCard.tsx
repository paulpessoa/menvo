"use client"

import { useTranslations } from "next-intl"
import { MessageCircle, Linkedin, Github, AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import Link from "next/link"
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
    role: string
}

interface MenteeCardProps {
    profile: UserProfile
    isMentor: boolean
    onChat: (userId: string) => void
}

export function MenteeCard({ profile, isMentor, onChat }: MenteeCardProps) {
    const t = useTranslations("community")
    const { isAuthenticated } = useAuth()
    const [showDisclaimer, setShowDisclaimer] = useState(false)
    const [showLoginModal, setShowLoginModal] = useState(false)

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
            <Card className="hover:shadow-md transition-all flex flex-col h-full border-2 hover:border-primary/20">
                <CardHeader className="pb-3">
                    <div className="flex items-center space-x-4">
                        <Avatar className="h-14 w-14 border-2 border-muted">
                            <AvatarImage src={profile.avatar_url || ""} />
                            <AvatarFallback>{profile.full_name?.[0] || 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg truncate">{profile.full_name || "Membro Menvo"}</CardTitle>
                            <CardDescription className="text-sm truncate">
                                {profile.job_title}{profile.company ? ` @ ${profile.company}` : ""}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4 flex-1 flex flex-col">
                    <div className="space-y-2 flex-1">
                        <p className="text-xs font-bold text-primary uppercase tracking-wider">{t("seekingHelpWith")}</p>
                        <p className="text-sm text-muted-foreground line-clamp-3 italic">
                            "{profile.bio || t("noBioProvided")}"
                        </p>
                    </div>

                    {profile.expertise_areas && profile.expertise_areas.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {profile.expertise_areas.map((area, i) => (
                                <Badge key={i} variant="secondary" className="text-[10px] font-normal">
                                    {area}
                                </Badge>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center gap-2 pt-2 border-t">
                        {profile.linkedin_url && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" asChild>
                                <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer">
                                    <Linkedin className="h-4 w-4" />
                                </a>
                            </Button>
                        )}
                        {profile.github_url && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-900" asChild>
                                <a href={profile.github_url} target="_blank" rel="noopener noreferrer">
                                    <Github className="h-4 w-4" />
                                </a>
                            </Button>
                        )}
                        <div className="flex-1" />
                        <Button size="sm" onClick={handleHelpClick} className="gap-2">
                            <MessageCircle className="h-4 w-4" /> {t("offerHelp")}
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
                <DialogContent>
                    <DialogHeader>
                        <div className="bg-yellow-100 w-12 h-12 rounded-full flex items-center justify-center mb-4 text-yellow-600">
                            <AlertCircle className="h-6 w-6" />
                        </div>
                        <DialogTitle className="text-xl">{t("disclaimer.title")}</DialogTitle>
                        <DialogDescription className="text-base pt-2">
                            {t("disclaimer.description", { name: profile.full_name })}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="bg-muted/50 p-4 rounded-lg text-sm space-y-2">
                        <p className="font-semibold">{t("disclaimer.whyTitle")}</p>
                        <p>{t("disclaimer.whyDescription")}</p>
                    </div>
                    <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
                        <Button variant="outline" className="sm:flex-1" onClick={() => { setShowDisclaimer(false); onChat(profile.id); }}>
                            {t("disclaimer.chatAnyway")}
                        </Button>
                        <Button className="sm:flex-1 bg-green-600 hover:bg-green-700" asChild>
                            <Link href="/profile/setup?role=mentor">{t("disclaimer.becomeMentor")}</Link>
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
