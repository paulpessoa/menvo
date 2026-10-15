import { Metadata } from "next"
import { notFound } from "next/navigation"
import { Link } from "@/i18n/routing"
import { PageContainer } from "@/components/layout/PageContainer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Award, ArrowLeft, ShieldAlert } from "lucide-react"
import { VolunteerCertificate } from "@/components/mentorship/VolunteerCertificate"
import { mentorCertificateService } from "@/lib/services/mentors/mentor-certificate.service"

interface PageProps {
  params: Promise<{
    locale: string
    id: string
  }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id, locale } = await params
  const certificate = await mentorCertificateService.getCertificate(id, undefined, locale)

  if (!certificate) {
    return {
      title: "Certificado não encontrado | Menvo",
      robots: { index: false, follow: false }
    }
  }

  const title = `Certificado de Voluntariado · ${certificate.mentorName} | Menvo`
  const description = `Certificado oficial de atuação voluntária de ${certificate.mentorName} na Menvo. Comprovação de ${certificate.totalHours} horas dedicadas em ${certificate.totalSessions} sessões de mentoria gratuita.`

  return {
    title,
    description,
    openGraph: {
      type: "website",
      title,
      description,
      images: [{ url: "https://www.menvo.com.br/images/menvopeople.jpg", width: 1200, height: 630, alt: title }]
    }
  }
}

export default async function CertificatePage({ params }: PageProps) {
  const { id, locale } = await params
  const certificate = await mentorCertificateService.getCertificate(id, undefined, locale)

  if (!certificate) {
    return (
      <PageContainer size="3xl" className="py-20 flex flex-col items-center text-center">
        <Card className="w-full max-w-md border-border/60">
          <CardContent className="pt-8 pb-8 flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Certificado não encontrado</h1>
            <p className="text-sm text-muted-foreground">
              O certificado solicitado não foi encontrado ou o mentor ainda não possui sessões voluntárias concluídas para emissão.
            </p>
            <Button variant="outline" asChild className="rounded-xl mt-2 gap-2">
              <Link href="/mentors">
                <ArrowLeft className="w-4 h-4" />
                Explorar mentores
              </Link>
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    )
  }

  return (
    <PageContainer size="4xl" className="py-8">
      <div className="print:hidden mb-4">
        <Button variant="ghost" size="sm" asChild className="gap-2 text-muted-foreground hover:text-foreground">
          <Link href={`/mentors/${certificate.slug || certificate.mentorId}`}>
            <ArrowLeft className="w-4 h-4" />
            Ver perfil do mentor
          </Link>
        </Button>
      </div>

      <VolunteerCertificate data={certificate} />
    </PageContainer>
  )
}
