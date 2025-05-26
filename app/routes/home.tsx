import { fetchPortfolios } from "~/db/fetcher";
import type { Route } from "./+types/home";
import Page from "../components/_sidebar_layout";
import { CommandComponent } from "~/components/command-component";
import SidebarLayout from "../components/_sidebar_layout";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export async function loader({ params }: Route.LoaderArgs) {
  const portfolios = await fetchPortfolios();
  return { portfolios };
}

export default function Home({
  loaderData,
}: Route.ComponentProps) {
  const portfolios  = loaderData.portfolios;

  console.log("Portfolios:", portfolios);
  // if (!portfolios || portfolios.length === 0) {
  //   // create a new portfolio
  //   return <CommandComponent portfoliosNumber={portfolios.length} />;
  //   // return <h1 className="bg-gradient-to-r from-blue-600 via-green-500 to-indigo-400 inline-block text-transparent bg-clip-text">No portfolio. Let's create one.</h1>
  // }
  return "Hello World!";
}
