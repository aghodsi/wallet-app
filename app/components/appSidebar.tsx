import * as React from "react"
import {
  ArrowRightLeft,
  AudioWaveform,
  ChartNoAxesCombined,
  Command,
  FolderPlus,
  GalleryVerticalEnd,
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
import type { Portfolio } from "~/datatypes/portfolio"
import { NavComponentCollapsable } from "./navComponentCollapsable"

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "All Portfolios",
      logo: GalleryVerticalEnd,
      plan: "All",
    },
    {
      name: "Mina",
      logo: AudioWaveform,
      plan: "Child",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Fun",
    },
  ],
  // navMain: [
  //   {
  //     name: "Create Portfolio",
  //     url: "#",
  //     icon: Frame,
  //   },
  //   {
  //     name: "Add Transaction",
  //     url: "#",
  //     icon: ArrowLeftRightIcon,
  //   },
  //   {
  //     name: "Travel",
  //     url: "#",
  //     icon: Map,
  //   },
  //   // {
  //   //   title: "Actions",
  //   //   url: "#",
  //   //   icon: SquareTerminal,
  //   //   isActive: true,
  //   //   items: [
  //   //     {
  //   //       title: "History",
  //   //       url: "#",
  //   //     },
  //   //     {
  //   //       title: "Starred",
  //   //       url: "#",
  //   //     },
  //   //     {
  //   //       title: "Settings",
  //   //       url: "#",
  //   //     },
  //   //   ],
  //   // },
  //   // {
  //   //   title: "Models",
  //   //   url: "#",
  //   //   icon: Bot,
  //   //   items: [
  //   //     {
  //   //       title: "Genesis",
  //   //       url: "#",
  //   //     },
  //   //     {
  //   //       title: "Explorer",
  //   //       url: "#",
  //   //     },
  //   //     {
  //   //       title: "Quantum",
  //   //       url: "#",
  //   //     },
  //   //   ],
  //   // },
  //   // {
  //   //   title: "Documentation",
  //   //   url: "#",
  //   //   icon: BookOpen,
  //   //   items: [
  //   //     {
  //   //       title: "Introduction",
  //   //       url: "#",
  //   //     },
  //   //     {
  //   //       title: "Get Started",
  //   //       url: "#",
  //   //     },
  //   //     {
  //   //       title: "Tutorials",
  //   //       url: "#",
  //   //     },
  //   //     {
  //   //       title: "Changelog",
  //   //       url: "#",
  //   //     },
  //   //   ],
  //   // },
  //   // {
  //   //   title: "Settings",
  //   //   url: "#",
  //   //   icon: Settings2,
  //   //   items: [
  //   //     {
  //   //       title: "General",
  //   //       url: "#",
  //   //     },
  //   //     {
  //   //       title: "Team",
  //   //       url: "#",
  //   //     },
  //   //     {
  //   //       title: "Billing",
  //   //       url: "#",
  //   //     },
  //   //     {
  //   //       title: "Limits",
  //   //       url: "#",
  //   //     },
  //   //   ],
  //   // },
  // ],
  actions: [
    {
      name: "Create Portfolio",
      url: "#",
      icon: FolderPlus,
    },
    {
      name: "Add Transaction",
      url: "#",
      icon: Plus,
    },
  ],
  navItems: [
    {
      name: "Overview",
      url: "#",
      icon: ChartNoAxesCombined,
    },
    {
      name: "Transaction",
      url: "#",
      icon: ArrowRightLeft,
    },
  ],
   settingsNavItems: [{
      title: "Settings",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "Portfolio Settings",
          url: "#",
        },
        {
          title: "Currency Settings",
          url: "#",
        },
        {
          title: "Data API Settings",
          url: "#",
        }
      ],
    }]
}

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  portfolios?: Portfolio[];
};

export function AppSidebar({ portfolios, ...props }: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        {/* //fix */}
        {/* <PortfolioSwitcher portfolios={portfolios} /> */}
        <PortfolioSwitcher portfolios={data.teams} />
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
