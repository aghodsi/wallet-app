import { fetchPortfolios, fetchDefaultCurrency } from "~/db/actions";
import { withAuth } from "~/lib/auth-middleware";
import type { Route } from "./+types/api.portfolios";

export async function loader({ request, params }: Route.LoaderArgs) {
  return withAuth(request, async (authData) => {
    try {
      const portfoliosWithRelations = await fetchPortfolios(authData.user.id);
      
      // Also fetch default currency for the "All" portfolio
      const defaultCurrencyRow = await fetchDefaultCurrency();
      
      return {
        portfolios: portfoliosWithRelations,
        defaultCurrency: defaultCurrencyRow[0] || null
      };
    } catch (error) {
      console.error('Failed to fetch portfolios:', error);
      return new Response(
        JSON.stringify({ error: "Failed to fetch portfolios" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  });
}
