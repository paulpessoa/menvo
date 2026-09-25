"use client"

import { Search, CalendarCheck, Lightbulb } from "lucide-react"
import { TutorialCardsSection } from "@/components/shared/TutorialCardsSection"

const TUTORIALS = [
  { key: "findMentor", icon: Search },
  { key: "requestSession", icon: CalendarCheck },
  { key: "makeTheMost", icon: Lightbulb }
]

/** Guidance cards shown to mentees in the "Mentoria" tab, before/instead of the mentor tutorials. */
export function MenteeTutorialsSection() {
  return <TutorialCardsSection namespace="menteeTutorials" items={TUTORIALS} />
}
