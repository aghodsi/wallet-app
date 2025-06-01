import { createPortfolio } from "~/db/actions";
import type { Route } from "./+types/createPortfolio";

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const portfolioData = JSON.parse(formData.get("portfolio") as string);

  // Call your database or API to create the portfolio

  try {
    const createdPortfolio = await createPortfolio(portfolioData);
    return {
      ok: true,
      data: createdPortfolio,
      action: "createPortfolio",
      error: undefined,
    };
  } catch (err) {
    console.log("Error creating portfolio:", err);
    return {
      ok: false,
      error: "Failed to create portfolio",
      action: "createPortfolio",
      data: null,
    };
  }
}
