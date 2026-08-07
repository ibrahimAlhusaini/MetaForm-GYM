import type { NutritionProfileInputs } from '@metaform/shared-types'
import { CircleCheck, Info } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function ProfilePrefillNotice({
  profile,
}: {
  profile: NutritionProfileInputs
}) {
  const { t } = useTranslation('nutrition')
  const missing = Object.entries(profile.completeness)
    .filter(([, complete]) => !complete)
    .map(([field]) => t(`profile.fields.${field}`))
  const complete = missing.length === 0
  const Icon = complete ? CircleCheck : Info
  return (
    <div className="rounded-xl border border-lime-300/15 bg-lime-300/[0.04] p-4 text-sm">
      <p className="flex items-center gap-2 font-semibold text-zinc-100">
        <Icon className="size-4 text-lime-300" aria-hidden="true" />
        {complete ? t('profile.completeTitle') : t('profile.incompleteTitle')}
      </p>
      <p className="mt-2 leading-6 text-zinc-400">
        {complete
          ? t('profile.completeDescription')
          : t('profile.incompleteDescription', { fields: missing.join(', ') })}
      </p>
    </div>
  )
}
