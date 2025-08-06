"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, X, SearchIcon, MapPinIcon } from 'lucide-react'
import { format } from "date-fns"
import type { EventFilters as EventFiltersType, EventType, EventFormat, EventSource } from "@/types/events"
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface EventFiltersProps {
  filters: EventFiltersType
  onFiltersChange: (filters: Partial<EventFiltersType>) => void
  onClearFilters: () => void
}

const eventTypes: { value: EventType; label: string }[] = [
  { value: "course", label: "Courses" },
  { value: "workshop", label: "Workshops" },
  { value: "hackathon", label: "Hackathons" },
  { value: "lecture", label: "Lectures" },
  { value: "seminar", label: "Seminars" },
  { value: "webinar", label: "Webinars" },
  { value: "conference", label: "Conferences" },
  { value: "networking", label: "Networking" },
]

const eventFormats: { value: EventFormat; label: string }[] = [
  { value: "virtual", label: "Virtual" },
  { value: "in-person", label: "In-Person" },
  { value: "hybrid", label: "Hybrid" },
]

const eventSources: { value: EventSource; label: string }[] = [
  { value: "internal", label: "MentorConnect Events" },
  { value: "external", label: "Partner Events" },
]

const popularTags = [
  "Technology",
  "Career",
  "Leadership",
  "Entrepreneurship",
  "Design",
  "Marketing",
  "Data Science",
  "AI/ML",
  "Web Development",
  "Mobile",
  "DevOps",
  "Product Management",
  "Finance",
  "Sales",
  "HR",
]

export default function EventFilters({ filters, onFiltersChange, onClearFilters }: EventFiltersProps) {
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({})

  const handleTypeChange = (type: EventType, checked: boolean) => {
    const newTypes = checked ? [...filters.types, type] : filters.types.filter((t) => t !== type)
    onFiltersChange({ types: newTypes })
  }

  const handleFormatChange = (format: EventFormat, checked: boolean) => {
    const newFormats = checked ? [...filters.formats, format] : filters.formats.filter((f) => f !== format)
    onFiltersChange({ formats: newFormats })
  }

  const handleSourceChange = (source: EventSource, checked: boolean) => {
    const newSources = checked ? [...filters.sources, source] : filters.sources.filter((s) => s !== source)
    onFiltersChange({ sources: newSources })
  }

  const handleTagChange = (tag: string, checked: boolean) => {
    const newTags = checked ? [...filters.tags, tag] : filters.tags.filter((t) => t !== tag)
    onFiltersChange({ tags: newTags })
  }

  const handleDateRangeChange = (range: { from?: Date; to?: Date }) => {
    setDateRange(range)
    onFiltersChange({
      dateRange: {
        start: range.from?.toISOString().split("T")[0],
        end: range.to?.toISOString().split("T")[0],
      },
    })
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ search: e.target.value })
  }

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ location: e.target.value })
  }

  const handleCategoryChange = (value: string) => {
    onFiltersChange({ category: value })
  }

  return (
    <Card className="sticky top-20">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Filters</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            Clear all
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search */}
        <div className="grid gap-2">
          <Label htmlFor="search">Buscar por Título</Label>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="search" placeholder="Ex: Webinar de IA" className="pl-9" onChange={handleSearchChange} />
          </div>
        </div>

        {/* Location */}
        <div className="grid gap-2">
          <Label htmlFor="location">Localização</Label>
          <div className="relative">
            <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="location" placeholder="Ex: Online, São Paulo" className="pl-9" onChange={handleLocationChange} />
          </div>
        </div>

        {/* Event Types */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Event Type</Label>
          <div className="space-y-2">
            {eventTypes.map((type) => (
              <div key={type.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`type-${type.value}`}
                  checked={filters.types.includes(type.value)}
                  onCheckedChange={(checked) => handleTypeChange(type.value, checked as boolean)}
                />
                <Label htmlFor={`type-${type.value}`} className="text-sm font-normal cursor-pointer">
                  {type.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Format */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Format</Label>
          <div className="space-y-2">
            {eventFormats.map((format) => (
              <div key={format.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`format-${format.value}`}
                  checked={filters.formats.includes(format.value)}
                  onCheckedChange={(checked) => handleFormatChange(format.value, checked as boolean)}
                />
                <Label htmlFor={`format-${format.value}`} className="text-sm font-normal cursor-pointer">
                  {format.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Source */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Source</Label>
          <div className="space-y-2">
            {eventSources.map((source) => (
              <div key={source.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`source-${source.value}`}
                  checked={filters.sources.includes(source.value)}
                  onCheckedChange={(checked) => handleSourceChange(source.value, checked as boolean)}
                />
                <Label htmlFor={`source-${source.value}`} className="text-sm font-normal cursor-pointer">
                  {source.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Price */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Price</Label>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="free-only"
                checked={filters.isFree === true}
                onCheckedChange={(checked) => onFiltersChange({ isFree: checked ? true : undefined })}
              />
              <Label htmlFor="free-only" className="text-sm font-normal">
                Free events only
              </Label>
            </div>

            {filters.isFree !== true && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>${filters.priceRange[0]}</span>
                  <span>${filters.priceRange[1]}</span>
                </div>
                <Slider
                  value={filters.priceRange}
                  onValueChange={(value) => onFiltersChange({ priceRange: value as [number, number] })}
                  max={1000}
                  step={10}
                  className="w-full"
                />
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Date Range */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Date Range</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={dateRange}
                    onSelect={handleDateRangeChange}
                    numberOfMonths={2}
                  />
            </PopoverContent>
          </Popover>
          {(filters.dateRange.start || filters.dateRange.end) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDateRange({})
                onFiltersChange({ dateRange: {} })
              }}
              className="w-full"
            >
              Clear date filter
            </Button>
          )}
        </div>

        <Separator />

        {/* Category */}
        <div className="grid gap-2">
          <Label htmlFor="category">Categoria</Label>
          <Select>
            <SelectTrigger id="category" onValueChange={handleCategoryChange}>
              <SelectValue placeholder="Selecione uma categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="tech">Tecnologia</SelectItem>
              <SelectItem value="business">Negócios</SelectItem>
              <SelectItem value="personal-dev">Desenvolvimento Pessoal</SelectItem>
              <SelectItem value="design">Design</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Tags */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Topics</Label>
          <div className="flex flex-wrap gap-2">
            {popularTags.map((tag) => (
              <Badge
                key={tag}
                variant={filters.tags.includes(tag) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => handleTagChange(tag, !filters.tags.includes(tag))}
              >
                {tag}
                {filters.tags.includes(tag) && <X className="ml-1 h-3 w-3" />}
              </Badge>
            ))}
          </div>
        </div>

        <Button className="w-full">Aplicar Filtros</Button>
        <Button variant="outline" className="w-full">Limpar Filtros</Button>
      </CardContent>
    </Card>
  )
}
