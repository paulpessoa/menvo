import { Loader2Icon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function Loading() {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 dark:bg-gray-950">
      <div className="flex flex-col items-center space-y-4">
        <Loader2Icon className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">{t('common.loading')}</p>
      </div>
    </div>
  )
}
