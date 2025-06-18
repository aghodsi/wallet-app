import { createPortfolio, updatePortfolio } from "~/db/actions";
import type { Route } from "./+types/createPortfolio";

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const portfolioData = JSON.parse(formData.get("portfolio") as string);
  const method = request.method;
  const portfolioId = formData.get("portfolioId");

  try {
    if (method === "PUT" && portfolioId) {
      // Update existing portfolio
      const updatedPortfolio = await updatePortfolio(Number(portfolioId), portfolioData);
      return {
        ok: true,
        id: updatedPortfolio[0].id,
        action: "updatePortfolio",
        error: undefined,
      };
    } else {
      // Create new portfolio
      console.log("Creating new portfolio with data:", portfolioData);
      const createdPortfolio = await createPortfolio(portfolioData);
      return {
        ok: true,
        id: createdPortfolio[0].id,
        action: "createPortfolio",
        error: undefined,
      };
    }
  } catch (err) {
    console.log(`Error ${method === "PUT" ? "updating" : "creating"} portfolio:`, err);
    return {
      ok: false,
      error: `Failed to ${method === "PUT" ? "update" : "create"} portfolio`,
      action: method === "PUT" ? "updatePortfolio" : "createPortfolio",
      data: null,
    };
  }
}
