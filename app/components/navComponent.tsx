import { memo } from "react"
import { Link, NavLink } from "react-router"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "~/components/ui/sidebar"
import type { MenuItem } from "~/datatypes/menuItem"

type NavComponentProps = {
  items: MenuItem[],
  title: string
}

export const NavComponent = memo(function NavComponent(props: NavComponentProps & { portfolioCount: number }) {
  const { isMobile } = useSidebar()

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>{props.title}</SidebarGroupLabel>
      <SidebarMenu>
        {props.items.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton asChild>
              {item.onClick ? (
                <button 
                  onClick={item.onClick}
                  className={item.needsPortfolio && props.portfolioCount === 0 ? "pointer-events-none opacity-50 text-muted-foreground" : ""}
                  tabIndex={item.needsPortfolio && props.portfolioCount === 0 ? -1 : undefined}
                  disabled={item.needsPortfolio && props.portfolioCount === 0}
                >
                  {item.icon && <item.icon />}
                  <span>{item.name}</span>
                </button>
              ) : item.needsPortfolio && props.portfolioCount === 0 ? (
                <span 
                  className="pointer-events-none opacity-50 text-muted-foreground flex items-center gap-2"
                  tabIndex={-1}
                >
                  {item.icon && <item.icon />}
                  <span>{item.name}</span>
                </span>
              ) : (
                <NavLink 
                  to={item.url!}
                  className={({ isActive }) => 
                    isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""
                  }
                >
                  {item.icon && <item.icon />}
                  <span>{item.name}</span>
                </NavLink>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
});
