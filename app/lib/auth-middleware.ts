import { auth } from "~/lib/auth";

export interface AuthenticatedRequest {
  user: any; // Better Auth user type
  session: any; // Better Auth session type
}

/**
 * Validates the session from the request and returns user data
 * Throws an error if the session is invalid or expired
 */
export async function validateSession(request: Request): Promise<AuthenticatedRequest> {
  try {
    // Create a new request for session validation
    const sessionRequest = new Request(new URL("/api/auth/get-session", request.url), {
      method: "GET",
      headers: request.headers,
    });

    // Use Better Auth's handler to validate the session
    const response = await auth.handler(sessionRequest);
    
    if (response.status !== 200) {
      throw new Error("No valid session");
    }

    const sessionData = await response.json();
    
    if (!sessionData?.user) {
      throw new Error("Invalid session data");
    }

    return {
      user: sessionData.user,
      session: sessionData.session || sessionData,
    };
  } catch (error) {
    console.error("Session validation failed:", error);
    throw new Error("Unauthorized: Invalid or expired session");
  }
}

/**
 * Middleware function that validates authentication and returns standardized error responses
 */
export async function withAuth<T>(
  request: Request,
  handler: (authData: AuthenticatedRequest) => Promise<T>
): Promise<T | Response> {
  try {
    const authData = await validateSession(request);
    return await handler(authData);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Authentication failed";
    return new Response(
      JSON.stringify({ 
        error: message,
        code: "UNAUTHORIZED" 
      }),
      { 
        status: 401, 
        headers: { "Content-Type": "application/json" } 
      }
    );
  }
}
