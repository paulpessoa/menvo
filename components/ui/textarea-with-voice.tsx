'use client'

import { Textarea } from '@/components/ui/textarea'
import { VoiceInput } from '@/components/ui/voice-input'

interface TextareaWithVoiceProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    className?: string
    minHeight?: string
}

export function TextareaWithVoice({
    value,
    onChange,
    placeholder = "Digite sua resposta ou use o microfone...",
    className,
    minHeight = "min-h-[200px]"
}: TextareaWithVoiceProps) {

    const handleVoiceTranscript = (transcript: string) => {
        // Simplesmente usar o transcript como está (já acumulado no VoiceInput)
        onChange(transcript)
    }

    return (
        <div className="space-y-4">
            {/* Textarea sempre visível */}
            <Textarea
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`${minHeight} resize-none ${className}`}
            />

            {/* Voice input sempre disponível */}
            <div className="border-t pt-4">
                <VoiceInput
                    onTranscript={handleVoiceTranscript}
                />
            </div>
        </div>
    )
}