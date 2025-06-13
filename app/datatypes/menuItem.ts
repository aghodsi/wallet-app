import type { LucideIcon } from "lucide-react";

export type MenuItem = {
    name: string,
    url?: string,
    icon?: LucideIcon,
    needsPortfolio?: boolean,
    onClick?: () => void
}
