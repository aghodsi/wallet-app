import { 
  createPortfolio, 
  createInstitution, 
  createTransaction,
  fetchCurrencies,
  fetchInstitutions,
  createDefaultCurrencies
} from "~/db/actions";
import type { InstitutionType } from "~/datatypes/institution";
import type { PortfolioType } from "~/datatypes/portfolio";
import type { TransactionType } from "~/datatypes/transaction";
import type { CurrencyType } from "~/datatypes/currency";
import { auth } from "~/lib/auth";

interface GhostfolioExport {
  meta: {
    date: string;
    version: string;
  };
  accounts: Array<{
    balance: number;
    balances?: Array<{
      date: string;
      value: number;
    }>;
    comment: string | null;
    currency: string;
    id: string;
    isExcluded: boolean;
    name: string;
    platformId: string;
  }>;
  platforms: Array<{
    id: string;
    name: string;
    url?: string;
  }>;
  activities: Array<{
    accountId: string;
    comment: string | null;
    fee: number;
    quantity: number;
    type: "BUY" | "SELL" | "DIVIDEND";
    unitPrice: number;
    currency: string;
    dataSource?: string;
    date: string;
    symbol: string;
    tags?: string[];
  }>;
  tags?: string[];
  user: {
    settings: {
      currency: string;
    };
  };
}

