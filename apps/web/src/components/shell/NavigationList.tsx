import { appNavigationItems } from '../../config/navigation.config.js'
import { NavigationItem } from './NavigationItem.js'

interface NavigationListProps {
  onNavigate?: () => void
}

export function NavigationList({ onNavigate }: NavigationListProps) {
  return (
    <nav aria-label="Application navigation">
      <ul className="space-y-1.5">
        {appNavigationItems.map((item) => (
          <li key={item.id}>
            <NavigationItem
              item={item}
              {...(onNavigate ? { onNavigate } : {})}
            />
          </li>
        ))}
      </ul>
    </nav>
  )
}
