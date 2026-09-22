'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { Link } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { Heart, MapPin, Briefcase, ChevronRight, Award, Sparkles, Star, User } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { useFavorites } from '@/hooks/useFavorites'

/**
 * Shape produced by the `mentors_view` and consumed by `/mentors` and `/assistant`.
 * Kept local because the view's projection is page-specific — the canonical
 * DB-side type lives in `lib/types/models/mentor.ts` as `MentorProfile`.
 */
interface MentorCardMentor {
  id: string | null
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  job_title: string | null
  company: string | null
  city: string | null
  state: string | null
  country: string | null
  languages: string[] | null
  mentorship_topics: string[] | null
  inclusive_tags: string[] | null
  expertise_areas: string[] | null
  availability_status: string | null
  average_rating: number | null
  total_reviews: number | null
  total_sessions: number | null
  experience_years: number | null
  slug: string | null
  /** Legacy field — some callers may still provide photo_url instead of avatar_url */
  photo_url?: string | null
}

interface MentorCardProps {
  mentor: MentorCardMentor
  /** Highlights the card as an AI-recommended match */
  isAIHighlighted?: boolean
  /** Short AI-generated reason for the recommendation */
  aiReason?: string
}

/**
 * Card de exibição de mentor no catálogo público e no assistente de IA.
 * Usa os design tokens da marca (`primary`) e as chaves de tradução
 * `mentors.mentorCard.*`.
 */
