import { useState } from 'react'
import { Dumbbell } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function MachineImage({
  imageUrl,
  name,
  className = '',
}: {
  imageUrl: string | null
  name: string
  className?: string
}) {
  const { t } = useTranslation('weightTracker')
  const [failed, setFailed] = useState(false)
  if (!imageUrl || failed)
    return (
      <div
        role="img"
        aria-label={t('machines.imageUnavailable', { name })}
        className={`grid place-items-center bg-gradient-to-br from-lime-300/12 to-white/3 text-lime-300 ${className}`}
      >
        <Dumbbell className="size-8" aria-hidden="true" />
      </div>
    )
  return (
    <img
      src={imageUrl}
      alt={t('machines.imageAlt', { name })}
      onError={() => {
        setFailed(true)
      }}
      className={`object-cover ${className}`}
    />
  )
}
