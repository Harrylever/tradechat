'use client'

import { SidebarTrigger, useSidebar } from '../ui/sidebar'

export function AppHeader() {
  const { isMobile } = useSidebar()

  return (
    <header className="bg-sidebar flex h-14 shrink-0 items-center gap-2 border-b px-4">
      {isMobile ? <SidebarTrigger className="-ml-1" /> : null}

      <div className="flex flex-1 items-center justify-between">
        {/* Breadcrumbs can go here later */}
        <div className="text-muted-foreground text-sm font-medium">
          Dashboard
        </div>
      </div>
    </header>
  )
}