export async function action({ request }: { request: Request }) {
  try {
    // Get the authenticated user session
    const session = await auth.api.getSession({
      headers: request.headers
    });

    console.log("Import: Session check", { 
      hasSession: !!session, 
      hasUser: !!session?.user, 
      userId: session?.user?.id 
    });

    if (!session?.user?.id) {
      return {
        success: false,
        message: "Authentication required. Please sign in to import data.",
      };
    }

    const userId = session.user.id;
    console.log("Import: Starting import for userId:", userId);

    const formData = await request.formData();
    const jsonData = formData.get("jsonData") as string;

    if (!jsonData) {
      return {
        success: false,
        message: "No JSON data provided",
      };
    }

    let parsedData: GhostfolioExport;
    try {
      parsedData = JSON.parse(jsonData);
    } catch (error) {
      return {
        success: false,
        message: "Invalid JSON format",
      };
    }

    // Validate required fields
    if (!parsedData.accounts || !parsedData.platforms || !parsedData.activities) {
      return {
        success: false,
        message: "Missing required fields (accounts, platforms, activities)",
      };
    }

    // Fetch existing data to avoid duplicates
    let existingCurrencies = await fetchCurrencies();
    
    // If no currencies exist, create the default ones
    if (existingCurrencies.length === 0) {
      console.log("Import: No currencies found, creating default currencies");
      existingCurrencies = await createDefaultCurrencies();
      console.log("Import: Created default currencies", { count: existingCurrencies.length });
    }
    
    const existingInstitutions = await fetchInstitutions();

    console.log("Import: Existing data", {
      currenciesCount: existingCurrencies.length,
      institutionsCount: existingInstitutions.length,
      accountsToProcess: parsedData.accounts.length,
      activitiesToProcess: parsedData.activities.length
    });

    const stats = {
      portfolios: 0,
      institutions: 0,
      transactions: 0,
    };

    const errors: string[] = [];
    const institutionMap = new Map<string, number>(); // platformId -> institutionId
    const portfolioMap = new Map<string, number>(); // accountId -> portfolioId

    try {
      // Step 1: Create/Map institutions from platforms
      // Mapping: platforms -> institutions
      for (const platform of parsedData.platforms) {
        try {
          // Check if institution already exists by name
          const existingInstitution = existingInstitutions.find(
            inst => inst.name.toLowerCase().trim() === platform.name.toLowerCase().trim()
          );

          if (existingInstitution) {
            institutionMap.set(platform.id, existingInstitution.id);
            console.log(`Using existing institution: ${platform.name} -> ${existingInstitution.id}`);
          } else {
            // Create new institution
            const institutionData: InstitutionType = {
              id: 0, // Will be set by database
              name: platform.name,
              website: platform.url || "",
              isDefault: false,
              apiKey: "",
              apiSecret: "",
              apiUrl: "",
              lastUpdated: new Date().getTime().toString(),
              isNew: false,
            };

            const createdInstitution = await createInstitution(institutionData);
            if (createdInstitution && createdInstitution.length > 0) {
              institutionMap.set(platform.id, createdInstitution[0].id);
              stats.institutions++;
              console.log(`Created new institution: ${platform.name} -> ${createdInstitution[0].id}`);
            } else {
              errors.push(`Failed to create institution: ${platform.name}`);
            }
          }
        } catch (error) {
          errors.push(`Error processing institution ${platform.name}: ${error}`);
        }
      }

      // Step 2: Create portfolios from accounts  
      // Mapping: accounts -> portfolios
      console.log("Import: Starting portfolio creation phase");
      for (const account of parsedData.accounts) {
        try {
          console.log(`Import: Processing account '${account.name}' (currency: ${account.currency}, excluded: ${account.isExcluded})`);
          
          // Skip excluded accounts
          if (account.isExcluded) {
            console.log(`Skipping excluded account: ${account.name}`);
            continue;
          }

          // Find currency by code
          const rawCurrency = existingCurrencies.find(
            curr => curr.code.toUpperCase() === account.currency.toUpperCase()
          );

          console.log(`Import: Currency lookup for '${account.currency}'`, { 
            found: !!rawCurrency, 
            currencyId: rawCurrency?.id 
          });

          if (!rawCurrency) {
            const errorMsg = `Currency '${account.currency}' not found for account '${account.name}'. Please ensure this currency exists in your system.`;
            console.error("Import: " + errorMsg);
            errors.push(errorMsg);
            continue;
          }

          // Convert database currency to type-safe format
          const currency: CurrencyType = {
            id: rawCurrency.id,
            code: rawCurrency.code,
            name: rawCurrency.name,
            symbol: rawCurrency.symbol,
            exchangeRate: rawCurrency.exchangeRate || 1,
            isDefault: rawCurrency.isDefault === 1,
            lastUpdated: rawCurrency.lastUpdated,
          };

          // Get institution for this account
          const institutionId = institutionMap.get(account.platformId);
          console.log(`Import: Institution lookup for platformId '${account.platformId}'`, { 
            found: !!institutionId, 
            institutionId 
          });
          
          if (!institutionId) {
            const errorMsg = `Institution not found for account '${account.name}' (platformId: ${account.platformId})`;
            console.error("Import: " + errorMsg);
            errors.push(errorMsg);
            continue;
          }

          const rawInstitution = existingInstitutions.find(inst => inst.id === institutionId);
          if (!rawInstitution) {
            const errorMsg = `Institution with ID ${institutionId} not found in database`;
            console.error("Import: " + errorMsg);
            errors.push(errorMsg);
            continue;
          }

          // Convert database institution to type-safe format
          const institution: InstitutionType = {
            id: rawInstitution.id,
            name: rawInstitution.name,
            isDefault: rawInstitution.isDefault === 1,
            website: rawInstitution.website || "",
            apiKey: rawInstitution.apiKey || "",
            apiSecret: rawInstitution.apiSecret || "",
            apiUrl: rawInstitution.apiUrl || "",
            lastUpdated: rawInstitution.lastUpdated || new Date().getTime().toString(),
            isNew: false,
          };

          // Create portfolio data mapping account fields
          const portfolioData: PortfolioType = {
            id: 0, // Will be set by database
            name: account.name,
            currency: currency,
            symbol: "", // Ghostfolio accounts don't have symbols
            type: "Investment", // Default type, could be enhanced based on account name patterns
            institution: institution,
            createdAt: new Date().getTime().toString(),
            tags: account.comment || "", // Map comment to tags
            cashBalance: account.balance,
            selected: false,
          };

          console.log(`Import: About to create portfolio for '${account.name}'`, {
            portfolioData: {
              name: portfolioData.name,
              currencyId: portfolioData.currency.id,
              institutionId: portfolioData.institution.id,
              type: portfolioData.type
            },
            userId
          });

          const createdPortfolio = await createPortfolio(portfolioData, userId);
          console.log(`Import: Portfolio creation result for '${account.name}'`, {
            success: !!createdPortfolio,
            length: createdPortfolio?.length,
            portfolioId: createdPortfolio?.[0]?.id
          });

          if (createdPortfolio && createdPortfolio.length > 0) {
            portfolioMap.set(account.id, createdPortfolio[0].id);
            stats.portfolios++;
            console.log(`Created portfolio: ${account.name} -> ${createdPortfolio[0].id}`);
          } else {
            const errorMsg = `Failed to create portfolio: ${account.name}`;
            console.error("Import: " + errorMsg);
            errors.push(errorMsg);
          }
        } catch (error) {
          const errorMsg = `Error creating portfolio ${account.name}: ${error}`;
          console.error("Import: " + errorMsg);
          errors.push(errorMsg);
        }
      }

      // Step 3: Create transactions from activities
      // Mapping: activities -> transactions
      console.log("Import: Starting transaction creation phase", {
        totalActivities: parsedData.activities.length,
        portfoliosCreated: stats.portfolios,
        portfolioMapSize: portfolioMap.size
      });

      for (const activity of parsedData.activities) {
        try {
          const portfolioId = portfolioMap.get(activity.accountId);
          console.log(`Import: Processing transaction for symbol '${activity.symbol}'`, {
            accountId: activity.accountId,
            portfolioId,
            hasPortfolio: !!portfolioId
          });

          if (!portfolioId) {
            const errorMsg = `Portfolio not found for activity with symbol ${activity.symbol} (accountId: ${activity.accountId})`;
            console.error("Import: " + errorMsg);
            errors.push(errorMsg);
            continue;
          }

          // Map transaction types from Ghostfolio to your schema
          const transactionType = activity.type === "BUY" ? "Buy" : 
                                 activity.type === "SELL" ? "Sell" : 
                                 "Dividend";

          // Create transaction with comprehensive field mapping
          const transactionData: TransactionType = {
            id: 0, // Will be set by database
            portfolioId: portfolioId,
            date: new Date(activity.date).getTime().toString(),
            type: transactionType as "Buy" | "Sell" | "Dividend",
            asset: {
              symbol: activity.symbol,
              isFetchedFromApi: activity.dataSource === "YAHOO", // Map dataSource to isFetchedFromApi
            },
            quantity: activity.quantity, // Keep as decimal number (database uses double type)
            price: activity.unitPrice,
            commision: activity.fee || 0, // Map fee to commission
            tax: 0, // Ghostfolio doesn't separate tax, it's included in fee
            tags: activity.tags?.join(", ") || "", // Convert tags array to string
            notes: activity.comment || "", // Map comment to notes
            recurrence: "", // Ghostfolio doesn't have recurring transactions
          };

          console.log(`Import: About to create transaction`, {
            symbol: activity.symbol,
            type: activity.type,
            portfolioId,
            quantity: activity.quantity,
            price: activity.unitPrice
          });

          await createTransaction(transactionData);
          stats.transactions++;
          console.log(`Created transaction: ${activity.type} ${activity.quantity} ${activity.symbol} @ ${activity.unitPrice}`);
        } catch (error) {
          const errorMsg = `Error creating transaction for ${activity.symbol}: ${error}`;
          console.error("Import: " + errorMsg);
          errors.push(errorMsg);
        }
      }

      console.log("Import: Final import statistics", {
        stats,
        errorsCount: errors.length,
        errors: errors.length > 0 ? errors : "No errors"
      });

      return {
        success: true,
        message: "Import completed successfully",
        imported: stats,
        errors: errors.length > 0 ? errors : undefined,
      };

    } catch (error) {
      console.error("Import error:", error);
      return {
        success: false,
        message: `Import failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        errors: errors.length > 0 ? errors : undefined,
      };
    }

  } catch (error) {
    console.error("API import error:", error);
    return {
      success: false,
      message: `Server error: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}
