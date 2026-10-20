"use client"

import { Eye, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/routing"

interface ProfileHeaderProps {
  slug: string | null
  isMentor: boolean
}

/** Title of the profile page plus the "public profile" and "settings" shortcuts. */
export function ProfileHeader({ slug, isMentor }: ProfileHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold">Meu Perfil</h1>
        <p className="text-muted-foreground">Complete seu perfil para ser encontrado e ajudar/receber ajuda.</p>
      </div>
      <div className="flex gap-2">
        {slug && (
          <Button variant="outline" asChild size="sm">
            <Link href={isMentor ? `/mentors/${slug}` : `/mentee/${slug}`}>
              <Eye className="h-4 w-4 mr-2" /> Ver perfil público
            </Link>
          </Button>
        )}
        <Button variant="outline" asChild size="sm">
          <Link href="/settings">
            <Settings className="h-4 w-4 mr-2" /> Configurações
          </Link>
        </Button>
      </div>
    </div>
  )
}
