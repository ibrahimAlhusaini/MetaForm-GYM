import { VideoOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function ExerciseVideo({
  name,
  videoUrl,
  thumbnailUrl,
}: {
  name: string
  videoUrl: string | null
  thumbnailUrl: string | null
}) {
  const { t } = useTranslation('exerciseLibrary')
  if (!videoUrl)
    return (
      <div className="flex aspect-video flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-[#0d0f10] px-6 text-center">
        <VideoOff className="size-10 text-zinc-500" aria-hidden="true" />
        <p className="mt-4 font-semibold">{t('video.unavailable')}</p>
        <p className="mt-2 max-w-md text-sm text-zinc-400">
          {t('video.unavailableDescription')}
        </p>
      </div>
    )
  return (
    <video
      aria-label={t('video.label', { name })}
      controls
      preload="metadata"
      poster={thumbnailUrl ?? undefined}
      className="aspect-video w-full rounded-2xl bg-black object-contain"
    >
      <source src={videoUrl} />
      {t('video.unsupported')}
    </video>
  )
}
