import * as React from "react"
import {
  ArrowRightLeft,
  ChartNoAxesCombined,
  Clock,
  Currency,
  Database,
  FolderPlus,
  Home,
  Import,
  Plus,
  Settings,
  Settings2,
  TrendingUp,
  TrendingUpDown,
  Wallet,
  WalletCards,
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
import { DataFreshnessIndicator } from "./dataFreshnessIndicator"
import { TimezoneSelector } from "./timezoneSelector"
import { useAuth } from "~/contexts/authContext"

const data = {
  user: {
    name: "Arya",
    email: "me@example.com",
    avatar: "/snitch.svg",
  },
  home: [
    {
      name: "Home",
      url: "/",
      icon: Home,
      needsPortfolio: false,
    },
  ],
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
      name: "Portfolio Overview",
      url: "/portfolio",
      icon: ChartNoAxesCombined,
      needsPortfolio: true,
    },
    {
      name: "Assets",
      url: "/assets",
      icon: TrendingUp,
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
      url: "/portfolioSettings",
      icon: Settings,
      needsPortfolio: true,
    },
    {
      name: "Currency Settings",
      url: "/currencySettings",
      icon: Currency,
      needsPortfolio: false,
    },
    {
      name: "Assets Configuration",
      url: "/assetsConfiguration",
      icon: Database,
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
}


export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const portfolios = userPortfolios();
  const { openTransactionDialog, openPortfolioDialog } = useDialogContext();
  const { user } = useAuth();
  
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
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1">
          <Wallet className="h-6 w-6 text-primary" />
          <span className="font-semibold text-lg">Wallet Manager</span>
        </div>
        {user && <PortfolioSwitcher portfolios={portfolios} />}
      </SidebarHeader>
      <SidebarContent>
        <NavComponent items={data.home} title={""} />
        {user && <NavComponent items={modifiedActions} title={"Actions"} />}
        {user && <NavComponent items={data.navItems} title={"Portfolio Activity"} />}
        {user && <NavComponent items={data.settingsNavItems} title={"Configuration"} />}
        {/* <NavComponentCollapsable items={data.settingsNavItems} title={"Configuration"} /> */}
      </SidebarContent>
      <SidebarFooter>
        <TimezoneSelector />
        <DataFreshnessIndicator />
        {user && <NavUser />}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
