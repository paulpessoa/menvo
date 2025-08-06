"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { XCircle, Filter } from 'lucide-react'

interface MentorFiltersProps {
  filters: {
    topics: string[]
    languages: string[]
    experienceYears: number[]
    educationLevels: string[]
    rating?: number
    city: string
    country: string
    state_province: string
    inclusionTags: string[]
  }
  onFiltersChange: (newFilters: Partial<MentorFiltersProps['filters']>) => void
  onClearFilters: () => void
}

export default function MentorFilters({ filters, onFiltersChange, onClearFilters }: MentorFiltersProps) {
  const handleCheckboxChange = (filterType: keyof MentorFiltersProps['filters'], value: string | number) => {
    const currentValues = filters[filterType] as (string | number)[]
    const newValues = currentValues.includes(value)
      ? currentValues.filter((item) => item !== value)
      : [...currentValues, value]
    onFiltersChange({ [filterType]: newValues })
  }

  const handleSliderChange = (value: number[]) => {
    onFiltersChange({ rating: value[0] })
  }

  const activeFiltersCount = [
    filters.topics.length,
    filters.languages.length,
    filters.experienceYears.length,
    filters.educationLevels.length,
    filters.rating !== undefined ? 1 : 0,
    filters.city ? 1 : 0,
    filters.country ? 1 : 0,
    filters.state_province ? 1 : 0,
    filters.inclusionTags.length,
  ].reduce((sum, count) => sum + count, 0)

  return (
    <Card className="p-6 sticky top-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">Filtros de Mentores</CardTitle>
        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            <XCircle className="h-4 w-4 mr-2" />
            Limpar ({activeFiltersCount})
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Topics Filter */}
        <div>
          <Label className="mb-2 block font-medium">Tópicos / Habilidades</Label>
          <div className="space-y-2">
            {["Desenvolvimento Web", "Carreira", "Liderança", "Design UX/UI", "Marketing Digital", "Data Science"].map((topic) => (
              <div key={topic} className="flex items-center space-x-2">
                <Checkbox
                  id={`topic-${topic}`}
                  checked={filters.topics.includes(topic)}
                  onCheckedChange={() => handleCheckboxChange("topics", topic)}
                />
                <Label htmlFor={`topic-${topic}`}>{topic}</Label>
              </div>
            ))}
          </div>
        </div>

        {/* Languages Filter */}
        <div>
          <Label className="mb-2 block font-medium">Idiomas</Label>
          <div className="space-y-2">
            {["Português", "Inglês", "Espanhol", "Francês"].map((lang) => (
              <div key={lang} className="flex items-center space-x-2">
                <Checkbox
                  id={`lang-${lang}`}
                  checked={filters.languages.includes(lang)}
                  onCheckedChange={() => handleCheckboxChange("languages", lang)}
                />
                <Label htmlFor={`lang-${lang}`}>{lang}</Label>
              </div>
            ))}
          </div>
        </div>

        {/* Experience Years Filter */}
        <div>
          <Label className="mb-2 block font-medium">Anos de Experiência</Label>
          <div className="space-y-2">
            {[1, 3, 5, 10].map((years) => (
              <div key={years} className="flex items-center space-x-2">
                <Checkbox
                  id={`exp-${years}`}
                  checked={filters.experienceYears.includes(years)}
                  onCheckedChange={() => handleCheckboxChange("experienceYears", years)}
                />
                <Label htmlFor={`exp-${years}`}>{years}+ anos</Label>
              </div>
            ))}
          </div>
        </div>

        {/* Education Level Filter */}
        <div>
          <Label className="mb-2 block font-medium">Nível de Educação</Label>
          <div className="space-y-2">
            {["Graduação", "Pós-graduação", "Mestrado", "Doutorado"].map((level) => (
              <div key={level} className="flex items-center space-x-2">
                <Checkbox
                  id={`edu-${level}`}
                  checked={filters.educationLevels.includes(level)}
                  onCheckedChange={() => handleCheckboxChange("educationLevels", level)}
                />
                <Label htmlFor={`edu-${level}`}>{level}</Label>
              </div>
            ))}
          </div>
        </div>

        {/* Rating Filter */}
        <div>
          <Label className="mb-2 block font-medium">Avaliação Mínima</Label>
          <Slider
            min={0}
            max={5}
            step={0.5}
            value={[filters.rating || 0]}
            onValueChange={handleSliderChange}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-muted-foreground mt-2">
            <span>0 Estrelas</span>
            <span>{filters.rating || 0} Estrelas</span>
          </div>
        </div>

        {/* Location Filters */}
        <div>
          <Label className="mb-2 block font-medium">Localização</Label>
          <div className="space-y-2">
            <Input
              placeholder="Cidade"
              value={filters.city}
              onChange={(e) => onFiltersChange({ city: e.target.value })}
            />
            <Input
              placeholder="Estado/Província"
              value={filters.state_province}
              onChange={(e) => onFiltersChange({ state_province: e.target.value })}
            />
            <Input
              placeholder="País"
              value={filters.country}
              onChange={(e) => onFiltersChange({ country: e.target.value })}
            />
          </div>
        </div>

        {/* Inclusion Tags Filter (example) */}
        <div>
          <Label className="mb-2 block font-medium">Tags de Inclusão</Label>
          <div className="space-y-2">
            {["Mulheres na Tech", "LGBTQIA+", "Pessoas Negras", "PCD"].map((tag) => (
              <div key={tag} className="flex items-center space-x-2">
                <Checkbox
                  id={`inclusion-${tag}`}
                  checked={filters.inclusionTags.includes(tag)}
                  onCheckedChange={() => handleCheckboxChange("inclusionTags", tag)}
                />
                <Label htmlFor={`inclusion-${tag}`}>{tag}</Label>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
