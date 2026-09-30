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
        <Label htmlFor="name" className="font-medium">{fullNameLabel}</Label>
        <Input
          id="name"
          className="h-12 rounded-xl bg-card"
          placeholder={fullNamePlaceholder}
          value={name}
          onChange={(e) => onChangeField('name', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="font-medium">{emailLabel}</Label>
        <Input
          id="email"
          className="h-12 rounded-xl bg-card"
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
        <Label htmlFor="linkedin" className="font-medium">{linkedinLabel}</Label>
        <Input
          id="linkedin"
          className="h-12 rounded-xl bg-card"
          placeholder={linkedinPlaceholder}
          value={linkedinUrl}
          onChange={(e) => onChangeField('linkedinUrl', e.target.value)}
        />
      </div>

      <div className="rounded-2xl bg-accent p-5">
        <p className="text-sm leading-relaxed text-foreground">
          {notificationText}
        </p>
      </div>
    </div>
  )
}
