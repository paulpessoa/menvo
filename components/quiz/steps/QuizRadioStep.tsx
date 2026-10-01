'use client'

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'

interface Option {
  value: string
  label: string
}

interface QuizRadioStepProps {
  value?: string
  onChange: (value: string) => void
  options: Option[]
}

export function QuizRadioStep({ value, onChange, options }: QuizRadioStepProps) {
  return (
    <RadioGroup value={value} onValueChange={onChange} className="space-y-3">
      {options.map((option) => {
        const selected = value === option.value
        return (
          <Label
            key={option.value}
            htmlFor={option.value}
            className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 text-base font-medium leading-snug transition-colors hover:border-primary/60 ${
              selected ? 'border-primary bg-accent' : 'bg-card'
            }`}
          >
            <RadioGroupItem value={option.value} id={option.value} />
            <span className="flex-1">{option.label}</span>
          </Label>
        )
      })}
    </RadioGroup>
  )
}
