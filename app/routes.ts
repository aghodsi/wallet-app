import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route("/transactions", "routes/transactions.tsx"),
    route("/createPortfolio", "routes/createPortfolio.tsx"),
    route("/createTransaction", "routes/createTransaction.tsx"),
    route("/portfolio", "routes/portfolio.tsx"),
    route("/searchSymbol", "routes/searchSymbol.tsx"),
    route("/fetchAssetChart", "routes/fetchAssetChart.tsx"),
] satisfies RouteConfig;
