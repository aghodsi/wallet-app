import { updateCurrency, updateCurrencyExchangeRates, updateUserDefaultCurrency } from "~/db/actions";
import { withAuth } from "~/lib/auth-middleware";

export async function action({ request }: { request: Request }) {
  return withAuth(request, async (authData) => {
    try {
      const formData = await request.formData();
      const action = formData.get("action") as string;

      if (action === "setDefaultCurrency") {
        const currencyId = parseInt(formData.get("currencyId") as string);
        
        // Update the global default currency
        await updateCurrency(currencyId, { isDefault: true });
        
        // Update the user's default currency
        await updateUserDefaultCurrency(authData.user.id, currencyId);
        
        return { success: true, action: "setDefaultCurrency" };
      }

      if (action === "updateExchangeRates") {
        const exchangeRatesData = formData.get("exchangeRates") as string;
        const exchangeRates = JSON.parse(exchangeRatesData);
        
        await updateCurrencyExchangeRates(exchangeRates);
        
        return { success: true, action: "updateExchangeRates" };
      }

      return { error: { message: "Invalid action" } };
    } catch (error) {
      console.error("Error in currency API:", error);
      return { 
        error: { 
          message: error instanceof Error ? error.message : "Unknown error occurred" 
        } 
      };
    }
  });
}
