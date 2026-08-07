import type { NutritionProfileInputs } from '@metaform/shared-types'
import { CircleCheck, Info } from 'lucide-react'

export function ProfilePrefillNotice({
  profile,
}: {
  profile: NutritionProfileInputs
}) {
  const missing = Object.entries(profile.completeness)
    .filter(([, complete]) => !complete)
    .map(([field]) => field)
  const complete = missing.length === 0
  const Icon = complete ? CircleCheck : Info
  return (
    <div className="rounded-xl border border-lime-300/15 bg-lime-300/[0.04] p-4 text-sm">
      <p className="flex items-center gap-2 font-semibold text-zinc-100">
        <Icon className="size-4 text-lime-300" aria-hidden="true" />
        {complete
          ? 'Profile inputs loaded'
          : 'Profile information is incomplete'}
      </p>
      <p className="mt-2 leading-6 text-zinc-400">
        {complete
          ? 'Profile values are prefilled. Change any field to use a one-time manual override.'
          : `Complete the required blank fields below. Missing: ${missing.join(', ')}.`}
      </p>
    </div>
  )
}
