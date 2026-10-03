import * as React from "react"
import { Command as CommandPrimitive } from "cmdk"
import { X } from "lucide-react"
import { Badge } from "@/components/ui/badge"

type MultiSelectAutocompleteProps = {
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  options?: string[]
}

export function MultiSelectAutocomplete({
  value = [],
  onChange,
  placeholder,
  options = []
}: MultiSelectAutocompleteProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")

  const handleUnselect = (item: string) => {
    onChange(value.filter((i) => i !== item))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const input = inputRef.current
    if (input) {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (input.value === "" && value.length > 0) {
          onChange(value.slice(0, -1))
        }
      }
      if (e.key === "Escape") {
        input.blur()
      }
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault()
        const chip = inputValue.trim().replace(/,$/, "").trim()
        if (chip && !value.includes(chip)) {
          onChange([...value, chip])
          setInputValue("")
        }
      }
    }
  }

  const availableOptions = options.filter(
    (opt) => !value.includes(opt)
  )

  return (
    <CommandPrimitive onKeyDown={handleKeyDown} className="overflow-visible bg-transparent">
      <div className="space-y-2">
        {value.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {value.map((chip) => (
              <Badge key={chip} variant="secondary" className="flex items-center gap-1">
                {chip}
                <button
                  type="button"
                  aria-label={`Remover ${chip}`}
                  onClick={() => handleUnselect(chip)}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        <div className="group rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus-within:ring-1 focus-within:ring-ring">
          <CommandPrimitive.Input
            ref={inputRef}
            value={inputValue}
            onValueChange={setInputValue}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            className="w-full bg-transparent outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>
      <div className="relative mt-2">
        {open && (
          <div className="absolute top-0 z-10 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95">
            <CommandPrimitive.List className="max-h-60 overflow-auto p-1">
              <CommandPrimitive.Empty>Nenhuma sugestão.</CommandPrimitive.Empty>
              {availableOptions.map((opt) => (
                <CommandPrimitive.Item
                  key={opt}
                  value={opt}
                  onMouseDown={(e) => e.preventDefault()}
                  onSelect={() => {
                    onChange([...value, opt])
                    setInputValue("")
                  }}
                  className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50"
                >
                  {opt}
                </CommandPrimitive.Item>
              ))}
              {inputValue.trim() !== "" && !options.some(o => o.toLowerCase() === inputValue.trim().toLowerCase()) && !value.some(v => v.toLowerCase() === inputValue.trim().toLowerCase()) && (
                <CommandPrimitive.Item
                  value={inputValue.trim()}
                  onMouseDown={(e) => e.preventDefault()}
                  onSelect={() => {
                    onChange([...value, inputValue.trim()])
                    setInputValue("")
                  }}
                  className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50"
                >
                  Criar "{inputValue.trim()}"
                </CommandPrimitive.Item>
              )}
            </CommandPrimitive.List>
          </div>
        )}
      </div>
    </CommandPrimitive>
  )
}
