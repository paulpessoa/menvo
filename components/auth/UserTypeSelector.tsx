"use client"

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { User, Lightbulb } from 'lucide-react'

interface UserTypeSelectorProps {
  selectedType: "mentee" | "mentor" | null
  onSelectType: (type: "mentee" | "mentor") => void
}

export default function UserTypeSelector({ selectedType, onSelectType }: UserTypeSelectorProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Eu sou um(a):</h3>
      <RadioGroup
        value={selectedType || ""}
        onValueChange={(value: "mentee" | "mentor") => onSelectType(value)}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <Card
          className={`cursor-pointer ${
            selectedType === "mentee" ? "border-primary ring-2 ring-primary" : ""
          }`}
          onClick={() => onSelectType("mentee")}
        >
          <CardContent className="p-4 flex flex-col items-center text-center">
            <User className="h-10 w-10 text-primary mb-3" />
            <h4 className="font-semibold text-lg">Mentee</h4>
            <p className="text-sm text-muted-foreground">
              Busco orientação e aprendizado para meu desenvolvimento.
            </p>
            <RadioGroupItem value="mentee" id="mentee-type" className="sr-only" />
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer ${
            selectedType === "mentor" ? "border-primary ring-2 ring-primary" : ""
          }`}
          onClick={() => onSelectType("mentor")}
        >
          <CardContent className="p-4 flex flex-col items-center text-center">
            <Lightbulb className="h-10 w-10 text-primary mb-3" />
            <h4 className="font-semibold text-lg">Mentor</h4>
            <p className="text-sm text-muted-foreground">
              Quero compartilhar meu conhecimento e experiência.
            </p>
            <RadioGroupItem value="mentor" id="mentor-type" className="sr-only" />
          </CardContent>
        </Card>
      </RadioGroup>
    </div>
  )
}
