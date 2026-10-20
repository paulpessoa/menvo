"use client"

import { useRef } from "react"
import { Camera, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/lib/auth"
import { useSimpleImageUpload } from "@/hooks/useSimpleUpload"

interface ProfilePhotoPickerProps {
  avatarUrl: string
  firstName: string
  /** Receives the new URL (with a cache-busting suffix) once the upload succeeded. */
  onUploaded: (url: string) => void
}

/** Avatar with the camera button. The upload goes to `/api/upload/profile-photo`, which saves the URL itself. */
export function ProfilePhotoPicker({ avatarUrl, firstName, onUploaded }: ProfilePhotoPickerProps) {
  const { refreshProfile } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageUpload = useSimpleImageUpload("/api/upload/profile-photo")

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const result = await imageUpload.upload(file)
    if (result.success) {
      onUploaded(`${result.data.url}?t=${Date.now()}`)
      await refreshProfile()
      toast.success("Foto atualizada!")
    }
  }

  return (
    <div className="relative self-start">
      <Avatar className="h-24 w-24 border-2">
        <AvatarImage src={avatarUrl} />
        <AvatarFallback>{firstName?.[0]}</AvatarFallback>
      </Avatar>
      <button
        type="button"
        aria-label="Alterar foto"
        onClick={() => fileInputRef.current?.click()}
        disabled={imageUpload.isUploading}
        className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full shadow-lg"
      >
        {imageUpload.isUploading ? <Loader2 className="animate-spin h-4 w-4" /> : <Camera className="h-4 w-4" />}
      </button>
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
    </div>
  )
}
