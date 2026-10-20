"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface FieldProps {
  label: string
  value: string
  onValue: (value: string) => void
  placeholder?: string
}

/** Label + text input pair; the profile form has ~15 of these. */
export function Field({ label, value, onValue, placeholder }: FieldProps) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onValue(e.target.value)} placeholder={placeholder} />
    </div>
  )
}
