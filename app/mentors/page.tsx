"use client"

import { useState, useMemo, useRef, useCallback, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Filter, Search, User, Briefcase, MapPin, Calendar, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useMentors, useFilterOptions } from "@/hooks/useMentors"
import { LoginRequiredModal } from "@/components/auth/LoginRequiredModal"
import { useAuth } from "@/hooks/useAuth"
import { useTranslation } from "react-i18next"
import type { MentorFilters, MentorProfile } from "@/services/mentors/mentors"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { WarningBanner } from "@/components/WarningBanner"
import MentorFilters from '@/components/mentor-filters'
import MentorCard from '@/components/mentor-card'
import mockMentors from '@/data/mock-mentors'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

interface FilterState extends Omit<MentorFilters, 'page' | 'limit'> {
  page: number
  limit: number
  inclusionTags: string[]
  experienceYears: number[]
  state_province?: string
  sortBy: string 
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}

export default function MentorsPage() {
  return (
    <ProtectedRoute requiredRoles={['mentee', 'mentor', 'admin']}>
      <div className="container mx-auto px-4 py-8 md:py-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-50 mb-8 text-center">Encontre seu Mentor</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <MentorFilters />
          </div>
          <div className="lg:col-span-2">
            <div className="grid gap-6 md:grid-cols-2">
              {mockMentors.map((mentor) => (
                <MentorCard key={mentor.id} mentor={mentor} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
