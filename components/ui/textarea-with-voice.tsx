'use client'

import { useRef } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { VoiceInput } from '@/components/ui/voice-input'

interface TextareaWithVoiceProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    className?: string
    minHeight?: string
}

const join = (a: string, b: string) => (a && b ? `${a.trimEnd()} ${b}` : a || b)

export function TextareaWithVoice({
    value,
    onChange,
    placeholder = "Digite sua resposta ou use o microfone...",
    className,
    minHeight = "min-h-[200px]"
}: TextareaWithVoiceProps) {
    const valueRef = useRef(value)
    valueRef.current = value

    // VoiceInput reports its whole accumulated transcript on every result. We
    // append it to the text that existed when dictation started (`base`) instead
    // of replacing the field, so pre-filled or typed text is never lost.
    // `consumed` is the transcript already merged before the person typed by hand.
    const voiceRef = useRef({ base: null as string | null, consumed: "", last: "" })

    const handleVoiceTranscript = (transcript: string) => {
        const voice = voiceRef.current

        if (!transcript) {
            if (voice.base !== null) onChange(voice.base)
            voiceRef.current = { base: null, consumed: "", last: "" }
            return
        }

        if (voice.base === null) voice.base = valueRef.current
        const fresh = transcript.startsWith(voice.consumed)
            ? transcript.slice(voice.consumed.length).trim()
            : transcript
        voice.last = transcript
        onChange(join(voice.base, fresh))
    }

    const handleManualChange = (next: string) => {
        const voice = voiceRef.current
        if (voice.base !== null) {
            voice.consumed = voice.last
            voice.base = null
        }
        onChange(next)
    }

    return (
        <div className="space-y-4">
            {/* Textarea sempre visível */}
            <Textarea
                placeholder={placeholder}
                value={value}
                onChange={(e) => handleManualChange(e.target.value)}
                className={`${minHeight} resize-none ${className ?? ""}`}
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
