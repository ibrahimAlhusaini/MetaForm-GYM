import { PlaceholderPage } from '../components/shell/PlaceholderPage.js'
import { getNavigationItem } from '../config/navigation.config.js'
import { useAuthStore } from '../store/auth.store.js'

const homeNavigation = getNavigationItem('home')

export function HomePlaceholderPage() {
  const userName = useAuthStore(
    (state) => state.user?.profile?.fullName ?? 'Member',
  )

  return (
    <PlaceholderPage
      title={`Welcome back, ${userName}`}
      description={homeNavigation.description}
    />
  )
}
