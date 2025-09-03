"use client"

import dynamic from "next/dynamic"
import { useMemo } from "react"

export default function MapsPage() {
  const Map = useMemo(
    () =>
      dynamic(() => import("@/components/maps/VolunteerMap"), {
        loading: () => <p className="text-center p-10">Carregando mapa...</p>,
        ssr: false
      }),
    []
  )

  return <Map />
}
