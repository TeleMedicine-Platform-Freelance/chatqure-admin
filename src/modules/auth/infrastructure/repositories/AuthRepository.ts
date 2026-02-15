/**
 * AuthRepository - HTTP abstraction layer for auth API calls
 * 
 * This repository encapsulates all HTTP communication with the auth API.
 * It extends BaseRepository which provides:
 * - Automatic response unwrapping
 * - Consistent error handling
 * - HTTP method helpers
 * 
 * To switch from MSW to real API:
 * 1. Update API_BASE_URL in config
 * 2. Disable MSW (VITE_USE_MSW=false)
 * 3. No code changes needed here!
 */

import { injectable, inject } from 'inversify';
import { CORE_SYMBOLS } from '@/core/di/symbols';
import type { IHttpClient } from '@/shared/infrastructure/http/HttpClient';
import { BaseRepository } from '@/shared/infrastructure/repositories';
import type {
  LoginDTO,
  LoginResponse,
  RegisterDTO,
  RegisterResponse,
  ForgotPasswordDTO,
  ForgotPasswordResponse,
  ResetPasswordDTO,
  ResetPasswordResponse,
  VerifyEmailDTO,
  VerifyEmailResponse,
  MfaSetupDTO,
  MfaSetupResponse,
  MfaVerifyDTO,
  MfaVerifyResponse,
  RefreshTokenDTO,
  RefreshTokenResponse,
  LogoutResponse,
  MeResponse,
  Role,
  SendOtpDTO,
  VerifyOtpDTO,
} from '@/modules/auth/domain/models/AuthModels';

export interface IAuthRepository {
  login(dto: LoginDTO): Promise<LoginResponse>;
  sendOtp(dto: SendOtpDTO): Promise<{ expiresIn: number; message: string; testOtp?: string }>;
  verifyOtp(dto: VerifyOtpDTO): Promise<LoginResponse>;
  register(dto: RegisterDTO): Promise<RegisterResponse>;
  forgotPassword(dto: ForgotPasswordDTO): Promise<ForgotPasswordResponse>;
  resetPassword(dto: ResetPasswordDTO): Promise<ResetPasswordResponse>;
  verifyEmail(dto: VerifyEmailDTO): Promise<VerifyEmailResponse>;
  setupMfa(dto: MfaSetupDTO): Promise<MfaSetupResponse>;
  verifyMfa(dto: MfaVerifyDTO): Promise<MfaVerifyResponse>;
  refreshToken(dto: RefreshTokenDTO): Promise<RefreshTokenResponse>;
  logout(): Promise<LogoutResponse>;
  getCurrentUser(): Promise<MeResponse>;
}

@injectable()
export class AuthRepository extends BaseRepository implements IAuthRepository {
  // Admin auth endpoints - using backend API
  private readonly adminAuthBaseUrl = '/api/v1/admin/auth';
  private readonly sharedAuthBaseUrl = '/api/v1/auth';

  constructor(@inject(CORE_SYMBOLS.IHttpClient) http: IHttpClient) {
    super(http);
  }

  async sendOtp(dto: SendOtpDTO): Promise<{ expiresIn: number; message: string; testOtp?: string }> {
    // Use test OTP endpoint for development (returns testOtp in response)
    const response = await this.post<{
      expiresIn: number;
      message: string;
      testOtp?: string;
      warning?: string;
    }, SendOtpDTO>(
      `${this.sharedAuthBaseUrl}/otp/send-test`,
      dto,
      'Failed to send OTP'
    );

    return {
      expiresIn: response.expiresIn,
      message: response.message,
      testOtp: response.testOtp, // For development/testing
    };
  }

