"use client"

import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Github, Linkedin, Globe } from 'lucide-react'
import Link from "next/link"
import { useContributors } from "@/hooks/useContributors"
import { Skeleton } from "@/components/ui/skeleton"
import { useTranslation } from "react-i18next"

interface Contributor {
  id: number
  login: string
  avatar_url: string
  html_url: string
  contributions: number
  name?: string
  linkedin_url?: string
  website_url?: string
}

export function Contributors() {
  const { t } = useTranslation()
  const { data: contributors, isLoading, error } = useContributors()

  if (isLoading) {
    return (
      <section className="text-center mb-16">
        <h2 className="text-3xl font-bold mb-8">{t('about.contributors.title')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="flex flex-col items-center p-6">
              <Skeleton className="h-24 w-24 rounded-full mb-4" />
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex gap-2 mt-4">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            </Card>
          ))}
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="text-center mb-16">
        <h2 className="text-3xl font-bold mb-8">{t('about.contributors.title')}</h2>
        <p className="text-red-500">{t('about.contributors.error')}</p>
      </section>
    )
  }

  return (
    <section className="text-center mb-16">
      <h2 className="text-3xl font-bold mb-8">{t('about.contributors.title')}</h2>
      <p className="text-muted-foreground max-w-2xl mx-auto mb-12">
        {t('about.contributors.description')}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {contributors?.map((contributor) => (
          <Card key={contributor.id} className="flex flex-col items-center p-6">
            <Avatar className="h-24 w-24 mb-4 border-2 border-primary/20">
              <AvatarImage src={contributor.avatar_url || "/placeholder.svg"} alt={contributor.login} />
              <AvatarFallback>{contributor.login.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <h3 className="text-lg font-semibold mb-1">{contributor.name || contributor.login}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {contributor.contributions} {t('about.contributors.contributions')}
            </p>
            <div className="flex gap-3">
              {contributor.html_url && (
                <Link href={contributor.html_url} target="_blank" rel="noopener noreferrer" aria-label={`GitHub de ${contributor.login}`}>
                  <Github className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                </Link>
              )}
              {contributor.linkedin_url && (
                <Link href={contributor.linkedin_url} target="_blank" rel="noopener noreferrer" aria-label={`LinkedIn de ${contributor.login}`}>
                  <Linkedin className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                </Link>
              )}
              {contributor.website_url && (
                <Link href={contributor.website_url} target="_blank" rel="noopener noreferrer" aria-label={`Website de ${contributor.login}`}>
                  <Globe className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                </Link>
              )}
            </div>
          </Card>
        ))}
      </div>
    </section>
  )
}
