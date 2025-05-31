
import {c } from "~/db/function";
import type { Route } from "./+types/createPortfolio";

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const portfolioData = JSON.parse(formData.get("portfolio") as string);

  // Call your database or API to create the portfolio
  const createdPortfolio = await createPortfolio(portfolioData);

  return createdPortfolio;
}