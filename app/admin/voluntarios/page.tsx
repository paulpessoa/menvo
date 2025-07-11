"use client"

import { useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useVolunteerActivities, useValidateActivity } from "@/hooks/api/use-volunteer-activities"
import { Button } from "@/components/ui/button"

export default function AdminVoluntariosPage() {
  const { user } = useAuth()
  const validateActivity = useValidateActivity()

  // Busca todas as atividades pendentes
  const {
    data: activities,
    isLoading,
    refetch,
  } = useVolunteerActivities({ status: "pending" })

  useEffect(() => {
    // Refaz a busca ao aprovar/rejeitar
    if (!isLoading) refetch()
  }, [validateActivity.isSuccess])

  // if (!user || user.role !== "admin") {
  //   return <div className="p-8 text-center">Acesso restrito a administradores.</div>
  // }

  if (isLoading) {
    return <div className="p-8 text-center">Carregando atividades...</div>
  }

  if (!activities || activities.length === 0) {
    return <div className="p-8 text-center">Nenhuma atividade pendente para validação.</div>
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-4">Validação de Atividades Voluntárias</h1>
      <table className="min-w-full border text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-2 py-1">Usuário</th>
            <th className="border px-2 py-1">Tipo</th>
            <th className="border px-2 py-1">Data</th>
            <th className="border px-2 py-1">Horas</th>
            <th className="border px-2 py-1">Descrição</th>
            <th className="border px-2 py-1">Ações</th>
          </tr>
        </thead>
        <tbody>
          {activities.map((activity: any) => (
            <tr key={activity.id}>
              <td className="border px-2 py-1">{activity.user_id}</td>
              <td className="border px-2 py-1">{activity.title}</td>
              <td className="border px-2 py-1">{activity.date}</td>
              <td className="border px-2 py-1">{activity.hours}</td>
              <td className="border px-2 py-1">{activity.description || "-"}</td>
              <td className="border px-2 py-1 space-x-2">
                <Button
                  size="sm"
                  variant="success"
                  onClick={() => validateActivity.mutate({ activityId: activity.id, status: "validated" })}
                  disabled={validateActivity.isPending}
                >
                  Aprovar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => validateActivity.mutate({ activityId: activity.id, status: "rejected" })}
                  disabled={validateActivity.isPending}
                >
                  Rejeitar
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
