"use client"

import { UserCog, Share2, MessagesSquare } from "lucide-react"
import { TutorialCardsSection } from "@/components/shared/TutorialCardsSection"

const TUTORIALS = [
  { key: "profile", icon: UserCog },
  { key: "sharing", icon: Share2 },
  { key: "firstSession", icon: MessagesSquare }
]

/** Guidance cards shown to mentors (and pending mentors) in the "Mentoria" tab. */
export function TutorialsSection() {
  return <TutorialCardsSection namespace="tutorials" items={TUTORIALS} />
}
