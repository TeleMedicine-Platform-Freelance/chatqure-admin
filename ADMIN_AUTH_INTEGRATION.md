# Admin Authentication Integration

## Overview

The Vite admin frontend (katalyst-starter) has been integrated with the backend API (`app-backend`) for admin authentication. This includes:

- **Sign In**: Admin login with email and password
- **Session Management**: Automatic token storage and refresh
- **Token Refresh**: Automatic token refresh on 401 errors
- **Logout**: Admin logout with session invalidation

## Backend Endpoints Used

- `POST /api/v1/admin/auth/login` - Admin login
- `POST /api/v1/admin/auth/logout` - Admin logout (requires Bearer token)
- `POST /api/v1/auth/refresh` - Token refresh (shared endpoint)
- `GET /api/v1/auth/me` - Get current user info (shared endpoint)

## Changes Made

### 1. AuthRepository (`src/modules/auth/infrastructure/repositories/AuthRepository.ts`)

- Updated `login()` to use `/api/v1/admin/auth/login`
- Updated `logout()` to use `/api/v1/admin/auth/logout`
- Updated `refreshToken()` to use `/api/v1/auth/refresh`
- Updated `getCurrentUser()` to use `/api/v1/auth/me`
- Transforms backend response format to frontend format
- Admin registration, password reset, email verification, and MFA are not available (backend doesn't support these for admin users)

### 2. HttpClient (`src/shared/infrastructure/http/HttpClient.ts`)

- Added automatic token refresh on 401 errors
- Queues failed requests during token refresh
- Retries original request with new token after refresh
- Wraps backend responses in `ApiResponse` format (backend returns data directly)

### 3. Vite Config (`vite.config.ts`)

- Updated proxy target from `http://localhost:8000` to `http://localhost:4000` (backend port)

### 4. Environment Configuration

**Note**: `.env` file creation was blocked. You need to create it manually with:

```env
# Backend API Configuration
VITE_API_BASE_URL=http://localhost:4000

# API Timeout (milliseconds)
VITE_API_TIMEOUT=30000

# Auth Configuration
VITE_AUTH_LOGIN_PATH=/auth/login
VITE_AUTH_TOKEN_KEY=katalyst_auth_token
VITE_AUTH_CURRENT_USER_KEY=katalyst_auth_current_user

# MSW (Mock Service Worker) - Set to false to use real backend API
VITE_USE_MSW=false

# App Configuration
VITE_APP_NAME=Telemedicine Admin
VITE_APP_ENVIRONMENT=development
```

## How It Works

### Login Flow

1. User enters email and password in login form
2. `AuthService.login()` calls `AuthRepository.login()`
3. Repository sends POST to `/api/v1/admin/auth/login`
4. Backend returns `{ accessToken, refreshToken, admin: {...} }`
5. Tokens are stored in localStorage/sessionStorage
6. User data is stored and user is redirected to dashboard

### Token Refresh Flow

1. API request fails with 401 Unauthorized
2. HttpClient interceptor detects 401
3. Retrieves refresh token from storage
4. Calls `/api/v1/auth/refresh` with refresh token
5. Backend returns new `{ accessToken, refreshToken }`
6. New tokens are stored
7. Original request is retried with new access token
8. If refresh fails, user is redirected to login

### Session Management

- **Access Token**: Stored in localStorage/sessionStorage (key: `katalyst_auth_token`)
- **Refresh Token**: Stored in localStorage/sessionStorage (key: `katalyst_auth_token_refresh`)
- **User Data**: Stored in localStorage/sessionStorage (key: `katalyst_auth_current_user`)
- **Token Expiry**: Access tokens expire in 15 minutes, refresh tokens are valid until logout
- **Auto Refresh**: Tokens are automatically refreshed before expiration (2 minutes before expiry)

## Testing

1. **Start Backend**:
   ```bash
   cd app-backend
   docker-compose -f docker-compose.dev.yml up -d
   ```

2. **Create .env file** in `katalyst-starter/` directory (see above)

3. **Start Frontend**:
   ```bash
   cd katalyst-starter
   npm install
   npm run dev
   ```

4. **Test Login**:
   - Navigate to login page
   - Use admin credentials (e.g., `admin@local.test` / `ChangeMeAdmin123!`)
   - Should redirect to dashboard after successful login

5. **Test Session Persistence**:
   - Login successfully
   - Refresh the page
   - Should remain logged in (session restored from storage)

6. **Test Token Refresh**:
   - Login successfully
   - Wait for access token to expire (or manually expire it)
   - Make an API request
   - Should automatically refresh token and retry request

7. **Test Logout**:
   - Click logout button
   - Should clear tokens and redirect to login page

## Backend Response Format

### Login Response
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "abc123def456...",
  "admin": {
    "id": "uuid",
    "email": "admin@local.test",
    "role": "ADMIN",
    "lastLoginAt": "2026-01-22T12:00:00.000Z"
  }
}
```

### Refresh Token Response
```json
{
  "accessToken": "new-access-token",
  "refreshToken": "new-refresh-token"
}
```

### Logout Response
```json
{
  "message": "Logged out successfully"
}
```

## Notes

- **Admin Registration**: Not available - admins are created manually in the backend
- **Password Reset**: Not available - contact administrator
- **Email Verification**: Not available for admin users
- **MFA**: Not available for admin users
- **Single Session**: Backend enforces single-session policy (if admin is already logged in, new login will be rejected)

## Troubleshooting

### Connection Refused
- Ensure backend is running on port 4000
- Check `VITE_API_BASE_URL` in `.env` file
- Verify proxy settings in `vite.config.ts`

### 401 Unauthorized
- Check if access token is expired
- Verify refresh token is stored correctly
- Check backend logs for authentication errors

### Token Refresh Fails
- Verify refresh token is valid
- Check if session was invalidated on backend
- Ensure backend `/api/v1/auth/refresh` endpoint is accessible
