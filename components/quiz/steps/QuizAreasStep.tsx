'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

interface AreaOption {
  value: string
  label: string
}

interface QuizAreasStepProps {
  selectedAreas?: string[]
  otherArea?: string
  options: AreaOption[]
  onToggleArea: (area: string) => void
  onChangeOther: (val: string) => void
  selectAllText: string
  otherAreaSpecifyText: string
  otherAreaPlaceholder: string
}

export function QuizAreasStep({
  selectedAreas = [],
  otherArea = '',
  options,
  onToggleArea,
  onChangeOther,
  selectAllText,
  otherAreaSpecifyText,
  otherAreaPlaceholder,
}: QuizAreasStepProps) {
  return (
    <div className="space-y-3">
      <p className="mb-1 text-sm text-muted-foreground">{selectAllText}</p>
      {options.map((option) => {
        const selected = selectedAreas.includes(option.value)
        return (
          <Label
            key={option.value}
            htmlFor={option.value}
            className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 text-base font-medium leading-snug transition-colors hover:border-primary/60 ${
              selected ? 'border-primary bg-accent' : 'bg-card'
            }`}
          >
            <Checkbox
              id={option.value}
              checked={selected}
              onCheckedChange={() => onToggleArea(option.value)}
            />
            <span className="flex-1">{option.label}</span>
          </Label>
        )
      })}
      <div className="pt-3">
        <Label htmlFor="other-area" className="text-sm font-medium">
          {otherAreaSpecifyText}
        </Label>
        <Input
          id="other-area"
          placeholder={otherAreaPlaceholder}
          value={otherArea}
          onChange={(e) => onChangeOther(e.target.value)}
          className="mt-2 h-12 rounded-xl bg-card"
        />
      </div>
    </div>
  )
}
