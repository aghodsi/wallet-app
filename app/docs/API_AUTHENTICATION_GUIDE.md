# API Authentication Protection Guide

This guide explains how to protect your API endpoints to ensure only authenticated users can access them.

## Overview

Your wallet app now uses a comprehensive authentication system with Better Auth that protects all API routes from unauthorized access.

## Authentication Middleware

The authentication system is built around the `withAuth` middleware function located in `app/lib/auth-middleware.ts`.

### Key Components

1. **validateSession()** - Validates user sessions from request headers
2. **withAuth()** - Middleware wrapper that protects API endpoints
3. **AuthenticatedRequest** - Type interface for authenticated requests

## How to Protect API Routes

### Step 1: Import the Middleware

```typescript
import { withAuth } from "~/lib/auth-middleware";
```

### Step 2: Wrap Your Route Handlers

For **loader** functions (GET requests):
```typescript
export async function loader({ request, params }: Route.LoaderArgs) {
  return withAuth(request, async (authData) => {
    // Your protected logic here
    // authData.user contains the authenticated user
    // authData.session contains the session data
    return await yourDataFetch();
  });
}
```

For **action** functions (POST/PUT/DELETE requests):
```typescript
export async function action({ request, params }: Route.ActionArgs) {
  return withAuth(request, async (authData) => {
    // Your protected logic here
    // authData.user contains the authenticated user
    return await yourDataOperation();
  });
}
```

## Authentication Flow

1. **Request Arrives** - User makes API request to protected endpoint
2. **Session Validation** - Middleware extracts and validates session from request headers
3. **Authorization Check** - Better Auth verifies the session is valid and not expired
4. **User Data Extraction** - If valid, user and session data is extracted
5. **Protected Logic Execution** - Your API logic runs with authenticated context
6. **Response** - Either returns your data or a 401 Unauthorized error

## Error Responses

When authentication fails, the middleware returns:

```json
{
  "error": "Unauthorized: Invalid or expired session",
  "code": "UNAUTHORIZED"
}
```

HTTP Status: `401 Unauthorized`

## Benefits of This Approach

### ✅ Security
- **Session Validation**: Every request validates the user's session
- **Automatic Expiration**: Expired sessions are automatically rejected
- **Centralized Logic**: All authentication logic is in one place
- **Type Safety**: TypeScript ensures proper handling of auth data

### ✅ Developer Experience
- **Simple Implementation**: Just wrap your handlers with `withAuth`
- **Consistent Error Handling**: Standardized error responses
- **Access to User Data**: Easy access to authenticated user information
- **No Boilerplate**: Minimal code changes required

### ✅ Performance
- **Efficient Validation**: Session validation is fast and lightweight
- **No Database Calls**: Better Auth handles session management efficiently
- **Caching**: Session data is cached where possible

## Best Practices

### 1. Always Protect Sensitive APIs
Protect any API that:
- Reads user-specific data
- Modifies data
- Accesses financial information
- Performs administrative actions

### 2. Use User Context
Access the authenticated user in your protected logic:
```typescript
return withAuth(request, async (authData) => {
  const { user, session } = authData;
  
  // Filter data by user ID
  return await fetchUserTransactions(user.id);
});
```

### 3. Handle Permissions
For role-based access, check user permissions:
```typescript
return withAuth(request, async (authData) => {
  if (!authData.user.isAdmin) {
    return new Response(
      JSON.stringify({ error: "Admin access required" }),
      { status: 403 }
    );
  }
  
  return await adminOperation();
});
```

### 4. Log Security Events
Log authentication failures for monitoring:
```typescript
// This is already handled in the middleware
console.error("Session validation failed:", error);
```

## Protected API Endpoints

The following endpoints are now protected:

- ✅ `/api/transactions` - All transaction operations
- ✅ `/api/currencies` - Currency management
- 🔄 `/api/import` - Data import (apply protection as needed)

## Frontend Integration

Your frontend authentication context (`app/contexts/authContext.tsx`) automatically handles:
- Session management
- Token refresh
- Login/logout state
- Request authentication headers

## Session Management

Better Auth handles:
- **Session Creation**: On successful login
- **Session Validation**: On each protected request
- **Session Expiration**: After configured timeout (7 days)
- **Session Refresh**: Automatic token refresh
- **Session Cleanup**: Removing expired sessions

## Testing Authentication

To test protected endpoints:

1. **Valid Session**: Make requests with authenticated user - should succeed
2. **No Session**: Make requests without authentication - should return 401
3. **Expired Session**: Test with expired tokens - should return 401
4. **Invalid Session**: Test with malformed tokens - should return 401

## Migration Checklist

To protect additional API routes:

1. ✅ Import `withAuth` middleware
2. ✅ Wrap loader/action functions
3. ✅ Update route parameter access
4. ✅ Test authentication flow
5. ✅ Verify error handling

Your API endpoints are now secure and will only return data to authenticated users!
