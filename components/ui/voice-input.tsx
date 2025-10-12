"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Mic, Square, RotateCcw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface VoiceInputProps {
  onTranscript: (text: string) => void
  placeholder?: string
  className?: string
}

export function VoiceInput({ onTranscript, className }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [transcript, setTranscript] = useState("")
  const recognitionRef = useRef<any>(null)
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Verificar se o browser suporta Web Speech API
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        setIsSupported(true)
        recognitionRef.current = new SpeechRecognition()

        // Configurar o reconhecimento
        recognitionRef.current.continuous = true
        recognitionRef.current.interimResults = true
        recognitionRef.current.lang = "pt-BR"

        // Eventos do reconhecimento
        recognitionRef.current.onresult = (event: any) => {
          let finalTranscript = ""
          let interimTranscript = ""

          // Limpar timer de silêncio quando há fala
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current)
            silenceTimerRef.current = null
          }

          // Processar todos os resultados
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcriptText = event.results[i][0].transcript
            if (event.results[i].isFinal) {
              finalTranscript += transcriptText
            } else {
              interimTranscript += transcriptText
            }
          }

          // Combinar com transcript anterior + novos resultados
          let fullTranscript = transcript
          if (finalTranscript) {
            fullTranscript = transcript + (transcript ? ' ' : '') + finalTranscript
            setTranscript(fullTranscript)
          }

          // Mostrar resultado em tempo real (incluindo interim)
          const displayTranscript = fullTranscript + (interimTranscript ? (fullTranscript ? ' ' : '') + interimTranscript : '')
          onTranscript(displayTranscript)

          // Iniciar timer para parar após 3 segundos de silêncio
          if (finalTranscript || interimTranscript) {
            silenceTimerRef.current = setTimeout(() => {
              if (recognitionRef.current && isListening) {
                recognitionRef.current.stop()
              }
            }, 3000)
          }
        }

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error)
          setIsListening(false)

          let errorMessage = "Erro no reconhecimento de voz"
          switch (event.error) {
            case "no-speech":
              errorMessage = "Nenhuma fala detectada. Tente novamente."
              break
            case "audio-capture":
              errorMessage = "Microfone não encontrado ou sem permissão."
              break
            case "not-allowed":
              errorMessage = "Permissão para usar o microfone foi negada."
              break
            case "network":
              errorMessage = "Erro de rede. Verifique sua conexão."
              break
          }

          toast({
            title: "Erro na transcrição",
            description: errorMessage,
            variant: "destructive"
          })
        }

        recognitionRef.current.onend = () => {
          setIsListening(false)
        }
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current)
      }
    }
  }, [onTranscript, toast])

  const startListening = () => {
    if (!recognitionRef.current) return

    try {
      // Limpar timer anterior se existir
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current)
        silenceTimerRef.current = null
      }
      recognitionRef.current.start()
      setIsListening(true)
      toast({
        title: "Transcrição iniciada",
        description: "Fale agora. Parará automaticamente após 3s de silêncio."
      })
    } catch (error) {
      console.error("Error starting recognition:", error)
      toast({
        title: "Erro",
        description: "Não foi possível iniciar a transcrição.",
        variant: "destructive"
      })
    }
  }

  const stopListening = () => {
    if (!recognitionRef.current) return

    // Limpar timer de silêncio
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }

    recognitionRef.current.stop()
    setIsListening(false)
    toast({
      title: "Transcrição finalizada",
      description: "Sua fala foi transcrita com sucesso."
    })
  }

  const clearTranscript = () => {
    setTranscript("")
    onTranscript("")
    toast({
      title: "Transcrição limpa",
      description: "Você pode começar a transcrever novamente."
    })
  }

  if (!isSupported) {
    return (
      <div
        className={`p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}
      >
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
          🎤 Reconhecimento de voz não suportado neste navegador
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500 text-center mt-1">
          Recomendamos usar Chrome, Edge ou Safari
        </p>
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        {isListening && (
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Escutando...</span>
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          {transcript && !isListening && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearTranscript}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-700"
            >
              <RotateCcw className="h-4 w-4" />
              Limpar
            </Button>
          )}
          <Button
            type="button"
            variant={isListening ? "destructive" : "outline"}
            size="sm"
            onClick={isListening ? stopListening : startListening}
            className="flex items-center gap-2"
          >
            {isListening ? (
              <>
                <Square className="h-4 w-4" />
                Parar
              </>
            ) : (
              <>
                <Mic className="h-4 w-4" />
                Falar
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
