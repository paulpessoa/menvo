"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

interface ChipInputProps {
  value: string[]
  onChange: (value: string[]) => void
  placeholder: string
}

/**
 * Free-text tag input: Enter or comma adds a chip. Pending text is also
 * committed on blur, otherwise people type a topic, click "Salvar" and lose it.
 */
export function ChipInput({ value, onChange, placeholder }: ChipInputProps) {
  const [inputValue, setInputValue] = useState("")

  const addChip = () => {
    const chip = inputValue.trim().replace(/,$/, "").trim()
    if (chip && !value.includes(chip)) onChange([...value, chip])
    setInputValue("")
  }

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((chip, index) => (
            <Badge key={chip} variant="secondary" className="flex items-center gap-1">
              {chip}
              <button
                type="button"
                aria-label={`Remover ${chip}`}
                onClick={() => onChange(value.filter((_, i) => i !== index))}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <Input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onBlur={addChip}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault()
            addChip()
          }
        }}
        placeholder={placeholder}
      />
    </div>
  )
}
