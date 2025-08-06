'use client'

import { useState, useEffect, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Loader2Icon, SearchIcon, FilterIcon, RefreshCcwIcon } from 'lucide-react'
import { MentorCard } from '@/components/mentor-card'
import { MentorFilters } from '@/components/mentor-filters'
import { useMentors } from '@/hooks/useMentors'
import { toast } from '@/components/ui/use-toast'
import { mockMentors } from '@/data/mock-mentors' // Using mock data for now
import { useTranslation } from 'react-i18next'

export default function MentorsPage() {
  const { t } = useTranslation()
  const [mentors, setMentors] = useState<typeof mockMentors>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSkills, setFilterSkills] = useState<string[]>([])
  const [filterLanguage, setFilterLanguage] = useState('all')
  const [filterExperience, setFilterExperience] = useState<[number, number]>([0, 20]) // [min, max]

  useEffect(() => {
    const loadMentors = async () => {
      setLoading(true)
      try {
        // In a real app, you'd fetch from an API:
        // const { data, error } = await fetchMentors();
        // if (error) throw error;
        // setMentors(data);
        await new Promise(resolve => setTimeout(resolve, 500)) // Simulate API call
        setMentors(mockMentors) // Use mock data
      } catch (error: any) {
        toast({
          title: t('mentors.fetchErrorTitle'),
          description: error.message || t('mentors.fetchErrorDescription'),
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }
    loadMentors()
  }, [t])

  const allSkills = useMemo(() => {
    const skillsSet = new Set<string>()
    mentors.forEach(mentor => {
      mentor.skills?.forEach(skill => skillsSet.add(skill.skill_name))
    })
    return Array.from(skillsSet).sort()
  }, [mentors])

  const allLanguages = useMemo(() => {
    const languagesSet = new Set<string>()
    mentors.forEach(mentor => {
      mentor.user_profiles?.languages?.forEach(lang => languagesSet.add(lang))
    })
    return ['all', ...Array.from(languagesSet).sort()]
  }, [mentors])

  const filteredMentors = useMemo(() => {
    let filtered = mentors

    if (searchTerm) {
      filtered = filtered.filter(
        (mentor) =>
          mentor.user_profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          mentor.user_profiles?.occupation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          mentor.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          mentor.skills?.some(skill => skill.skill_name.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    if (filterSkills.length > 0) {
      filtered = filtered.filter(mentor =>
        mentor.skills?.some(skill => filterSkills.includes(skill.skill_name))
      )
    }

    if (filterLanguage !== 'all') {
      filtered = filtered.filter(mentor =>
        mentor.user_profiles?.languages?.includes(filterLanguage)
      )
    }

    filtered = filtered.filter(mentor => {
      const years = mentor.user_profiles?.years_experience || 0
      return years >= filterExperience[0] && years <= filterExperience[1]
    })

    return filtered
  }, [mentors, searchTerm, filterSkills, filterLanguage, filterExperience])

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-50 mb-8 text-center">
        {t('mentors.title')}
      </h1>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('mentors.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <MentorFilters
          allSkills={allSkills}
          selectedSkills={filterSkills}
          onSelectSkills={setFilterSkills}
          allLanguages={allLanguages}
          selectedLanguage={filterLanguage}
          onSelectLanguage={setFilterLanguage}
          experienceRange={filterExperience}
          onExperienceChange={setFilterExperience}
        />
        <Button onClick={() => {
          setSearchTerm('')
          setFilterSkills([])
          setFilterLanguage('all')
          setFilterExperience([0, 20])
          // Optionally reload mentors from source if needed
          // loadMentors();
        }} variant="outline">
          <RefreshCcwIcon className="h-4 w-4 mr-2" /> {t('mentors.resetFilters')}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2Icon className="h-8 w-8 animate-spin" />
          <span className="ml-2">{t('mentors.loadingMentors')}</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMentors.length === 0 ? (
            <p className="col-span-full text-center text-muted-foreground">
              {t('mentors.noMentorsFound')}
            </p>
          ) : (
            filteredMentors.map((mentor) => (
              <MentorCard key={mentor.id} mentor={mentor} />
            ))
          )}
        </div>
      )}
    </div>
  )
}
