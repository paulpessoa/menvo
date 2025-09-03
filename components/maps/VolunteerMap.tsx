"use client"

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import { Badge } from "@/components/ui/badge"
import { Linkedin } from "lucide-react"

// Dados dos voluntários organizados por cidade
const volunteersData = {
  "Paulista, PE": {
    coords: [-7.9407, -34.8718],
    volunteers: [
      {
        name: "Matheus Almeida",
        role: "Voluntário - DevOps AWS",
        linkedin: "https://www.linkedin.com/in/matheus-jos%C3%A9-santos-almeida"
      }
    ]
  },
  "Recife, PE": {
    coords: [-8.0476, -34.877],
    volunteers: [
      {
        name: "Alice Ferreira",
        role: "Voluntária - Gente e Cultura",
        linkedin: "https://www.linkedin.com/in/aliceferreiras"
      }
    ]
  },
  "Santo Ângelo, RS": {
    coords: [-28.2986, -54.263],
    volunteers: [
      {
        name: "Janaina Dorneles",
        role: "Voluntária - Product Design",
        linkedin: "https://www.linkedin.com/in/janaina-dorneles-052211102"
      }
    ]
  },

  "Formiga, MG": {
    coords: [-20.4616, -45.4328],
    volunteers: [
      {
        name: "Vitória Neves",
        role: "Voluntária - Product Design",
        linkedin: "https://www.linkedin.com/in/vivimariaui/"
      }
    ]
  },
  "São Paulo, SP": {
    coords: [-23.5489, -46.6388],
    volunteers: [
      {
        name: "Maria Clara Dias",
        role: "Voluntária - Product Design",
        linkedin: "https://www.linkedin.com/in/maria-clara-dias-2363471b0"
      }
    ]
  },
  "Quixadá, CE": {
    coords: [-4.9714, -39.0147],
    volunteers: [
      {
        name: "Matheus Maciel",
        role: "Voluntário - Desenvolvedor Backend",
        linkedin: "https://www.linkedin.com/in/matheus-maciel-345406262/"
      }
    ]
  }
}

// Função para criar ícone customizado
const createCustomIcon = (count: number) => {
  const size = Math.max(35, Math.min(60, 35 + count * 8))
  return L.divIcon({
    className: "custom-div-icon",
    html: `<div style="background: linear-gradient(135deg, #0f766e, #14b8a6); border: 3px solid #ffffff; border-radius: 50%; color: white; font-weight: bold; text-align: center; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(15, 118, 110, 0.4); width: ${size}px; height: ${size}px;">${count.toString()}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  })
}

export default function VolunteerMap() {
  const totalVolunteers = Object.values(volunteersData).reduce(
    (sum, city) => sum + city.volunteers.length,
    0
  )
  const totalCities = Object.keys(volunteersData).length

  const bounds = L.latLngBounds(
    Object.values(volunteersData).map(
      (data) => data.coords as L.LatLngExpression
    )
  )

  return (
    <div className="w-full">
      <div className="container pt-8 md:pt-12">
        <div className="flex flex-col items-center text-center space-y-4 mb-12">
          <Badge variant="outline" className="mb-2">
            Nossa Comunidade
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            Mapa de Voluntários
          </h1>
          <p className="text-muted-foreground max-w-[800px] md:text-xl">
            Distribuição geográfica da nossa equipe e do nosso impacto pelo
            Brasil.
          </p>
          <div className="bg-white/10 p-4 mx-5 rounded-lg text-center text-black backdrop-blur border border-white/20">
            <strong>{totalVolunteers} voluntários</strong> distribuídos em{" "}
            <strong>{totalCities} cidades</strong>
          </div>
        </div>
      </div>
      <div className="h-[65vh] overflow-hidden">
        <MapContainer
          bounds={bounds}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {Object.entries(volunteersData).map(([city, data]) => (
            <Marker
              key={city}
              position={data.coords as L.LatLngExpression}
              icon={createCustomIcon(data.volunteers.length)}
            >
              <Popup>
                <div className="p-1">
                  <div className="text-teal-800 text-lg font-bold mb-2 text-center border-b-2 border-teal-500 pb-2">
                    {city}
                  </div>
                  <div className="text-teal-800 font-bold mb-2">
                    {data.volunteers.length} voluntário
                    {data.volunteers.length > 1 ? "s" : ""}
                  </div>
                  <div className="space-y-1">
                    {data.volunteers.map((v) => (
                      <a
                        key={v.name}
                        href={v.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-2 rounded-lg transition-colors hover:bg-teal-100/50 group"
                      >
                        <Linkedin className="h-5 w-5 text-gray-400 group-hover:text-teal-600 transition-colors flex-shrink-0" />
                        <div className="flex-1">
                            <div className="font-bold text-teal-800 group-hover:text-teal-900 text-sm">{v.name}</div>
                            <div className="text-xs text-gray-600 group-hover:text-gray-700">{v.role}</div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  )
}
