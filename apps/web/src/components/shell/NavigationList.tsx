import { appNavigationItems } from '../../config/navigation.config.js'
import { useTranslation } from 'react-i18next'
import { NavigationItem } from './NavigationItem.js'

interface NavigationListProps {
  onNavigate?: () => void
}

export function NavigationList({ onNavigate }: NavigationListProps) {
  const { t } = useTranslation('navigation')
  return (
    <nav aria-label={t('shell.navigation')}>
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
