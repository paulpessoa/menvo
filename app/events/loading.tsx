import { Loader2Icon } from 'lucide-react'

export default function Loading() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <Loader2Icon className="h-8 w-8 animate-spin" />
      <span className="ml-2">Carregando eventos...</span>
    </div>
  )
}
