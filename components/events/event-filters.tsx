"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Filter, XCircle } from 'lucide-react'
import { EventFilters as EventFiltersType } from "@/types/events"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"

interface EventFiltersProps {
  filters: EventFiltersType
  onFiltersChange: (newFilters: Partial<EventFiltersType>) => void
  onClearFilters: () => void
}

export default function EventFilters({ filters, onFiltersChange, onClearFilters }: EventFiltersProps) {
  const handleCheckboxChange = (filterType: keyof EventFiltersType, value: string) => {
    const currentValues = filters[filterType] as string[]
    const newValues = currentValues.includes(value)
      ? currentValues.filter((item) => item !== value)
      : [...currentValues, value]
    onFiltersChange({ [filterType]: newValues })
  }

  const handlePriceRangeChange = (value: number[]) => {
    onFiltersChange({ priceRange: value })
  }

  const handleDateRangeChange = (range: { from?: Date; to?: Date }) => {
    onFiltersChange({ dateRange: { start: range.from?.toISOString().split('T')[0], end: range.to?.toISOString().split('T')[0] } })
  }

  const handleIsFreeChange = (checked: boolean) => {
    onFiltersChange({ isFree: checked ? true : undefined })
  }

  const activeFiltersCount = [
    filters.types.length,
    filters.formats.length,
    filters.sources.length,
    filters.tags.length,
    filters.isFree !== undefined ? 1 : 0,
    filters.dateRange.start || filters.dateRange.end ? 1 : 0,
  ].reduce((sum, count) => sum + count, 0)

  return (
    <Card className="p-6 sticky top-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">Filtros de Eventos</CardTitle>
        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            <XCircle className="h-4 w-4 mr-2" />
            Limpar ({activeFiltersCount})
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Event Type Filter */}
        <div>
          <Label className="mb-2 block font-medium">Tipo de Evento</Label>
          <div className="space-y-2">
            {["Webinar", "Workshop", "Conferência", "Meetup"].map((type) => (
              <div key={type} className="flex items-center space-x-2">
                <Checkbox
                  id={`type-${type}`}
                  checked={filters.types.includes(type)}
                  onCheckedChange={() => handleCheckboxChange("types", type)}
                />
                <Label htmlFor={`type-${type}`}>{type}</Label>
              </div>
            ))}
          </div>
        </div>

        {/* Event Format Filter */}
        <div>
          <Label className="mb-2 block font-medium">Formato</Label>
          <div className="space-y-2">
            {["Online", "Presencial", "Híbrido"].map((format) => (
              <div key={format} className="flex items-center space-x-2">
                <Checkbox
                  id={`format-${format}`}
                  checked={filters.formats.includes(format)}
                  onCheckedChange={() => handleCheckboxChange("formats", format)}
                />
                <Label htmlFor={`format-${format}`}>{format}</Label>
              </div>
            ))}
          </div>
        </div>

        {/* Price Filter */}
        <div>
          <Label className="mb-2 block font-medium">Preço</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is-free"
                checked={filters.isFree === true}
                onCheckedChange={handleIsFreeChange}
              />
              <Label htmlFor="is-free">Somente Gratuito</Label>
            </div>
            {!filters.isFree && (
              <div className="mt-4">
                <Slider
                  min={0}
                  max={1000}
                  step={10}
                  value={filters.priceRange}
                  onValueChange={handlePriceRangeChange}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground mt-2">
                  <span>R$ {filters.priceRange[0]}</span>
                  <span>R$ {filters.priceRange[1]}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Date Range Filter */}
        <div>
          <Label className="mb-2 block font-medium">Data</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !filters.dateRange.start && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dateRange.start ? (
                  filters.dateRange.end ? (
                    `${format(new Date(filters.dateRange.start), "LLL dd, y")} - ${format(
                      new Date(filters.dateRange.end),
                      "LLL dd, y"
                    )}`
                  ) : (
                    format(new Date(filters.dateRange.start), "LLL dd, y")
                  )
                ) : (
                  <span>Selecione uma data</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={{ from: filters.dateRange.start ? new Date(filters.dateRange.start) : undefined, to: filters.dateRange.end ? new Date(filters.dateRange.end) : undefined }}
                onSelect={handleDateRangeChange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Tags Filter (example, could be dynamic) */}
        <div>
          <Label className="mb-2 block font-medium">Tags</Label>
          <div className="space-y-2">
            {["Tecnologia", "Carreira", "Liderança", "Inovação", "Empreendedorismo"].map((tag) => (
              <div key={tag} className="flex items-center space-x-2">
                <Checkbox
                  id={`tag-${tag}`}
                  checked={filters.tags.includes(tag)}
                  onCheckedChange={() => handleCheckboxChange("tags", tag)}
                />
                <Label htmlFor={`tag-${tag}`}>{tag}</Label>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
