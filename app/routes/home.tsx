import { userPortfolios } from "~/stateManagement/portfolioContext";
import type { Route } from "./+types/home";

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

  console.log("Portfolios from Home:", portfolios);
  if (!portfolios || portfolios.length === 0) {
    return <h1 className="bg-gradient-to-r from-blue-600 via-green-500 to-indigo-400 inline-block text-transparent bg-clip-text">No portfolio. Let's create one.</h1>
  }
  return "Hello World!"
}
