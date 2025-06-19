import { auth } from "~/lib/auth";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";

// Handle GET requests (session, user info, etc.)
export async function loader({ request }: LoaderFunctionArgs) {
  console.log(`Auth GET request: ${request.method} ${request.url}`);
  return auth.handler(request);
}

// Handle POST/PUT/DELETE requests (sign-in, sign-up, sign-out, etc.)
export async function action({ request }: ActionFunctionArgs) {
  console.log(`Auth ${request.method} request: ${request.url}`);
  return auth.handler(request);
}
