"use client"

import { useTranslations } from "next-intl"
import { MessageCircle, Linkedin, Github, AlertCircle, X } from "lucide-react"
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
    const tCommunity = useTranslations("community")
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
            <Card className="hover:shadow-md transition-all flex flex-col h-full border-2 hover:border-primary/20 bg-white">
                <CardHeader className="pb-3 px-6 pt-6">
                    <div className="flex items-center space-x-4">
                        <Avatar className="h-14 w-14 border-2 border-muted shadow-sm">
                            <AvatarImage src={profile.avatar_url || ""} alt={profile.full_name || "Membro"} />
                            <AvatarFallback className="bg-primary/5 text-primary font-bold">
                                {profile.full_name?.[0]?.toUpperCase() || 'U'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg truncate font-bold text-gray-900">{profile.full_name || "Membro Menvo"}</CardTitle>
                            <CardDescription className="text-sm truncate text-gray-500 font-medium">
                                {profile.job_title}{profile.company ? ` @ ${profile.company}` : ""}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4 flex-1 flex flex-col px-6 pb-6">
                    <div className="space-y-2 flex-1">
                        <p className="text-[10px] font-bold text-primary uppercase tracking-widest">{tCommunity("seekingHelpWith")}</p>
                        <p className="text-sm text-gray-600 line-clamp-3 italic leading-relaxed">
                            "{profile.bio || tCommunity("noBioProvided")}"
                        </p>
                    </div>

                    {profile.expertise_areas && profile.expertise_areas.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-2">
                            {profile.expertise_areas.slice(0, 4).map((area, i) => (
                                <Badge key={i} variant="secondary" className="text-[10px] font-semibold bg-gray-100 text-gray-700 border-none">
                                    {area}
                                </Badge>
                            ))}
                            {profile.expertise_areas.length > 4 && (
                                <Badge variant="outline" className="text-[10px] border-none text-gray-400">
                                    +{profile.expertise_areas.length - 4}
                                </Badge>
                            )}
                        </div>
                    )}

                    <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                        {profile.linkedin_url && (
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-blue-600 hover:bg-blue-50" asChild>
                                <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer">
                                    <Linkedin className="h-5 w-5" />
                                </a>
                            </Button>
                        )}
                        {profile.github_url && (
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-900 hover:bg-gray-100" asChild>
                                <a href={profile.github_url} target="_blank" rel="noopener noreferrer">
                                    <Github className="h-5 w-5" />
                                </a>
                            </Button>
                        )}
                        <div className="flex-1" />
                        <Button size="sm" onClick={handleHelpClick} className="gap-2 font-bold shadow-sm">
                            <MessageCircle className="h-4 w-4" /> {tCommunity("offerHelp")}
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
                        <DialogTitle className="text-2xl font-bold text-gray-900">{tCommunity("disclaimer.title")}</DialogTitle>
                        <DialogDescription className="text-base pt-2 text-gray-600 leading-relaxed">
                            {tCommunity("disclaimer.description", { name: profile.full_name || "este membro" })}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm space-y-2 mt-2">
                        <p className="font-bold text-gray-900">{tCommunity("disclaimer.whyTitle")}</p>
                        <p className="text-gray-500 leading-snug">{tCommunity("disclaimer.whyDescription")}</p>
                    </div>
                    <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-6">
                        <Button variant="outline" className="sm:flex-1 h-11 font-semibold" onClick={() => { setShowDisclaimer(false); onChat(profile.id); }}>
                            {tCommunity("disclaimer.chatAnyway")}
                        </Button>
                        <Button className="sm:flex-1 h-11 bg-green-600 hover:bg-green-700 font-bold shadow-lg" asChild>
                            <Link href="/profile/setup?role=mentor">{tCommunity("disclaimer.becomeMentor")}</Link>
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
