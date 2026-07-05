'use client'

import {
  Cancel01Icon,
  DashboardSquare01Icon,
  Exchange01Icon,
  Logout01Icon,
  Wallet01Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

import { Button } from '../ui/button'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '../ui/sidebar'

export function AppSidebar() {
  const router = useRouter()
  const pathname = usePathname()

  const { open, openMobile, isMobile, toggleSidebar } = useSidebar()

  const navItems = [
    { title: 'Overview', url: '/dashboard', icon: DashboardSquare01Icon },
    { title: 'Transactions', url: '/transactions', icon: Exchange01Icon },
    { title: 'Withdrawals', url: '/withdrawals', icon: Wallet01Icon },
  ]

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <Sidebar collapsible="icon" className="overflow-hidden">
      <SidebarHeader className="flex flex-row items-center justify-between pt-2.5">
        <div className="flex flex-row items-center gap-2.5">
          {open ? (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-linear-to-br from-emerald-400 to-emerald-600 shadow-md shadow-emerald-500/30">
              <span className="text-sm font-bold text-white">T</span>
            </div>
          ) : isMobile ? (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-linear-to-br from-emerald-400 to-emerald-600 shadow-md shadow-emerald-500/30">
              <span className="text-sm font-bold text-white">T</span>
            </div>
          ) : (
            <SidebarTrigger />
          )}
          <div className="flex flex-col">
            <span className="text-primary font-heading text-lg font-bold tracking-tight">
              Tradechat
            </span>
            <span className="text-[10px]">Merchant Portal</span>
          </div>
        </div>

        {openMobile ? (
          <Button
            data-sidebar="trigger"
            data-slot="sidebar-trigger"
            variant="ghost"
            size="icon-sm"
            onClick={toggleSidebar}
          >
            <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
          </Button>
        ) : (
          <SidebarTrigger />
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      item.url === '/'
                        ? pathname === '/'
                        : pathname.startsWith(item.url)
                    }
                  >
                    <Link href={item.url}>
                      <HugeiconsIcon icon={item.icon} size={18} />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <HugeiconsIcon icon={Logout01Icon} size={18} />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
