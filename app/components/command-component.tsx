import {
    ArrowLeftRight,
    Settings,
    SquarePlus,
} from "lucide-react"

import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from "./ui/command"

type portfolioProps = {
    portfoliosNumber: number,
}

export function CommandComponent(portfolioProps: portfolioProps) {
    return (
        <Command className="rounded-lg border shadow-md md:min-w-[450px]">
            <CommandInput placeholder="Type a command or search..." />
            <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup heading="Common Tasks">
                    <CommandItem>
                        <SquarePlus />
                        <span>Create Portfolio</span>
                    </CommandItem>
                    <CommandItem disabled={portfolioProps.portfoliosNumber === 0}>
                        <ArrowLeftRight />
                        <span>Add Transaction</span>
                    </CommandItem>
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup heading="Settings">
                    <CommandItem>
                        <Settings />
                        <span>Settings</span>
                        <CommandShortcut>⌘S</CommandShortcut>
                    </CommandItem>
                </CommandGroup>
            </CommandList>
        </Command>
    )
}
