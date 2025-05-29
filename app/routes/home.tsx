import { userPortfolios } from "~/stateManagement/portfolioContext";
import type { Route } from "./+types/home";
import { Button } from "~/components/ui/button";
import { useState } from "react";
import { PortfolioCreation } from "~/components/portfolioCreation";

// export function meta({ }: Route.MetaArgs) {
//   return [
//     { title: "New React Router App" },
//     { name: "description", content: "Welcome to React Router!" },
//   ];
// }

export default function Home({
  loaderData,
}: Route.ComponentProps) {
  const portfolios = userPortfolios()
  const [open, setOpen] = useState(false);
  console.log("Portfolios from Home:", portfolios);
  if (!portfolios || portfolios.length === 0) {
    return (<>
    <h1 className="bg-gradient-to-r from-blue-600 via-green-500 to-indigo-400 inline-block text-transparent bg-clip-text">No portfolio. Let's create .</h1>
    <Button variant="link"
      onClick={() => setOpen(true)}>
      one
    </Button>
    <PortfolioCreation open={open} openChange={setOpen} onCreate={(p) => {
      console.log("Portfolio created:", p);
      setOpen(false);
    }} />
    </>);
  }
  return "Hello World!"
}
