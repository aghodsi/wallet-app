import { Baby, Currency, DollarSign, Euro, GalleryVerticalEnd, GraduationCap, IndianRupee, JapaneseYen, LifeBuoy, PhilippinePeso, PiggyBank, PoundSterling, RockingChair, RussianRuble, SaudiRiyal, ShoppingCart, SwissFranc, Wallet, type LucideIcon } from "lucide-react";


export function convertCurrencyToIcon(currency: string, classes: string = "", size: number = 16): LucideIcon {
    switch (currency) {
        case "EUR":
            // return Euro; <Euro className={classes} size={size}/>
            return Euro;
        case "USD":
            // return <DollarSign className={classes} size={size}/>
            return DollarSign;
        case "GBP":
            // return <PoundSterling className={classes} size={size} />
            return PoundSterling;
        case "JPY":
            // return <JapaneseYen className={classes} size={size} />
            return JapaneseYen;
        case "RUB":
            // return <RussianRuble className={classes} size={size} />
            return RussianRuble;
        case "INR":
            // return <IndianRupee className={classes} size={size} />
            return IndianRupee;
        case "PHP":
            // return <PhilippinePeso className={classes} size={size} />
            return PhilippinePeso;
        case "CHF":
            // return <SwissFranc className={classes} size={size} />
            return SwissFranc;
        case "SAR":
            // return <SaudiRiyal className={classes} size={size} />
            return SaudiRiyal;
        default:
            // return <Currency className={classes} size={size} />
            return Currency;
    }

}

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