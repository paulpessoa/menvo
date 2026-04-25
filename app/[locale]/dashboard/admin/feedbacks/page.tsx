"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageSquare, Star, CheckCircle, ListFilter } from "lucide-react"
import { RequireRole } from "@/lib/auth/auth-guard"
import { useTranslations } from "next-intl"
import { AdminFeedbackModeration } from "@/components/admin/AdminFeedbackModeration"
import { Badge } from "@/components/ui/badge"

export default function AdminFeedbacksPage() {
  const t = useTranslations("dashboard")

  return (
    <RequireRole roles={["admin"]}>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-black tracking-tight">Gestão de Feedbacks</h1>
            <p className="text-muted-foreground text-lg">Modere e analise o que a comunidade está dizendo.</p>
          </div>

          <Tabs defaultValue="sessions" className="space-y-6">
            <TabsList className="bg-transparent border-b rounded-none w-full justify-start h-auto p-0 gap-8">
              <TabsTrigger 
                value="sessions" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 pb-3 bg-transparent font-bold text-base flex items-center gap-2"
              >
                <Star className="w-4 h-4" /> Avaliações de Sessões
              </TabsTrigger>
              <TabsTrigger 
                value="platform" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 pb-3 bg-transparent font-bold text-base flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" /> Voz da Comunidade
              </TabsTrigger>
            </TabsList>

            <TabsContent value="sessions" className="animate-in fade-in duration-500">
               <div className="space-y-6">
                 <div>
                   <h2 className="text-2xl font-bold">Moderação de Avaliações</h2>
                   <p className="text-muted-foreground">Aprove depoimentos reais para exibição nos perfis dos mentores.</p>
                 </div>
                 <AdminFeedbackModeration />
               </div>
            </TabsContent>

            <TabsContent value="platform" className="animate-in fade-in duration-500">
              <Card>
                <CardHeader>
                  <CardTitle>Feedbacks Gerais da Plataforma</CardTitle>
                  <CardDescription>Sugestões, críticas e elogios sobre o uso do site.</CardDescription>
                </CardHeader>
                <CardContent className="h-64 flex flex-col items-center justify-center text-muted-foreground italic space-y-4">
                  <div className="p-4 bg-gray-50 rounded-full">
                    <ListFilter className="w-8 h-8 text-gray-300" />
                  </div>
                  <p>O histórico de feedbacks gerais está sendo migrado para este novo painel.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </RequireRole>
  )
}
