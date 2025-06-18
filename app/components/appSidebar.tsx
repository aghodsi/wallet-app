import * as React from "react"
import {
  ArrowRightLeft,
  ChartNoAxesCombined,
  Clock,
  Currency,
  FolderPlus,
  Home,
  Import,
  Plus,
  Settings,
  Settings2,
  Wallet,
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
import { useDialogContext } from "~/contexts/transactionDialogContext"

const data = {
  user: {
    name: "Arya",
    email: "me@example.com",
    avatar: "/snitch.svg",
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
      name: "Home",
      url: "/",
      icon: Home,
      needsPortfolio: false,
    },
    {
      name: "Portfolio Overview",
      url: "/portfolio",
      icon: ChartNoAxesCombined,
      needsPortfolio: true,
    },
    {
      name: "Transaction",
      url: "/transactions",
      icon: ArrowRightLeft,
      needsPortfolio: true,
    },
  ],
  settingsNavItems: [


    {
      name: "Portfolio Settings",
      url: "/portfolio-settings",
      icon: Settings,
      needsPortfolio: true,
    },
    {
      name: "Currency Settings",
      url: "/currency-settings",
      icon: Currency,
      needsPortfolio: false,
    },
    {
      name: "Recurring Transactions",
      url: "/recurring-transactions",
      icon: Clock,
      needsPortfolio: true,
    },
    {
      name: "Import",
      url: "/import",
      icon: Import,
      needsPortfolio: false,
    }

  ],
  // settingsNavItems: [{
  //   title: "Settings",
  //   url: "#",
  //   icon: Settings2,
  //   items: [
  //     {
  //       name: "Portfolio Settings",
  //       url: "#",
  //       needsPortfolio: true,
  //     },
  //     {
  //       name: "Currency Settings",
  //       url: "#",
  //       needsPortfolio: false,
  //     },
  //     {
  //       name: "Recurring",
  //       url: "/recurring-transactions",
  //       icon: Clock,
  //       needsPortfolio: true,
  //     }
  //   ],
  // }]
}


export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const portfolios = userPortfolios();
  const { openTransactionDialog, openPortfolioDialog } = useDialogContext();
  const [actions, setActions] = React.useState(data.actions);
  const [navItems, setNavItems] = React.useState(data.navItems);
  const [settingsNavItems, setSettingsNavItems] = React.useState(data.settingsNavItems);

  // Create modified actions with dialog handlers
  const modifiedActions = React.useMemo(() => {
    return data.actions.map(action => {
      if (action.name === "Add Transaction") {
        return {
          ...action,
          onClick: openTransactionDialog,
          url: undefined
        };
      }
      if (action.name === "Create Portfolio") {
        return {
          ...action,
          onClick: openPortfolioDialog,
          url: undefined
        };
      }
      return action;
    });
  }, [openTransactionDialog, openPortfolioDialog]);



  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <PortfolioSwitcher portfolios={portfolios} />
      </SidebarHeader>
      <SidebarContent>
        <NavComponent items={modifiedActions} title={"Actions"} />
        <NavComponent items={data.navItems} title={"Main"} />
        <NavComponent items={data.settingsNavItems} title={"Configuration"} />
        {/* <NavComponentCollapsable items={data.settingsNavItems} title={"Configuration"} /> */}
      </SidebarContent>
      <SidebarFooter>
        {/* <NavUser user={data.user} /> */}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
