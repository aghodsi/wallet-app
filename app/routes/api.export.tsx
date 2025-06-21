import { fetchPortfolios, fetchAllTransactions, fetchInstitutions } from "~/db/actions";
import { auth } from "~/lib/auth";

export const loader = async ({ request }: { request: Request }) => {
  const session = await auth.api.getSession({
    headers: request.headers,
  });
  const userId = session?.user?.id;
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Fetch portfolios, transactions, institutions
  const portfoliosRaw = await fetchPortfolios(userId);
  const portfolios = (portfoliosRaw || []).filter((p: any) => p.name !== "All");
  const transactions = await fetchAllTransactions(userId);
  const institutions = await fetchInstitutions();

  // Only include institutions referenced by user's portfolios
  const institutionIds = new Set(portfolios.map((p: any) => p.institution?.id).filter(Boolean));
  const filteredInstitutions = institutions.filter((i: any) => institutionIds.has(i.id));

  // Prepare export data
  const exportData = {
    portfolios,
    transactions,
    institutions: filteredInstitutions,
  };

  return new Response(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=120, stale-while-revalidate=120",
      "Content-Disposition": "attachment; filename=wallet-data.json",
    },
  });
};
