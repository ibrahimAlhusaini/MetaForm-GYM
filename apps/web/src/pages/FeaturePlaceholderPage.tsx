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
  const navigationItem = getNavigationItem(navigationId)

  return (
    <PlaceholderPage
      title={navigationItem.pageTitle}
      description={navigationItem.description}
    />
  )
}
