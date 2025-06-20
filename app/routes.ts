import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route("/transactions", "routes/transactions.tsx"),
    route("/assets", "routes/assets.tsx"),
    route("/recurringTransactions", "routes/recurringTransactions.tsx"),
    route("/createPortfolio", "routes/createPortfolio.tsx"),
    route("/portfolio", "routes/portfolio.tsx"),
    route("/portfolioSettings", "routes/portfolioSettings.tsx"),
    route("/currencySettings", "routes/currencySettings.tsx"),
    route("/assetsConfiguration", "routes/assetsConfiguration.tsx"),
    route("/import", "routes/import.tsx"),
    route("/searchSymbol", "routes/searchSymbol.tsx"),
    route("/fetchAssetChart", "routes/fetchAssetChart.tsx"),
    route("/api/transactions/:id?", "routes/api.transactions.tsx"),
    route("/api/currencies", "routes/api.currencies.tsx"),
    route("/api/import", "routes/api.import.tsx"),
    route("/api/auth/*", "routes/api.auth.$.tsx"),
] satisfies RouteConfig;
