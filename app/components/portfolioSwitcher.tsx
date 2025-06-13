import * as React from "react";
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
import { useEffect, useState } from "react";
import { useIsMac } from "~/hooks/useIsMac";

export function PortfolioSwitcher({
  portfolios,
}: {
  portfolios: PortfolioType[];
}) {
  const { isMobile } = useSidebar();
  const portfolioDispatch = usePortfolioDispatch();
  const [activePortfolio, setActivePortfolio] = useState(
    portfolios.find((p) => p.selected) || null
  );

  const isMac = useIsMac();
  

  if (!activePortfolio) {
    return null;
  }

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const numbersArray = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
      if (e.key in numbersArray && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        
        const index = Number.parseInt(e.key, 10) - 1; // Convert key to index (0-8)
        if (index >= 0 && index < portfolios.length) {
          const selectedPortfolio = portfolios[index];
          setActivePortfolio(selectedPortfolio);
          portfolioDispatch({
            type: "selected",
            portfolio: selectedPortfolio,
          });
        }
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

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
                key={portfolio.name}
                onClick={() => {
                  setActivePortfolio(portfolio);
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
            <DropdownMenuItem className="gap-2 p-2">
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <Plus className="size-4" />
              </div>

              <div>
                <a
                  href="/?action=createPortfolio"
                  className="text-muted-foreground font-medium"
                >
                  <span>Add Portfolio</span>
                </a>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
