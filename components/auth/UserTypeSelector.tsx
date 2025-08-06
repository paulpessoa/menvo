'use client'

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Database } from '@/types/database'

interface UserTypeSelectorProps {
  selectedType: Database['public']['Enums']['user_role'];
  onTypeChange: (type: Database['public']['Enums']['user_role']) => void;
}

export function UserTypeSelector({ selectedType, onTypeChange }: UserTypeSelectorProps) {
  return (
    <RadioGroup
      defaultValue={selectedType}
      onValueChange={(value: Database['public']['Enums']['user_role']) => onTypeChange(value)}
      className="flex space-x-4"
    >
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="mentee" id="mentee" />
        <Label htmlFor="mentee">Mentee</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="mentor" id="mentor" />
        <Label htmlFor="mentor">Mentor</Label>
      </div>
    </RadioGroup>
  )
}
