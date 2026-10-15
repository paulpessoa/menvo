"use client"

import React from "react"
import Image from "next/image"
import { Printer, Copy, Check, Award, ShieldCheck, Calendar, Clock, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import type { MentorCertificateData } from "@/lib/services/mentors/mentor-certificate.service"

interface VolunteerCertificateProps {
  data: MentorCertificateData
}

/**
 * Componente de Certificado de Atuação Voluntária (C-T3).
 * Exibido na página pública de verificação e preparado para impressão / PDF (A4 Landscape).
 */
export function VolunteerCertificate({ data }: VolunteerCertificateProps) {
  const [copied, setCopied] = React.useState(false)

  const handleCopyLink = () => {
    navigator.clipboard.writeText(data.verificationUrl)
    setCopied(true)
    toast.success("Link de verificação copiado para a área de transferência!")
    setTimeout(() => setCopied(false), 2500)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-4xl mx-auto my-8">
      {/* Barra de ações - oculta durante a impressão */}
      <div className="print:hidden flex flex-wrap items-center justify-between w-full bg-muted/40 p-4 rounded-xl border border-border gap-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <span className="text-sm font-medium text-foreground">
            Certificado Verificado: <strong>{data.verificationCode}</strong>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleCopyLink} className="rounded-xl gap-2">
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copiado!" : "Copiar link"}
          </Button>
          <Button size="sm" onClick={handlePrint} className="rounded-xl gap-2 bg-primary text-white">
            <Printer className="w-4 h-4" />
            Imprimir / Salvar PDF
          </Button>
        </div>
      </div>

      {/* Folha do Certificado - Formato A4 Paisagem */}
      <div className="relative w-full aspect-[1.414/1] bg-white text-slate-900 p-8 sm:p-12 md:p-16 border-8 border-primary/20 rounded-2xl shadow-xl flex flex-col justify-between print:border-8 print:shadow-none print:m-0 print:rounded-none print:w-full print:h-screen select-none overflow-hidden">
        {/* Moldura interna decorativa */}
        <div className="absolute inset-3 border-2 border-primary/30 rounded-lg pointer-events-none" />

        {/* Cabeçalho */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="relative w-32 h-10">
              <Image src="/menvo-logo-light.png" alt="Menvo" fill className="object-contain" priority />
            </div>
          </div>
          <div className="text-right">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-wider">
              <Award className="w-4 h-4" />
              Certificado Oficial
            </div>
          </div>
        </div>

        {/* Título Principal */}
        <div className="text-center my-auto py-4 relative z-10">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 font-serif">
            CERTIFICADO DE ATUAÇÃO VOLUNTÁRIA
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-500 uppercase tracking-[0.2em]">
            Reconhecimento de Contribuição Social e Mentoria
          </p>

          <p className="mt-6 text-sm sm:text-base md:text-lg text-slate-700 max-w-2xl mx-auto leading-relaxed">
            Certificamos com honra que <strong>{data.mentorName}</strong>
            {data.mentorTitle ? `, atuando como ${data.mentorTitle}, ` : " "}
            dedicou seu tempo, conhecimento e experiência como mentor(a) voluntário(a) na plataforma Menvo,
            promovendo o desenvolvimento profissional e a aceleração de carreiras.
          </p>

          {/* Destaque de métricas */}
          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mt-6 py-4 px-6 bg-slate-50 border border-slate-200/80 rounded-xl">
            <div className="flex flex-col items-center">
              <Clock className="w-4 h-4 text-primary mb-1" />
              <span className="text-lg sm:text-xl font-bold text-slate-900">{data.totalHours}h</span>
              <span className="text-[11px] text-slate-500 font-medium">Horas Doadas</span>
            </div>
            <div className="flex flex-col items-center border-x border-slate-200">
              <Calendar className="w-4 h-4 text-primary mb-1" />
              <span className="text-lg sm:text-xl font-bold text-slate-900">{data.totalSessions}</span>
              <span className="text-[11px] text-slate-500 font-medium">Sessões Concluídas</span>
            </div>
            <div className="flex flex-col items-center">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500 mb-1" />
              <span className="text-lg sm:text-xl font-bold text-slate-900">
                {data.averageRating ? `${data.averageRating.toFixed(1)} ★` : "5.0 ★"}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">Nota Média</span>
            </div>
          </div>
        </div>

        {/* Rodapé / Assinaturas & Validação */}
        <div className="pt-6 border-t border-slate-200 relative z-10 flex flex-wrap items-end justify-between text-xs text-slate-500 gap-4">
          <div>
            <p className="font-semibold text-slate-700">Período de Atuação:</p>
            <p>
              {data.memberSinceFormatted ? `Desde ${data.memberSinceFormatted}` : "Membro ativo"} até {data.issueDateFormatted}
            </p>
            <p className="mt-1 text-[10px] text-slate-400">
              Autenticidade: <span className="font-mono">{data.verificationCode}</span>
            </p>
          </div>

          <div className="text-right">
            <div className="w-40 border-b border-slate-400 mb-1.5 ml-auto" />
            <p className="font-bold text-slate-800">Menvo Plataforma</p>
            <p className="text-[11px] text-slate-500">Conexões que Transformam</p>
          </div>
        </div>
      </div>
    </div>
  )
}
