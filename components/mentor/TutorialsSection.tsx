"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog"
import { UserCog, Share2, MessagesSquare, PlayCircle, Clock } from "lucide-react"
import { useTranslations } from "next-intl"

// Links reais do YouTube entram aqui assim que os vídeos forem gravados.
// Enquanto `youtubeId` for null, o card abre o modal de simulação em vez do player.
const TUTORIALS = [
  { key: "profile", icon: UserCog, youtubeId: null as string | null },
  { key: "sharing", icon: Share2, youtubeId: null as string | null },
  { key: "firstSession", icon: MessagesSquare, youtubeId: null as string | null }
]

export function TutorialsSection() {
  const t = useTranslations("tutorials")
  const [openKey, setOpenKey] = useState<string | null>(null)
  const active = TUTORIALS.find((item) => item.key === openKey)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("title")}</CardTitle>
        <CardDescription>{t("subtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {TUTORIALS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setOpenKey(item.key)}
            className="text-left rounded-xl border border-border/80 bg-card hover:border-primary/40 hover:bg-accent/30 transition-colors p-4 flex flex-col gap-3 cursor-pointer"
          >
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <item.icon className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-sm">{t(`items.${item.key}.title`)}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t(`items.${item.key}.description`)}
              </p>
            </div>
            <span className="text-xs font-semibold text-primary flex items-center gap-1.5 mt-auto">
              <PlayCircle className="h-3.5 w-3.5" /> {t("watchButton")}
            </span>
          </button>
        ))}
      </CardContent>

      <Dialog open={!!active} onOpenChange={(open) => !open && setOpenKey(null)}>
        <DialogContent className="max-w-lg">
          {active && (
            <>
              <DialogHeader>
                <DialogTitle>{t(`items.${active.key}.title`)}</DialogTitle>
                <DialogDescription>{t(`items.${active.key}.description`)}</DialogDescription>
              </DialogHeader>
              <div className="aspect-video rounded-xl bg-muted flex flex-col items-center justify-center gap-2 border border-border/60">
                <Clock className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">{t("comingSoon")}</p>
              </div>
              <Button onClick={() => setOpenKey(null)} className="w-full">
                {t("closeButton")}
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}
