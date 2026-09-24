"use client"

import React from "react"
import { Progress } from "@/components/ui/progress"

import { Loader2 } from "lucide-react"

export interface DiagnosticProgressBarProps {
  currentStep: number
  totalSteps: number
  stepName?: string
  isProcessing?: boolean
}

/**
 * Visual progress indicator for conversational diagnostic flow.
 */
export function DiagnosticProgressBar({
  currentStep,
  totalSteps,
  stepName,
  isProcessing
}: DiagnosticProgressBarProps) {
  const percentage = Math.min(Math.round((currentStep / totalSteps) * 100), 100)

  return (
    <div className="w-full bg-background/80 backdrop-blur-sm border-b border-border/60 py-2.5 px-4 sticky top-0 z-10 transition-all">
      <div className="max-w-3xl mx-auto flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-semibold text-foreground flex items-center gap-1.5">
            Etapa {currentStep} de {totalSteps}
            {stepName ? `: ${stepName}` : ""}
            {isProcessing && (
              <Loader2 className="w-3 h-3 animate-spin text-primary ml-1" />
            )}
          </span>
          <span className="font-medium text-primary">{percentage}% concluído</span>
        </div>
        <Progress value={percentage} className={`h-1.5 rounded-full ${isProcessing ? "opacity-90 animate-pulse" : ""}`} />
      </div>
    </div>
  )
}
