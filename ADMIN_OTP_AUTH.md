# Admin OTP Authentication

## Overview

Admin authentication has been updated to use **Phone Number + OTP** instead of email/password. This provides a consistent authentication experience across the platform.

## Authentication Flow

### Step 1: Enter Phone Number
- User enters phone number in E.164 format (e.g., `+919876543210`)
- Clicks "Send OTP" button
- Backend sends OTP via SMS (or returns test OTP in development)

### Step 2: Verify OTP
- User enters 6-digit OTP
- Clicks "Verify OTP" button
- Backend verifies OTP and returns access/refresh tokens
- User is logged in and redirected to dashboard

## Backend Endpoints Used

- `POST /api/v1/auth/otp/send-test` - Send test OTP (development only)
  - Request: `{ phoneNumber: "+919876543210", role: "ADMIN" }`
  - Response: `{ expiresIn: 300, message: "...", testOtp: "123456" }`

- `POST /api/v1/auth/otp/verify` - Verify OTP and login
  - Request: `{ phoneNumber: "+919876543210", otp: "123456", role: "ADMIN" }`
  - Response: `{ accessToken: "...", refreshToken: "...", user: {...} }`

- `POST /api/v1/admin/auth/logout` - Logout (requires Bearer token)
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET /api/v1/auth/me` - Get current user info

## Changes Made

### 1. AuthModels (`src/modules/auth/domain/models/AuthModels.ts`)

- Updated `LoginDTO` to use `phoneNumber` instead of `email`
- Added `SendOtpDTO` and `VerifyOtpDTO` interfaces
- Updated `AuthUser` to include optional `phoneNumber` field

### 2. AuthRepository (`src/modules/auth/infrastructure/repositories/AuthRepository.ts`)

- Added `sendOtp()` method - calls `/api/v1/auth/otp/send-test`
- Added `verifyOtp()` method - calls `/api/v1/auth/otp/verify`
- Updated `login()` to handle OTP flow
- Updated `getCurrentUser()` to handle phone number in response

### 3. AuthService (`src/modules/auth/infrastructure/services/AuthService.ts`)

- Added `sendOtp()` method
- Added `verifyOtp()` method
- Updated `login()` to handle two-step OTP flow

### 4. LoginForm (`src/modules/auth/ui/components/forms/LoginForm.tsx`)

- Converted to two-step flow:
  - **Step 1**: Phone number input
  - **Step 2**: OTP input
- Shows test OTP in development mode
- Includes "Resend OTP" and "Change phone number" options

## Testing

### Development Mode

1. **Start Backend**:
   ```bash
   cd app-backend
   docker-compose -f docker-compose.dev.yml up -d
   ```

2. **Start Frontend**:
   ```bash
   cd katalyst-starter
   npm run dev
   ```

3. **Test Login**:
   - Navigate to login page
   - Enter phone number: `+919876543210`
   - Click "Send OTP"
   - Test OTP `123456` will be displayed
   - Enter OTP: `123456`
   - Click "Verify OTP"
   - Should redirect to dashboard

### Test Credentials

- **Phone Number**: `+919876543210` (or any valid E.164 format)
- **Test OTP**: `123456` (always returned in development mode)

## Phone Number Format

Phone numbers must be in **E.164 format**:
- Starts with `+`
- Followed by country code (1-3 digits)
- Followed by phone number (up to 15 digits total)
- Example: `+919876543210` (India)

## OTP Details

- **Length**: 6 digits
- **Expiry**: 5 minutes (300 seconds)
- **Test OTP**: Always `123456` in development mode
- **Production**: Real OTP sent via SMS (MSG91)

## Session Management

- **Access Token**: Expires in 15 minutes
- **Refresh Token**: Valid until logout
- **Auto Refresh**: Tokens automatically refreshed on 401 errors
- **Storage**: Tokens stored in localStorage/sessionStorage

## Notes

- **Role**: Always set to `"ADMIN"` for admin users
- **Test Endpoint**: `/auth/otp/send-test` only works in development mode
- **Production**: Use `/auth/otp/send` in production (requires MSG91 configuration)
- **Backward Compatibility**: `login()` method still works but uses OTP flow internally

## Troubleshooting

### OTP Not Received
- Check if backend is running
- Verify phone number format (E.164)
- Check backend logs for errors
- In development, test OTP is shown in UI

### Invalid OTP
- OTP expires after 5 minutes
- OTP can only be used once
- Check if correct OTP was entered
- Try resending OTP

### Connection Errors
- Verify `VITE_API_BASE_URL` in `.env` file
- Check backend is accessible on port 4000
- Verify proxy settings in `vite.config.ts`
