import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route("/transactions", "routes/transactions.tsx"),
    route("/recurring-transactions", "routes/recurringTransactions.tsx"),
    route("/createPortfolio", "routes/createPortfolio.tsx"),
    route("/portfolio", "routes/portfolio.tsx"),
    route("/portfolio-settings", "routes/portfolioSettings.tsx"),
    route("/currency-settings", "routes/currencySettings.tsx"),
    route("/searchSymbol", "routes/searchSymbol.tsx"),
    route("/fetchAssetChart", "routes/fetchAssetChart.tsx"),
    route("/calendar-test", "routes/calendar-test.tsx"),
    route("/test-data", "routes/test-data.tsx"),
    route("/api/transactions/:id?", "routes/api.transactions.tsx"),
    route("/api/currencies", "routes/api.currencies.tsx"),
    route("/api/testData", "routes/api.testData.tsx"),
] satisfies RouteConfig;
