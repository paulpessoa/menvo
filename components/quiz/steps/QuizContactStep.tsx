'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface QuizContactStepProps {
  name?: string
  email?: string
  linkedinUrl?: string
  onChangeField: (field: 'name' | 'email' | 'linkedinUrl', value: string) => void
  fullNameLabel: string
  fullNamePlaceholder: string
  emailLabel: string
  emailPlaceholder: string
  invalidEmailText: string
  linkedinLabel: string
  linkedinPlaceholder: string
  notificationText: string
  isEmailInvalid?: boolean
}

export function QuizContactStep({
  name = '',
  email = '',
  linkedinUrl = '',
  onChangeField,
  fullNameLabel,
  fullNamePlaceholder,
  emailLabel,
  emailPlaceholder,
  invalidEmailText,
  linkedinLabel,
  linkedinPlaceholder,
  notificationText,
  isEmailInvalid,
}: QuizContactStepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">{fullNameLabel}</Label>
        <Input
          id="name"
          placeholder={fullNamePlaceholder}
          value={name}
          onChange={(e) => onChangeField('name', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">{emailLabel}</Label>
        <Input
          id="email"
          type="email"
          placeholder={emailPlaceholder}
          value={email}
          onChange={(e) => onChangeField('email', e.target.value)}
        />
        {isEmailInvalid && (
          <p className="text-xs text-destructive">{invalidEmailText}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="linkedin">{linkedinLabel}</Label>
        <Input
          id="linkedin"
          placeholder={linkedinPlaceholder}
          value={linkedinUrl}
          onChange={(e) => onChangeField('linkedinUrl', e.target.value)}
        />
      </div>

      <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-900 dark:text-blue-100">
          {notificationText}
        </p>
      </div>
    </div>
  )
}