  async verifyOtp(dto: VerifyOtpDTO): Promise<LoginResponse> {
    // Backend OTP verify endpoint
    const response = await this.post<{
      accessToken: string;
      refreshToken: string;
      user: {
        id: string;
        phoneNumber: string;
        role: string;
        status: string;
        isNewUser: boolean;
      };
    }, VerifyOtpDTO>(
      `${this.sharedAuthBaseUrl}/otp/verify`,
      dto,
      'OTP verification failed'
    );

    // Transform backend response to frontend format
    return {
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      user: {
        id: response.user.id,
        phoneNumber: response.user.phoneNumber,
        name: response.user.phoneNumber, // Use phone number as name initially
        roles: ['admin'] as Role[],
        emailVerified: false,
        createdAt: undefined,
      },
    };
  }

  async login(dto: LoginDTO): Promise<LoginResponse> {
    // Backend admin login endpoint (email + password)
    // Exclude 'remember' field - only send email and password to backend
    const { remember, ...loginPayload } = dto;
    const response = await this.post<{
      accessToken: string;
      refreshToken: string;
      admin: {
        id: string;
        email: string;
        role: string;
        lastLoginAt: string | null;
      };
    }, Omit<LoginDTO, 'remember'>>(
      `${this.adminAuthBaseUrl}/login`,
      loginPayload,
      'Login failed'
    );

    // Transform backend response to frontend format
    return {
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      user: {
        id: response.admin.id,
        email: response.admin.email,
        name: response.admin.email.split('@')[0], // Use email prefix as name
        roles: ['admin'] as Role[],
        emailVerified: true,
        createdAt: response.admin.lastLoginAt || undefined,
      },
    };
  }

  async register(_dto: RegisterDTO): Promise<RegisterResponse> {
    // Backend doesn't have admin registration endpoint
    // Admins are created manually
    throw new Error('Admin registration is not available. Please contact your administrator.');
  }

  async forgotPassword(_dto: ForgotPasswordDTO): Promise<ForgotPasswordResponse> {
    // Backend doesn't have admin password reset endpoints yet
    throw new Error('Password reset is not available for admin users. Please contact your administrator.');
  }

  async resetPassword(_dto: ResetPasswordDTO): Promise<ResetPasswordResponse> {
    // Backend doesn't have admin password reset endpoints yet
    throw new Error('Password reset is not available for admin users. Please contact your administrator.');
  }

  async verifyEmail(_dto: VerifyEmailDTO): Promise<VerifyEmailResponse> {
    // Backend doesn't have email verification for admin users
    throw new Error('Email verification is not available for admin users.');
  }

  async setupMfa(_dto: MfaSetupDTO): Promise<MfaSetupResponse> {
    // Backend doesn't have MFA setup for admin users yet
    throw new Error('MFA setup is not available for admin users.');
  }

  async verifyMfa(_dto: MfaVerifyDTO): Promise<MfaVerifyResponse> {
    // Backend doesn't have MFA verification for admin users yet
    throw new Error('MFA verification is not available for admin users.');
  }

  async refreshToken(dto: RefreshTokenDTO): Promise<RefreshTokenResponse> {
    // Backend uses shared refresh endpoint
    return this.post<RefreshTokenResponse, RefreshTokenDTO>(
      `${this.sharedAuthBaseUrl}/refresh`,
      dto,
      'Token refresh failed'
    );
  }

  async logout(): Promise<LogoutResponse> {
    // Backend admin logout endpoint
    return this.post<LogoutResponse>(
      `${this.adminAuthBaseUrl}/logout`,
      undefined,
      'Logout failed'
    );
  }

  async getCurrentUser(): Promise<MeResponse> {
    // Backend uses shared /auth/me endpoint
    const response = await this.get<{
      user: {
        id: string;
        email?: string;
        phoneNumber?: string;
        role: string;
        lastLoginAt: string | null;
      };
    }>(
      `${this.sharedAuthBaseUrl}/me`,
      'Failed to get current user'
    );

    // Transform backend response to frontend format
    const user = response.user;
    const name = user.email 
      ? user.email.split('@')[0] 
      : user.phoneNumber || 'Admin User';

    return {
      user: {
        id: user.id,
        email: user.email,
        phoneNumber: user.phoneNumber,
        name,
        roles: ['admin'] as Role[],
        emailVerified: !!user.email,
        createdAt: user.lastLoginAt || undefined,
      },
    };
  }
}
