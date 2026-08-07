import { Dumbbell } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

export function ExerciseMedia({
  src,
  alt,
  className = '',
}: {
  src: string | null
  alt: string
  className?: string
}) {
  const { t } = useTranslation('exerciseLibrary')
  const [failedSource, setFailedSource] = useState<string | null>(null)
  const available = src !== null && src !== failedSource
  if (!available)
    return (
      <div
        role="img"
        aria-label={t('list.thumbnailUnavailable', { name: alt })}
        className={`flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-950 text-zinc-500 ${className}`}
      >
        <Dumbbell className="size-10" aria-hidden="true" />
      </div>
    )
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => {
        setFailedSource(src)
      }}
      className={`object-cover ${className}`}
    />
  )
}