export const MentorCard: React.FC<MentorCardProps> = ({
  mentor,
  isAIHighlighted = false,
  aiReason,
}) => {
  const t = useTranslations('mentors')
  const { user } = useAuth()
  const [imageError, setImageError] = useState(false)

  // Foto real do mentor — aceita avatar_url ou photo_url (retrocompatibilidade)
  const rawPhoto = mentor.avatar_url || mentor.photo_url

  useEffect(() => {
    setImageError(false)
  }, [rawPhoto])

  const hasPhoto = Boolean(rawPhoto) && !imageError

  // Iniciais do mentor para avatar fallback neutro
  const initials = mentor.full_name
    ? mentor.full_name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((n) => n[0]?.toUpperCase())
        .join('')
    : ''

  // Favoritos — requer userId para funcionar
  const { favorites, toggleFavorite } = useFavorites(user?.id)
  const isFavorite = mentor.id ? favorites.includes(mentor.id) : false

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (mentor.id) toggleFavorite(mentor.id)
  }

  const isAvailable = mentor.availability_status
    ? mentor.availability_status === 'available'
    : true

  // Combina expertise_areas + mentorship_topics como "skills" visíveis
  const skills: string[] = [
    ...(mentor.expertise_areas ?? []),
    ...(mentor.mentorship_topics ?? []),
  ].filter((v, i, a) => a.indexOf(v) === i) // deduplica

  // Localização formatada (cidade, estado)
  const locationParts = [mentor.city, mentor.state].filter(Boolean)
  const locationLabel = locationParts.length > 0
    ? locationParts.join(', ')
    : null

  return (
    <div
      className={`group relative flex flex-col h-full bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${
        isAIHighlighted
          ? 'border-primary/40 dark:border-primary-400/40 ring-1 ring-primary/20'
          : 'border-slate-200/80 dark:border-slate-800'
      }`}
    >

      {/* ================================================================
          1. RETRATO HERO: Imagem real do mentor ou fallback neutro com iniciais
          ================================================================ */}
      <div className="relative w-full aspect-[4/4.2] overflow-hidden bg-slate-100 dark:bg-slate-800">
        {hasPhoto ? (
          <Image
            src={rawPhoto!}
            alt={mentor.full_name || 'Mentor'}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover object-top group-hover:scale-105 transition-transform duration-500 ease-out"
            onError={() => setImageError(true)}
            priority={false}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-primary-50/20 to-slate-200 dark:from-slate-800 dark:via-slate-850 dark:to-slate-900 select-none">
            <div className="w-24 h-24 rounded-full bg-white dark:bg-slate-800 shadow-md border border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-primary-700 dark:text-primary-300">
              {initials ? (
                <span className="text-2xl font-bold tracking-wider">{initials}</span>
              ) : (
                <User className="w-10 h-10 text-primary-600/70" />
              )}
            </div>
          </div>
        )}

        {/* Badge de recomendação IA */}
        {isAIHighlighted && (
          <div className="absolute top-3 left-3 z-[2] inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-600/90 text-white backdrop-blur-md shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('mentorCard.aiRecommended')}</span>
          </div>
        )}

        {/* Badge de disponibilidade (abaixo do badge AI se ambos) */}
        {!isAIHighlighted && (
          <div className="absolute top-3 left-3">
            {isAvailable ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/90 text-white backdrop-blur-md shadow-sm">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                {t('mentorCard.available')}
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800/80 text-slate-200 backdrop-blur-md">
                {t('mentorCard.busy')}
              </span>
            )}
          </div>
        )}

        {/* Botão de Favorito */}
        <button
          type="button"
          onClick={handleFavoriteClick}
          aria-label={isFavorite ? t('mentorCard.removeFavorite') : t('mentorCard.addFavorite')}
          className={`absolute top-3 right-3 z-20 p-2 rounded-full backdrop-blur-md transition-all duration-200 ${isFavorite
              ? 'bg-rose-500 text-white shadow-md scale-110'
              : 'bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-200 hover:text-rose-500 hover:bg-white'
            }`}
        >
          <Heart
            className={`w-4 h-4 transition-transform duration-200 ${isFavorite ? 'fill-current' : ''}`}
          />
        </button>

        {/* Anos de experiência */}
        {mentor.experience_years != null && mentor.experience_years > 0 && (
          <div className="absolute bottom-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-900/80 text-white backdrop-blur-md shadow-sm">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>+{mentor.experience_years} {t('mentorCard.yearsExp')}</span>
          </div>
        )}

        {/* Rating (canto inferior direito da foto) */}
        {mentor.average_rating != null && mentor.average_rating > 0 && (
          <div className="absolute bottom-3 right-3 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-slate-900/80 text-white backdrop-blur-md shadow-sm">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>{mentor.average_rating.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* ================================================================
          2. CONTEÚDO
          ================================================================ */}
      <div className="flex flex-col flex-1 p-5">

        {/* Nome */}
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors line-clamp-1">
          {mentor.full_name}
        </h3>

        {/* Cargo */}
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400 line-clamp-1 mt-0.5 flex items-center gap-1.5">
          <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{mentor.job_title || t('mentorCard.mentor')}</span>
        </p>

        {/* Motivo da IA */}
        {aiReason && (
          <p className="text-xs text-primary-700 dark:text-primary-300 italic line-clamp-2 mt-3 leading-relaxed border-l-2 border-primary/40 pl-2.5 bg-primary-50/50 dark:bg-primary-950/20 py-1.5 rounded-r-md">
            <Sparkles className="w-3 h-3 inline-block mr-1 -mt-0.5" />
            {aiReason}
          </p>
        )}

        {/* Bio */}
        {!aiReason && mentor.bio && (
          <p className="text-xs text-slate-500 dark:text-slate-400 italic line-clamp-2 mt-3 leading-relaxed border-l-2 border-primary/30 pl-2.5">
            &ldquo;{mentor.bio}&rdquo;
          </p>
        )}

        {/* Skills / Áreas de Especialidade */}
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3.5">
            {skills.slice(0, 3).map((skill, idx) => (
              <span
                key={idx}
                className="inline-block px-2.5 py-0.5 text-[11px] font-medium rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60"
              >
                {skill}
              </span>
            ))}
            {skills.length > 3 && (
              <span className="inline-block px-2 py-0.5 text-[11px] font-medium rounded-md bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
                +{skills.length - 3}
              </span>
            )}
          </div>
        )}

        {/* ================================================================
            3. RODAPÉ: Localização & Link
            ================================================================ */}
        <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400">
          {locationLabel ? (
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{locationLabel}</span>
            </div>
          ) : (
            <span />
          )}

          <div className="inline-flex items-center gap-1 font-semibold text-primary-700 dark:text-primary-400 group-hover:translate-x-0.5 transition-transform">
            <span>{t('mentorCard.viewProfile')}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>

      </div>

      {/* Link overlay de cobertura */}
      <Link
        href={`/mentors/${mentor.slug || mentor.id}`}
        className="absolute inset-0 z-10"
        aria-label={`${t('mentorCard.viewProfile')} — ${mentor.full_name}`}
      >
        <span className="sr-only">{mentor.full_name}</span>
      </Link>
    </div>
  )
}

export default MentorCard