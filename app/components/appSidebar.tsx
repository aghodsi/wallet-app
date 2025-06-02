import * as React from "react"
import {
  ArrowRightLeft,
  ChartNoAxesCombined,
  FolderPlus,
  Plus,
  Settings2,
} from "lucide-react"

import { NavComponent } from "~/components/navComponent"
import { NavUser } from "~/components/nav-user"
import { PortfolioSwitcher } from "~/components/portfolioSwitcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "~/components/ui/sidebar"
import { NavComponentCollapsable } from "./navComponentCollapsable"
import { userPortfolios } from "~/stateManagement/portfolioContext"
import { ne } from "drizzle-orm"

const data = {
  user: {
    name: "Arya",
    email: "me@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  actions: [
    {
      name: "Create Portfolio",
      url: "/?action=createPortfolio",
      icon: FolderPlus,
      needsPortfolio: false,
    },
    {
      name: "Add Transaction",
      url: "/?action=createTransaction",
      icon: Plus,
      needsPortfolio: true,
    },
  ],
  navItems: [
    {
      name: "Overview",
      url: "/portfolio",
      icon: ChartNoAxesCombined,
      needsPortfolio: true,
    },
    {
      name: "Transaction",
      url: "#",
      icon: ArrowRightLeft,
      needsPortfolio: true,
    },
  ],
  settingsNavItems: [{
    title: "Settings",
    url: "#",
    icon: Settings2,
    items: [
      {
        name: "Portfolio Settings",
        url: "#",
        needsPortfolio: true,
      },
      {
        name: "Currency Settings",
        url: "#",
        needsPortfolio: false,
      },
      // {
      //   title: "Data API Settings",
      //   url: "#"
      // }
    ],
  }]
}


export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const portfolios = userPortfolios();
  const [actions, setActions] = React.useState(data.actions);
  const [navItems, setNavItems] = React.useState(data.navItems);
  const [settingsNavItems, setSettingsNavItems] = React.useState(data.settingsNavItems);



  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <PortfolioSwitcher portfolios={portfolios} />
      </SidebarHeader>
      <SidebarContent>
        <NavComponent items={data.actions} title={"Actions"} />
        <NavComponent items={data.navItems} title={"Main"} />
        <NavComponentCollapsable items={data.settingsNavItems} title={"Configuration"} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
