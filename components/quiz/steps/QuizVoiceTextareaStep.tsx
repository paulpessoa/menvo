'use client'

import { TextareaWithVoice } from '@/components/ui/textarea-with-voice'

interface QuizVoiceTextareaStepProps {
  value?: string
  onChange: (value: string) => void
  placeholder: string
  minCharsLabel: string
  charsLabel: string
}

export function QuizVoiceTextareaStep({
  value = '',
  onChange,
  placeholder,
  minCharsLabel,
  charsLabel,
}: QuizVoiceTextareaStepProps) {
  return (
    <div className="space-y-4">
      <TextareaWithVoice
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="rounded-2xl bg-card p-4 text-base leading-relaxed"
      />
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {minCharsLabel} • {value.length} {charsLabel}
      </p>
    </div>
  )
}
