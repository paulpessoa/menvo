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
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground mb-4">{selectAllText}</p>
      {options.map((option) => (
        <div
          key={option.value}
          className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
        >
          <Checkbox
            id={option.value}
            checked={selectedAreas.includes(option.value)}
            onCheckedChange={() => onToggleArea(option.value)}
          />
          <Label htmlFor={option.value} className="flex-1 cursor-pointer">
            {option.label}
          </Label>
        </div>
      ))}
      <div className="pt-2">
        <Label htmlFor="other-area" className="text-sm">
          {otherAreaSpecifyText}
        </Label>
        <Input
          id="other-area"
          placeholder={otherAreaPlaceholder}
          value={otherArea}
          onChange={(e) => onChangeOther(e.target.value)}
          className="mt-2"
        />
      </div>
    </div>
  )
}
