import type {
  AiCoachCapabilityDefinition,
  AiCoachCapabilityType,
} from '@metaform/shared-types'
import { useTranslation } from 'react-i18next'
import { capabilityPresentation } from '../constants/ai-coach.constants.js'
import { AiCoachCapabilityCard } from './AiCoachCapabilityCard.js'

const isSupported = (capability: AiCoachCapabilityDefinition): boolean =>
  Object.hasOwn(capabilityPresentation, capability.type)

export function AiCoachCapabilityGrid({
  capabilities,
  selected,
  onSelect,
}: {
  capabilities: AiCoachCapabilityDefinition[]
  selected: AiCoachCapabilityType | null
  onSelect: (type: AiCoachCapabilityType) => void
}) {
  const { t } = useTranslation('aiCoach')
  const supported = capabilities.filter(isSupported)
  const unknownCount = capabilities.length - supported.length
  return (
    <div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {supported.map((capability) => (
          <AiCoachCapabilityCard
            key={capability.type}
            capability={capability}
            selected={selected === capability.type}
            onSelect={() => {
              onSelect(capability.type)
            }}
          />
        ))}
      </div>
      {unknownCount > 0 ? (
        <p role="status" className="mt-4 text-sm text-zinc-400">
          {t('capabilities.unknown', { count: unknownCount })}
        </p>
      ) : null}
    </div>
  )
}
