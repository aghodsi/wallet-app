# 401 Unauthorized Error Handling System

This document describes the centralized 401 unauthorized error handling system implemented in the wallet application.

## Overview

The application now has a comprehensive system to handle 401 unauthorized responses from API calls, providing:
- Clear "Unauthorized" error messages to users
- Automatic session refresh attempts
- Optional redirect to sign-in page
- Consistent error handling across all API calls

## Components

### 1. API Client (`app/lib/api-client.ts`)

The core of the system is the enhanced API client that wraps all fetch calls:

**Key Features:**
- Intercepts all HTTP responses
- Detects 401 status codes specifically
- Shows toast notifications with "Unauthorized" messages
- Triggers auth refresh events
- Provides fallback redirect to sign-in

**Functions:**
- `apiClient()` - Main wrapper function
- `apiGet()`, `apiPost()`, `apiPut()`, `apiDelete()` - Convenience methods
- `handleApiResponse()` - Response processing helper

### 2. Auth Context Updates (`app/contexts/authContext.tsx`)

Enhanced to listen for auth refresh events:
- Listens for `auth-refresh-needed` events
- Automatically attempts to refresh session when 401 occurs
- Provides reactive auth state management

### 3. Backend Auth Middleware (`app/lib/auth-middleware.ts`)

Provides standardized 401 responses:
```json
{
  "error": "Unauthorized: Invalid or expired session",
  "code": "UNAUTHORIZED"
}
```

## Usage Examples

### Basic API Call
```typescript
import { apiGet, handleApiResponse } from "~/lib/api-client";

// Old way
const response = await fetch("/api/transactions");
if (!response.ok) {
  throw new Error("Request failed");
}
const data = await response.json();

// New way with 401 handling
const response = await apiGet("/api/transactions");
const data = await handleApiResponse(response);
```

### POST with FormData
```typescript
import { apiPost, handleApiResponse } from "~/lib/api-client";

const formData = new FormData();
formData.append("data", JSON.stringify(transactionData));

const response = await apiPost("/api/transactions", formData);
const result = await handleApiResponse(response);
```

## Error Flow

1. **API Call Made** → `apiClient()` wraps the fetch request
2. **401 Response Detected** → System identifies unauthorized response
3. **Error Message Extracted** → Parses backend error message
4. **Toast Notification** → Shows "Unauthorized" message to user
5. **Auth Refresh Triggered** → Attempts to refresh session
6. **Optional Redirect** → Redirects to sign-in if still unauthorized

## Toast Messages

Users will see contextual error messages:
- **Primary**: "Unauthorized" or specific error from backend
- **Description**: "Your session may have expired. Please sign in again."
- **Duration**: 5 seconds

## Fallback Redirect

If the user is still unauthorized after 2 seconds:
- Checks if already on sign-in page
- Checks for auth state indicators
- Redirects to `/signin` if needed

## Updated Components

The following components have been updated to use the new API client:

1. **Data Freshness Indicator** (`app/components/dataFreshnessIndicator.tsx`)
2. **Global Transaction Dialog** (`app/components/globalTransactionDialog.tsx`)
3. **Transactions Page** (`app/routes/transactions.tsx`)

## Migration Guide

To update other components:

1. **Import the API client:**
```typescript
import { apiGet, apiPost, apiPut, apiDelete, handleApiResponse } from "~/lib/api-client";
```

2. **Replace fetch calls:**
```typescript
// Before
const response = await fetch(url, options);
if (!response.ok) {
  throw new Error("Request failed");
}
const data = await response.json();

// After
const response = await apiGet(url); // or apiPost, apiPut, apiDelete
const data = await handleApiResponse(response);
```

3. **Handle FormData:**
```typescript
// For FormData posts
const response = await apiPost(url, formData);
const data = await handleApiResponse(response);
```

## Testing 401 Responses

To test the system:

1. **Simulate Expired Session**: Modify session cookies/tokens
2. **Backend Testing**: Temporarily modify auth middleware to return 401
3. **Network Testing**: Use browser dev tools to simulate 401 responses

## Benefits

- **Consistent UX**: All 401 errors show the same clear message
- **Automatic Recovery**: Attempts to refresh session automatically
- **User Guidance**: Clear instructions to sign in again
- **Centralized Logic**: One place to manage 401 handling
- **Backwards Compatible**: Existing error handling still works

## Future Enhancements

Potential improvements:
- Token refresh logic
- Retry mechanisms for transient auth failures
- Analytics for auth failure patterns
- Customizable redirect URLs
- Silent auth refresh in background
