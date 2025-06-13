import { AppSidebar } from "~/components/appSidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/components/ui/sidebar"
import { SearchComponent } from "./searchComponent"

export default function SidebarLayout({children} : {children: React.ReactNode}) {
  return (
    <SidebarProvider>
      <AppSidebar/>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center justify-between w-full px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex-1 flex justify-center max-w-md mx-auto">
              <SearchComponent /> 
            </div>
            <div className="w-8"></div> {/* Spacer to balance the SidebarTrigger */}
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
