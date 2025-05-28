import { Baby, GalleryVerticalEnd, GraduationCap, LifeBuoy, PiggyBank, RockingChair, ShoppingCart, Wallet, type LucideIcon } from "lucide-react";
import type { L } from "node_modules/react-router/dist/development/route-data-WyrduLgj.mjs";



export function convertTextToIcon(text: string, classes: string) {
    switch (text) {
        //all
        case "GalleryVerticalEnd":
            return <GalleryVerticalEnd className={classes} />;
        //emergency
        case "LifeBuoy":
            return <LifeBuoy className={classes} />;
        //education
        case "GraduationCap":
            return <GraduationCap className={classes} />;
        // big purchase
        case "ShoppingCart":
            return <ShoppingCart className={classes} />;
        // retirement
        case "RockingChair":
            return <RockingChair className={classes} />;
        // children
        case "Baby":
            return <Baby className={classes} />;
        // savings
        case "PiggyBank":
            return <PiggyBank className={classes} />;
        default:
            return <Wallet className={classes} />;
    }
}

export function getIcons() {
    return [
        { description: "Emergency Fund", icon: LifeBuoy, name: "LifeBuoy", default: false },
        { description: "Education", icon: GraduationCap, name: "GraduationCap", default: false },
        { description: "Major Purchases", icon: ShoppingCart, name: "ShoppingCart", default: false },
        { description: "Retirement", icon: RockingChair, name: "RockingChair", default: false },
        { description: "Children and Family", icon: Baby, name: "Baby", default: false },
        { description: "Saving", icon: PiggyBank, name: "PiggyBank", default: false },
        { description: "Wallet", icon: Wallet, name: "Wallet", default: true },
    ];
}