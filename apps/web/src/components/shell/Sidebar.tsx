import { BrandMark } from './BrandMark.js'
import { NavigationList } from './NavigationList.js'
import { UserSummary } from './UserSummary.js'
import { useTranslation } from 'react-i18next'

export function Sidebar() {
  const { t } = useTranslation('navigation')
  return (
    <aside
      className="fixed inset-y-0 start-0 z-30 hidden w-72 border-e border-white/8 bg-[#0d0f10] lg:flex lg:flex-col"
      aria-label={t('shell.desktopSidebar')}
    >
      <div className="border-b border-white/8 px-6 py-6">
        <BrandMark />
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <NavigationList />
      </div>
      <div className="border-t border-white/8 px-5 py-5">
        <UserSummary />
      </div>
    </aside>
  )
}
