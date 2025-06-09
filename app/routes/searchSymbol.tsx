import { searchSymbol } from "~/api/fetcherYahoo";
import type { Route } from "../+types/searchSymbol";

export async function loader({ request }: Route.LoaderArgs) {
  let url = new URL(request.url);
  let query = url.searchParams.get("q");
  console.log("Search query:", query);
  return searchSymbol(query || "");
}
