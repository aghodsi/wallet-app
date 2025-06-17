import {
  generateTestData,
  generateTestAssetsOnly,
  generateTestTransactionsForPortfolio,
  TestDataService,
} from "~/services/testDataService";

export async function loader() {
  try {
    const presets = TestDataService.getTestDataPresets();
    const assets = TestDataService.getAvailableAssets();
    
    return {
      success: true,
      data: {
        presets: Object.keys(presets).map(key => ({
          name: key,
          config: presets[key],
          description: getPresetDescription(key)
        })),
        availableAssets: assets,
        actions: [
          {
            name: "generateComplete",
            description: "Generate complete test data with portfolios, assets, and transactions",
            parameters: ["preset (optional): minimal|standard|extensive"]
          },
          {
            name: "generateAssets",
            description: "Generate test assets only",
            parameters: []
          },
          {
            name: "generateTransactions", 
            description: "Generate test transactions for a specific portfolio",
            parameters: ["portfolioId (required)", "count (optional)"]
          },
          {
            name: "generateCustom",
            description: "Generate test data with custom configuration",
            parameters: [
              "portfolioCount (optional)",
              "transactionsPerPortfolio (optional)",
              "includeRecurring (optional): true|false",
              "includeDividends (optional): true|false",
              "startDate (optional): YYYY-MM-DD",
              "endDate (optional): YYYY-MM-DD"
            ]
          }
        ]
      }
    };
  } catch (error) {
    console.error("Error loading test data info:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: "Failed to load test data information" 
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function action({ request }: { request: Request }) {
  try {
    const formData = await request.formData();
    const actionType = formData.get("action") as string;

    switch (actionType) {
      case "generateComplete": {
        const preset = (formData.get("preset") as "minimal" | "standard" | "extensive") || "standard";
        const result = await generateTestData(preset);
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: `Successfully created test data: ${result.portfolios.length} portfolios, ${result.assets.length} assets, ${result.transactions.length} transactions`,
            data: result 
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      case "generateAssets": {
        const result = await generateTestAssetsOnly();
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: `Successfully created ${result.length} test assets`,
            data: { assets: result } 
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      case "generateTransactions": {
        const portfolioId = parseInt(formData.get("portfolioId") as string);
        const count = formData.get("count") ? parseInt(formData.get("count") as string) : undefined;
        
        if (!portfolioId || isNaN(portfolioId)) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              message: "Valid portfolio ID is required" 
            }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        const result = await generateTestTransactionsForPortfolio(portfolioId, count);
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: `Successfully created ${result.length} test transactions for portfolio ${portfolioId}`,
            data: { transactions: result } 
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      case "generateCustom": {
        const portfolioCount = parseInt(formData.get("portfolioCount") as string) || 2;
        const transactionsPerPortfolio = parseInt(formData.get("transactionsPerPortfolio") as string) || 10;
        const includeRecurring = formData.get("includeRecurring") === "true";
        const includeDividends = formData.get("includeDividends") === "true";
        const startDate = formData.get("startDate") ? new Date(formData.get("startDate") as string) : new Date(new Date().getFullYear() - 1, 0, 1);
        const endDate = formData.get("endDate") ? new Date(formData.get("endDate") as string) : new Date();

        const service = new TestDataService({
          portfolioCount,
          transactionsPerPortfolio,
          includeRecurring,
          includeDividends,
          dateRange: { startDate, endDate }
        });

        const result = await service.generateCompleteTestData();
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: `Successfully created custom test data: ${result.portfolios.length} portfolios, ${result.assets.length} assets, ${result.transactions.length} transactions`,
            data: result 
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: "Invalid action specified" 
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("Test data generation error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: `Failed to generate test data: ${error instanceof Error ? error.message : "Unknown error"}` 
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

function getPresetDescription(preset: string): string {
  switch (preset) {
    case "minimal":
      return "Creates 1 portfolio with 5 transactions. No recurring transactions or dividends.";
    case "standard":
      return "Creates 2 portfolios with 15 transactions each. Includes recurring transactions and dividends.";
    case "extensive":
      return "Creates 5 portfolios with 30 transactions each. Includes recurring transactions and dividends.";
    default:
      return "Unknown preset";
  }
}
