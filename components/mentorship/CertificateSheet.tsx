import Image from "next/image"
import { Award, Calendar, Clock, Star } from "lucide-react"
import type { MentorCertificateData } from "@/lib/services/mentors/mentor-certificate.service"

/** Tamanho de uma folha A4 paisagem a 96 dpi: o certificado é desenhado sempre neste tamanho. */
export const SHEET_WIDTH_PX = 1123
export const SHEET_HEIGHT_PX = 794

/** "45 min" abaixo de uma hora; "1,5 h" a partir daí (vírgula decimal, não "0.8h"). */
export function formatVolunteerTime(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  return `${(minutes / 60).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} h`
}

/**
 * A folha do certificado (C-T3), com medidas fixas de A4 paisagem. Quem
 * escala para a tela e imprime é o VolunteerCertificate. A nota média só
 * aparece se existir: um documento verificável não pode exibir nota inventada.
 */
export function CertificateSheet({ data }: { data: MentorCertificateData }) {
  const hasRating = data.averageRating !== null && data.totalReviews > 0

  return (
    <div
      id="certificate-sheet"
      style={{ width: SHEET_WIDTH_PX, height: SHEET_HEIGHT_PX }}
      className="relative flex flex-col bg-white px-24 py-16 text-slate-900 select-none"
    >
      <div className="pointer-events-none absolute inset-4 rounded-lg border-[6px] border-primary/20" />
      <div className="pointer-events-none absolute inset-8 rounded border border-primary/40" />

      <div className="relative flex items-center justify-between">
        <div className="relative h-11 w-36">
          <Image src="/menvo-logo-light.png" alt="Menvo" fill className="object-contain object-left" priority />
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-primary">
          <Award className="h-4 w-4" />
          Certificado oficial
        </div>
      </div>

      <div className="relative my-auto text-center">
        <h1 className="font-serif text-[40px] font-extrabold uppercase leading-tight tracking-tight">
          Certificado de Atuação Voluntária
        </h1>
        <p className="mt-2 text-sm uppercase tracking-[0.25em] text-slate-500">
          Reconhecimento de contribuição social e mentoria
        </p>

        <p className="mx-auto mt-8 max-w-[760px] text-lg leading-relaxed text-slate-700">
          Certificamos que <strong className="text-slate-900">{data.mentorName}</strong>
          {data.mentorTitle ? `, ${data.mentorTitle}, ` : " "}
          dedicou seu tempo, conhecimento e experiência como mentor(a) voluntário(a) na plataforma Menvo,
          contribuindo para o desenvolvimento profissional de outras pessoas.
        </p>

        <div className="mx-auto mt-8 grid max-w-[600px] grid-cols-3 rounded-xl border border-slate-200 bg-slate-50 py-5">
          <Metric icon={<Clock className="h-5 w-5 text-primary" />} value={formatVolunteerTime(data.totalMinutes)} label="Tempo doado" />
          <Metric
            icon={<Calendar className="h-5 w-5 text-primary" />}
            value={String(data.totalSessions)}
            label={data.totalSessions === 1 ? "Sessão concluída" : "Sessões concluídas"}
            divided
          />
          <Metric
            icon={<Star className="h-5 w-5 fill-amber-400 text-amber-400" />}
            value={hasRating ? data.averageRating!.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : "—"}
            label={hasRating ? `Nota média (${data.totalReviews} ${data.totalReviews === 1 ? "avaliação" : "avaliações"})` : "Ainda sem avaliações"}
          />
        </div>
      </div>

      <div className="relative flex items-end justify-between border-t border-slate-200 pt-6 text-sm text-slate-500">
        <div>
          <p className="font-semibold text-slate-700">Período de atuação</p>
          <p>
            {data.memberSinceFormatted ? `De ${data.memberSinceFormatted}` : "Membro ativo"} a {data.issueDateFormatted}
          </p>
          <p className="mt-1.5 text-xs text-slate-400">
            Código de verificação <span className="font-mono text-slate-500">{data.verificationCode}</span> · {data.verificationUrl.replace(/^https?:\/\//, "")}
          </p>
        </div>
        <div className="text-right">
          <div className="mb-2 ml-auto w-48 border-b border-slate-400" />
          <p className="font-bold text-slate-800">Menvo</p>
          <p className="text-xs text-slate-500">Mentoria voluntária e gratuita</p>
        </div>
      </div>
    </div>
  )
}

function Metric({ icon, value, label, divided }: { icon: React.ReactNode; value: string; label: string; divided?: boolean }) {
  return (
    <div className={`flex flex-col items-center gap-1 ${divided ? "border-x border-slate-200" : ""}`}>
      {icon}
      <span className="text-2xl font-bold text-slate-900">{value}</span>
      <span className="text-xs font-medium text-slate-500">{label}</span>
    </div>
  )
}
