"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { ChipOption } from "@/lib/ai/protocol"

export interface ChipGroupProps {
  mode: "single" | "multi"
  options: ChipOption[]
  allowOther?: boolean
  canSkip?: boolean
  onSelect: (value: string) => void
  disabled?: boolean
}

/**
 * Interactive chip selector for conversational diagnostic questions.
 * Supports single-choice (instant trigger) and multi-choice (with confirmation button).
 */
export function ChipGroup({
  mode,
  options,
  allowOther = false,
  canSkip = false,
  onSelect,
  disabled = false
}: ChipGroupProps) {
  const [selectedValues, setSelectedValues] = useState<string[]>([])
  const [otherText, setOtherText] = useState("")
  const [showOtherInput, setShowOtherInput] = useState(false)

  const handleSingleSelect = (val: string) => {
    if (disabled) return
    if (val === "outro" && allowOther) {
      setShowOtherInput(true)
      return
    }
    onSelect(val)
  }

  const handleToggleMulti = (val: string) => {
    if (disabled) return
    setSelectedValues((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    )
  }

  const handleSubmitMulti = () => {
    if (disabled) return
    const finalSelection = [...selectedValues]
    if (showOtherInput && otherText.trim()) {
      finalSelection.push(otherText.trim())
    }
    if (finalSelection.length === 0) return
    onSelect(JSON.stringify(finalSelection))
  }

  const handleSubmitOther = () => {
    if (disabled || !otherText.trim()) return
    onSelect(otherText.trim())
  }

  return (
    <div className="flex flex-col gap-3 my-2 w-full max-w-xl">
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected =
            mode === "multi"
              ? selectedValues.includes(option.value)
              : false

          return (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() =>
                mode === "single"
                  ? handleSingleSelect(option.value)
                  : handleToggleMulti(option.value)
              }
              className={`px-3.5 py-2 text-sm font-medium rounded-xl border transition-all active:scale-[0.98] ${
                isSelected
                  ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20"
                  : "bg-background border-border text-foreground hover:bg-muted/60 hover:border-primary/40"
              } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              {option.label}
            </button>
          )
        })}

        {canSkip && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onSelect("pular")}
            className="px-3.5 py-2 text-sm font-medium rounded-xl border border-dashed border-muted-foreground/40 text-muted-foreground hover:bg-muted/40 transition-all cursor-pointer"
          >
            Pular esta etapa
          </button>
        )}
      </div>

      {showOtherInput && (
        <div className="flex items-center gap-2 mt-1">
          <Input
            value={otherText}
            onChange={(e) => setOtherText(e.target.value)}
            placeholder="Digite sua resposta personalizada..."
            disabled={disabled}
            className="rounded-xl h-10 text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter" && mode === "single") {
                e.preventDefault()
                handleSubmitOther()
              }
            }}
          />
          {mode === "single" && (
            <Button
              type="button"
              size="sm"
              disabled={disabled || !otherText.trim()}
              onClick={handleSubmitOther}
              className="rounded-xl"
            >
              Enviar
            </Button>
          )}
        </div>
      )}

      {mode === "multi" && (
        <div className="flex items-center gap-3 mt-1">
          {allowOther && !showOtherInput && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowOtherInput(true)}
              className="rounded-xl text-xs"
            >
              Adicionar outro
            </Button>
          )}

          <Button
            type="button"
            disabled={disabled || (selectedValues.length === 0 && !otherText.trim())}
            onClick={handleSubmitMulti}
            className="rounded-xl font-medium"
          >
            Confirmar seleção ({selectedValues.length})
          </Button>
        </div>
      )}
    </div>
  )
}
