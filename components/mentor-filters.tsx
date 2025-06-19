"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import type { MentorFilters } from "@/types/mentors"

interface MentorFiltersProps {
  filters: MentorFilters
  onFiltersChange: (filters: Partial<MentorFilters>) => void
  onClearFilters: () => void
}

const topics = ["Career", "Academia", "Tech", "Business", "Leadership", "Personal Development"]
const languages = ["English", "Spanish", "Portuguese", "French", "German", "Mandarin"]
const locations = ["United States", "Canada", "United Kingdom", "Germany", "Brazil", "Remote"]
const experienceLevels = ["Junior", "Mid-level", "Senior"]
const inclusionTags = ["Women", "LGBTQIA+", "50+", "Neurodivergent", "Black", "Indigenous", "People of Color"]

export default function MentorFilters({ filters, onFiltersChange, onClearFilters }: MentorFiltersProps) {
  const [expanded, setExpanded] = useState<string[]>(["topics", "languages", "inclusion"])

  const handleTopicChange = (topic: string, checked: boolean) => {
    const newTopics = checked ? [...filters.topics, topic] : filters.topics.filter((t) => t !== topic)
    onFiltersChange({ topics: newTopics })
  }

  const handleLanguageChange = (language: string, checked: boolean) => {
    const newLanguages = checked ? [...filters.languages, language] : filters.languages.filter((l) => l !== language)
    onFiltersChange({ languages: newLanguages })
  }

  const handleLocationChange = (location: string, checked: boolean) => {
    const newLocations = checked ? [...filters.locations, location] : filters.locations.filter((l) => l !== location)
    onFiltersChange({ locations: newLocations })
  }

  const handleExperienceChange = (level: string, checked: boolean) => {
    const newLevels = checked
      ? [...filters.experience_levels, level]
      : filters.experience_levels.filter((l) => l !== level)
    onFiltersChange({ experience_levels: newLevels })
  }

  const handleInclusionTagChange = (tag: string, checked: boolean) => {
    const newTags = checked ? [...filters.inclusion_tags, tag] : filters.inclusion_tags.filter((t) => t !== tag)
    onFiltersChange({ inclusion_tags: newTags })
  }

  return (
    <Card className="sticky top-20">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Filters</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            Reset
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Accordion type="multiple" value={expanded} onValueChange={setExpanded} className="space-y-2">
          <AccordionItem value="topics" className="border-none">
            <AccordionTrigger className="py-2 hover:no-underline">
              <span className="text-sm font-medium">Topics</span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pt-1">
                {topics.map((topic) => (
                  <div key={topic} className="flex items-center space-x-2">
                    <Checkbox
                      id={`topic-${topic}`}
                      checked={filters.topics.includes(topic)}
                      onCheckedChange={(checked) => handleTopicChange(topic, checked as boolean)}
                    />
                    <Label htmlFor={`topic-${topic}`} className="text-sm font-normal cursor-pointer">
                      {topic}
                    </Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="location" className="border-none">
            <AccordionTrigger className="py-2 hover:no-underline">
              <span className="text-sm font-medium">Location</span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pt-1">
                {locations.map((location) => (
                  <div key={location} className="flex items-center space-x-2">
                    <Checkbox
                      id={`location-${location}`}
                      checked={filters.locations.includes(location)}
                      onCheckedChange={(checked) => handleLocationChange(location, checked as boolean)}
                    />
                    <Label htmlFor={`location-${location}`} className="text-sm font-normal cursor-pointer">
                      {location}
                    </Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="languages" className="border-none">
            <AccordionTrigger className="py-2 hover:no-underline">
              <span className="text-sm font-medium">Languages</span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pt-1">
                {languages.map((language) => (
                  <div key={language} className="flex items-center space-x-2">
                    <Checkbox
                      id={`lang-${language}`}
                      checked={filters.languages.includes(language)}
                      onCheckedChange={(checked) => handleLanguageChange(language, checked as boolean)}
                    />
                    <Label htmlFor={`lang-${language}`} className="text-sm font-normal cursor-pointer">
                      {language}
                    </Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="experience" className="border-none">
            <AccordionTrigger className="py-2 hover:no-underline">
              <span className="text-sm font-medium">Experience Level</span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pt-1">
                {experienceLevels.map((level) => (
                  <div key={level} className="flex items-center space-x-2">
                    <Checkbox
                      id={`exp-${level}`}
                      checked={filters.experience_levels.includes(level)}
                      onCheckedChange={(checked) => handleExperienceChange(level, checked as boolean)}
                    />
                    <Label htmlFor={`exp-${level}`} className="text-sm font-normal cursor-pointer">
                      {level}
                    </Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="inclusion" className="border-none">
            <AccordionTrigger className="py-2 hover:no-underline">
              <span className="text-sm font-medium">Inclusion Tags</span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pt-1">
                {inclusionTags.map((tag) => (
                  <div key={tag} className="flex items-center space-x-2">
                    <Checkbox
                      id={`tag-${tag}`}
                      checked={filters.inclusion_tags.includes(tag)}
                      onCheckedChange={(checked) => handleInclusionTagChange(tag, checked as boolean)}
                    />
                    <Label htmlFor={`tag-${tag}`} className="text-sm font-normal cursor-pointer">
                      {tag}
                    </Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="rating" className="border-none">
            <AccordionTrigger className="py-2 hover:no-underline">
              <span className="text-sm font-medium">Minimum Rating</span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pt-1">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{filters.rating_min} stars</span>
                  <span>5 stars</span>
                </div>
                <Slider
                  value={[filters.rating_min]}
                  onValueChange={(value) => onFiltersChange({ rating_min: value[0] })}
                  max={5}
                  step={0.5}
                  className="w-full"
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="availability" className="border-none">
            <AccordionTrigger className="py-2 hover:no-underline">
              <span className="text-sm font-medium">Availability</span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pt-1">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="available-only"
                    checked={filters.availability}
                    onCheckedChange={(checked) => onFiltersChange({ availability: checked })}
                  />
                  <Label htmlFor="available-only" className="text-sm font-normal">
                    Available for new sessions
                  </Label>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Separator />

        <Button className="w-full">Apply Filters</Button>
      </CardContent>
    </Card>
  )
}
