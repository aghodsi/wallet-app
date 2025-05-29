import type { Portfolio } from "~/datatypes/portfolio";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { useState } from "react";
import { Input } from "./ui/input";
import { convertTextToIcon, getIcons } from "~/lib/iconHelper"; // Adjust import path as needed
import MultipleSelector from "./ui/multiselect";

type PortfolioCreationProps = {
    open: boolean;
    openChange: (open: boolean) => void;
    onCreate: (p: Portfolio) => void;
}

export function PortfolioCreation(props: PortfolioCreationProps) {
    const [name, setName] = useState("");
    const [currency, setCurrency] = useState("");
    const [symbol, setSymbol] = useState("");
    const [firstCategory, setFirstCategory] = useState(0);
    const [secondCategory, setSecondCategory] = useState(0);

    const icons = getIcons(); // Get available icons

    const handleCreate = () => {
        if (name && currency && symbol) {
            props.onCreate({
                id: Date.now(), // Temporary ID generation
                name,
                currency,
                symbol,
                first_category: firstCategory,
                second_category: secondCategory,
                selected: false,
            });
            props.openChange(false);
        }
    };

    return (
        <Dialog open={props.open} onOpenChange={props.openChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create a new portfolio</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4">
                    <Input
                        type="text"
                        placeholder="Portfolio Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <Input
                        type="text"
                        placeholder="Currency"
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                    />
                    
                    {/* Icon Selection Grid */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Select Icon</label>
                        <div className="grid grid-cols-6 gap-2 p-3 border rounded-md max-h-32 overflow-y-auto">
                            {icons.map((icon) => (
                                <Button
                                    key={icon.name}
                                    type="button"
                                    onClick={() => setSymbol(icon.name)}
                                    className={`p-2 rounded-md border-2 transition-colors `}
                                    variant={symbol === icon.name ? "default" : "secondary"}
                                >
                                    {convertTextToIcon(icon.name, "size-4")}
                                </Button>
                            ))}
                        </div>
                        
                    </div>
                    <MultipleSelector
                        placeholder="Select Categories"
                        maxSelected={}>

                    </MultipleSelector>
                    <Input
                        type="number"
                        placeholder="First Category"
                        value={firstCategory}
                        onChange={(e) => setFirstCategory(Number(e.target.value))}
                    />
                    <Input
                        type="number"
                        placeholder="Second Category"
                        value={secondCategory}
                        onChange={(e) => setSecondCategory(Number(e.target.value))}
                    />
                </div>
                <DialogFooter>
                    <Button onClick={handleCreate}>Create</Button>
                    <Button onClick={() => props.openChange(false)} variant="destructive">Cancel</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}