import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route("/transactions", "routes/transactions.tsx"),
    route("/createPortfolio", "routes/createPortfolio.tsx"),
    route("/createTransaction", "routes/createTransaction.tsx"),
] satisfies RouteConfig;
