import * as React from "react";
import { memo, useEffect } from "react";
import { ChevronsUpDown, Plus } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "~/components/ui/sidebar";
import type { PortfolioType } from "~/datatypes/portfolio";
import { convertTextToIcon } from "~/lib/iconHelper";
import { usePortfolioDispatch } from "~/stateManagement/portfolioContext";
import { useIsMac } from "~/hooks/useIsMac";
import { useDialogContext } from "~/contexts/transactionDialogContext";

export const PortfolioSwitcher = memo(function PortfolioSwitcher({
  portfolios,
}: {
  portfolios: PortfolioType[];
}) {
  const isMac = useIsMac();
  const { isMobile } = useSidebar();
  const portfolioDispatch = usePortfolioDispatch();
  const { openPortfolioDialog } = useDialogContext();
  
  // Get active portfolio directly from context state
  const activePortfolio = React.useMemo(() => 
    portfolios.find((p) => p.selected) || portfolios.find(p => p.id === -1),
    [portfolios]
  );
  


  
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const numbersArray = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
      if (e.key in numbersArray && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        
        const index = Number.parseInt(e.key, 10) - 1;
        if (index >= 0 && index < portfolios.length) {
          const selectedPortfolio = portfolios[index];
          portfolioDispatch({
            type: "selected",
            portfolio: selectedPortfolio,
          });
        }
      }
    };
    
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [portfolios, portfolioDispatch]);
  
  if (!activePortfolio) {
    return null;
  }
  
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                {convertTextToIcon(activePortfolio.symbol, "size-4")}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {activePortfolio.name} ({activePortfolio.currency.symbol})
                </span>
                <span className="truncate text-xs">{activePortfolio.tags}</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Portfolios
            </DropdownMenuLabel>
            {portfolios.map((portfolio, index) => (
              <DropdownMenuItem
                key={portfolio.id}
                onClick={() => {
                  portfolioDispatch({
                    type: "selected",
                    portfolio: portfolio,
                  });
                }}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-md border">
                  {convertTextToIcon(portfolio.symbol, "size-3.5 shrink-0")}
                </div>
                {portfolio.name}
                {index < 9 && (
                  <DropdownMenuShortcut>
                    {isMac ? "⌘" : "ctrl"}
                    {index + 1}
                  </DropdownMenuShortcut>
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="gap-2 p-2 cursor-pointer"
              onClick={openPortfolioDialog}
            >
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <Plus className="size-4" />
              </div>
              <span className="text-muted-foreground font-medium">Add Portfolio</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
});
