"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { X, AlertTriangle } from 'lucide-react'

export function WarningBanner() {
  const [isVisible, setIsVisible] = useState(true)

  const handleClose = () => {
    setIsVisible(false)
  }

  if (!isVisible) {
    return null
  }

  return (
    <Card className="bg-yellow-100 border-yellow-300 text-yellow-800 dark:bg-yellow-900 dark:border-yellow-700 dark:text-yellow-200 rounded-none border-b">
      <CardContent className="p-3 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          <span>Esta é uma versão de demonstração. Dados podem ser redefinidos.</span>
        </div>
        <Button variant="ghost" size="icon" onClick={handleClose} className="text-yellow-800 dark:text-yellow-200 hover:bg-yellow-200/50 dark:hover:bg-yellow-800/50">
          <X className="h-4 w-4" />
          <span className="sr-only">Fechar aviso</span>
        </Button>
      </CardContent>
    </Card>
  )
}
