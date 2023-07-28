import Link from 'next/link'
import { useTranslation } from '../../i18n'

export default async function Bora({ params: { lng } }) {
  const { t } = await useTranslation(lng, 'translation')
  return (
    <>
      <h1>Show demais</h1>
      <p>{t('bannerText')}</p>

      <Link href={`/${lng}/mentors`}>
        {t('mentors')}
      </Link>
      <Link href={`/${lng}/about`}>
        {t('about')}
      </Link>
    </>
  )
}

// https://locize.com/blog/next-13-app-dir-i18n/#step-4