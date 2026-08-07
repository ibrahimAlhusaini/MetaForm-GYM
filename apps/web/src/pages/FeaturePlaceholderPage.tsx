import { useTranslation } from 'react-i18next'
import { PlaceholderPage } from '../components/shell/PlaceholderPage.js'
import {
  getNavigationItem,
  type AppNavigationId,
} from '../config/navigation.config.js'

interface FeaturePlaceholderPageProps {
  navigationId: Exclude<AppNavigationId, 'home'>
}

export function FeaturePlaceholderPage({
  navigationId,
}: FeaturePlaceholderPageProps) {
  const { t } = useTranslation('navigation')
  const navigationItem = getNavigationItem(navigationId)
  return (
    <PlaceholderPage
      title={t(navigationItem.pageTitleKey)}
      description={t(navigationItem.descriptionKey)}
    />
  )
}
