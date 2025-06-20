import { toast } from "sonner";

/**
 * Enhanced fetch function that handles 401 unauthorized responses
 * Shows "Unauthorized" messages and optionally redirects to sign-in
 */
export async function apiClient(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // Handle 401 Unauthorized responses specifically
    if (response.status === 401) {
      console.warn("401 Unauthorized response received for:", url);
      
      // Try to get the error message from the response
      let errorMessage = "Unauthorized";
      try {
        const errorData = await response.clone().json();
        errorMessage = errorData.error || errorData.message || "Unauthorized";
      } catch (e) {
        // If we can't parse the error response, use default message
        errorMessage = "Unauthorized - Please sign in again";
      }

      // Show unauthorized toast message
      // toast.error(errorMessage, {
      //   description: "Your session may have expired. Please sign in again.",
      //   duration: 5000,
      // });

      // Try to refresh auth state
      try {
        // This will trigger a re-render and potentially redirect if needed
        window.dispatchEvent(new CustomEvent('auth-refresh-needed'));
      } catch (e) {
        console.warn("Could not trigger auth refresh:", e);
      }

      // Optional: Redirect to sign-in after a short delay
      setTimeout(() => {
        // Check if user is still unauthorized after 2 seconds
        if (window.location.pathname !== '/signin' && !document.querySelector('[data-auth-state="authenticated"]')) {
          console.log("Redirecting to sign-in due to 401 response");
          window.location.href = '/signin';
        }
      }, 2000);

      // Return the response so calling code can handle it appropriately
      return response;
    }

    // For other error status codes, let the calling code handle them
    return response;

  } catch (error) {
    console.error("API request failed:", error);
    
    // Show generic network error
    toast.error("Network Error", {
      description: "Unable to connect to the server. Please check your connection.",
      duration: 3000,
    });
    
    throw error;
  }
}

/**
 * Convenience wrapper for GET requests
 */
export async function apiGet(url: string, options: Omit<RequestInit, 'method'> = {}) {
  return apiClient(url, { ...options, method: 'GET' });
}

/**
 * Convenience wrapper for POST requests
 */
export async function apiPost(url: string, data?: any, options: Omit<RequestInit, 'method' | 'body'> = {}) {
  const body = data ? (data instanceof FormData ? data : JSON.stringify(data)) : undefined;
  const headers = data instanceof FormData 
    ? options.headers 
    : { 'Content-Type': 'application/json', ...options.headers };

  return apiClient(url, { 
    ...options, 
    method: 'POST', 
    body,
    headers 
  });
}

/**
 * Convenience wrapper for PUT requests
 */
export async function apiPut(url: string, data?: any, options: Omit<RequestInit, 'method' | 'body'> = {}) {
  const body = data ? JSON.stringify(data) : undefined;
  return apiClient(url, { 
    ...options, 
    method: 'PUT', 
    body,
    headers: { 'Content-Type': 'application/json', ...options.headers }
  });
}

/**
 * Convenience wrapper for DELETE requests
 */
export async function apiDelete(url: string, options: Omit<RequestInit, 'method'> = {}) {
  return apiClient(url, { ...options, method: 'DELETE' });
}

/**
 * Helper function to handle API response and extract JSON data
 * Throws an error with appropriate message for non-200 responses
 */
export async function handleApiResponse<T = any>(response: Response): Promise<T> {
  if (response.status === 401) {
    // 401 is already handled by apiClient, just throw to let caller know
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch (e) {
      // If we can't parse error response, use status text
      errorMessage = response.statusText || errorMessage;
    }
    
    throw new Error(errorMessage);
  }

  // Try to parse JSON response
  try {
    return await response.json();
  } catch (e) {
    // If response is not JSON, return empty object
    return {} as T;
  }
}
