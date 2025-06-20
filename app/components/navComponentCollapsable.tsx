"use client"

import { ChevronRight, type LucideIcon } from "lucide-react"
import { NavLink } from "react-router"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "~/components/ui/sidebar"
import type { MenuItem } from "~/datatypes/menuItem"
import { userPortfolios } from "~/stateManagement/portfolioContext"


type NavComponentCollapsableProps = {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    items?: MenuItem[]
  }[],
  title: string

}

export function NavComponentCollapsable(props: NavComponentCollapsableProps) {
  const portfolios = userPortfolios();
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{props.title}</SidebarGroupLabel>
      <SidebarMenu>
        {props.items.map((item) => (
          <Collapsible
            key={item.title}
            asChild
            defaultOpen={item.isActive}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip={item.title}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.items?.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.name}>
                      <SidebarMenuSubButton asChild>
                        {subItem.needsPortfolio && portfolios.length === 0 ? (
                          <span 
                            className="pointer-events-none opacity-50 text-muted-foreground flex items-center gap-2"
                            tabIndex={-1}
                          >
                            <span>{subItem.name}</span>
                          </span>
                        ) : (
                          <NavLink 
                            to={subItem.url!}
                            className={({ isActive }) => 
                              isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""
                            }
                          >
                            <span>{subItem.name}</span>
                          </NavLink>
                        )}
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
