/**
 * Admin Repository - HTTP abstraction for admin API calls
 */

import { injectable, inject } from 'inversify';
import { CORE_SYMBOLS } from '@/core/di/symbols';
import type { IHttpClient } from '@/shared/infrastructure/http/HttpClient';
import { BaseRepository } from '@/shared/infrastructure/repositories/BaseRepository';
import type { IAdminRepository, AdminAnalyticsOverview, AdminDashboardMetrics } from '../../domain/ports/IAdminRepository';
import type { DoctorDetails, DoctorListResponse } from '../../domain/models/Doctor';
import type { PatientDetails, PatientListResponse } from '../../domain/models/Patient';
import type { ConsultationMessage } from '../../domain/ports/IAdminRepository';

@injectable()
export class AdminRepository extends BaseRepository implements IAdminRepository {
  constructor(@inject(CORE_SYMBOLS.IHttpClient) http: IHttpClient) {
    super(http);
  }

  async getAnalyticsOverview(): Promise<AdminAnalyticsOverview> {
    return this.get<AdminAnalyticsOverview>(
      '/api/v1/admin/analytics/overview',
      'Failed to fetch analytics overview'
    );
  }

  async getDashboardMetrics(): Promise<AdminDashboardMetrics> {
    return this.get<AdminDashboardMetrics>(
      '/api/v1/admin/dashboard/metrics',
      'Failed to fetch dashboard metrics'
    );
  }

  async getDoctors(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    status?: string;
  }): Promise<DoctorListResponse> {
    // Map frontend params to backend API params
    const backendParams: Record<string, string | number> = {};
    
    if (params?.page !== undefined) {
      backendParams.page = params.page;
    }
    
    // Backend expects 'limit' not 'pageSize'
    if (params?.pageSize !== undefined) {
      backendParams.limit = params.pageSize;
    }
    
    if (params?.search) {
      backendParams.search = params.search;
    }
    
    // Backend expects sortBy to be one of: createdAt, email, experience, registrationNumber, tokenNumber, ratingAvg, ratingCount, kycStatus
    // Default to 'createdAt' if sortOrder is provided but sortBy is not
    if (params?.sortOrder) {
      backendParams.sortOrder = params.sortOrder;
      backendParams.sortBy = params.sortBy || 'createdAt';
    } else if (params?.sortBy) {
      backendParams.sortBy = params.sortBy;
    }
    
    if (params?.status) {
      backendParams.status = params.status;
    }
    
    const query = this.buildQueryString(backendParams);
    return this.get<DoctorListResponse>(
      this.appendQuery('/api/v1/admin/doctors', query),
      'Failed to fetch doctors'
    );
  }

  async getPendingDoctors(params?: {
    page?: number;
    pageSize?: number;
    tokenNumber?: string;
    name?: string;
    phoneNumber?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<DoctorListResponse> {
    const backendParams: Record<string, string | number> = {};
    
    if (params?.page !== undefined) {
      backendParams.page = params.page;
    }
    
    if (params?.pageSize !== undefined) {
      backendParams.limit = params.pageSize;
    }
    
    if (params?.tokenNumber) {
      backendParams.tokenNumber = params.tokenNumber;
    }
    
    if (params?.name) {
      backendParams.name = params.name;
    }
    
    if (params?.phoneNumber) {
      backendParams.phoneNumber = params.phoneNumber;
    }
    
    if (params?.sortOrder) {
      backendParams.sortOrder = params.sortOrder;
      backendParams.sortBy = params.sortBy || 'createdAt';
    } else if (params?.sortBy) {
      backendParams.sortBy = params.sortBy;
    }
    
    const query = this.buildQueryString(backendParams);
    return this.get<DoctorListResponse>(
      this.appendQuery('/api/v1/admin/doctors/pending', query),
      'Failed to fetch pending doctors'
    );
  }

  async getDoctorById(id: string): Promise<DoctorDetails> {
    const response = await this.get<{ data: DoctorDetails }>(
      `/api/v1/admin/doctors/${id}`,
      'Failed to fetch doctor details'
    );
    return response.data;
  }

  async approveKyc(doctorId: string, notes?: string): Promise<void> {
    await this.put<void>(
      `/api/v1/admin/doctors/${doctorId}/approve`,
      notes != null ? { notes } : {},
      'Failed to approve KYC'
    );
  }

  async rejectKyc(doctorId: string, reason?: string): Promise<void> {
    await this.put<void>(
      `/api/v1/admin/doctors/${doctorId}/reject`,
      { reason: reason ?? 'Rejected by admin' },
      'Failed to reject KYC'
    );
  }

  async suspendDoctor(doctorId: string): Promise<void> {
    await this.put<void>(
      `/api/v1/admin/doctors/${doctorId}/suspend`,
      undefined,
      'Failed to suspend doctor'
    );
  }

  async unsuspendDoctor(doctorId: string): Promise<void> {
    await this.put<void>(
      `/api/v1/admin/doctors/${doctorId}/unsuspend`,
      undefined,
      'Failed to unsuspend doctor'
    );
  }

  async getPresignedGetUrl(documentUrl: string): Promise<string> {
    const query = `url=${encodeURIComponent(documentUrl)}`;
    const url = this.appendQuery('/api/v1/upload/presigned-get', query);
    const data = await this.get<{ url: string }>(url, 'Failed to get document URL');
    return data.url;
  }

  // Patients
  async getPatients(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PatientListResponse> {
    const backendParams: Record<string, string | number> = {};
    if (params?.page !== undefined) backendParams.page = params.page;
    if (params?.pageSize !== undefined) backendParams.limit = params.pageSize;
    if (params?.search) backendParams.search = params.search;
    if (params?.sortOrder) {
      backendParams.sortOrder = params.sortOrder;
      backendParams.sortBy = params.sortBy ?? 'createdAt';
    } else if (params?.sortBy) {
      backendParams.sortBy = params.sortBy;
    }
    const query = this.buildQueryString(backendParams);
    return this.get<PatientListResponse>(
      this.appendQuery('/api/v1/admin/patients', query),
      'Failed to fetch patients'
    );
  }

  async getPatientById(id: string): Promise<PatientDetails> {
    const response = await this.get<{ data: PatientDetails }>(
      `/api/v1/admin/patients/${id}`,
      'Failed to fetch patient details'
    );
    return response.data;
  }

  // Bookings
  async getBookings(params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    fromDate?: string;
    toDate?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<any> {
    const backendParams: Record<string, string | number> = {};
    if (params?.page !== undefined) backendParams.page = params.page;
    if (params?.pageSize !== undefined) backendParams.limit = params.pageSize;
    if (params?.status) backendParams.status = params.status;
    if (params?.fromDate) backendParams.fromDate = params.fromDate;
    if (params?.toDate) backendParams.toDate = params.toDate;
    if (params?.sortOrder) {
      backendParams.sortOrder = params.sortOrder;
      backendParams.sortBy = params.sortBy || 'createdAt';
    } else if (params?.sortBy) {
      backendParams.sortBy = params.sortBy;
    }
    const query = this.buildQueryString(backendParams);
    return this.get<any>(this.appendQuery('/api/v1/admin/bookings', query), 'Failed to fetch bookings');
  }

  async getConsultationMessages(
    consultationId: string,
    params?: { limit?: number; offset?: number; order?: 'asc' | 'desc' }
  ): Promise<{ data: ConsultationMessage[]; total: number }> {
    const q: Record<string, string | number> = {};
    if (params?.limit != null) q.limit = params.limit;
    if (params?.offset != null) q.offset = params.offset;
    if (params?.order) q.order = params.order;
    const query = this.buildQueryString(q);
    return this.get<{ data: ConsultationMessage[]; total: number }>(
      this.appendQuery(`/api/v1/consultation/${consultationId}/messages`, query),
      'Failed to fetch consultation messages'
    );
  }

  // Payouts
  async getPayoutRequests(params?: {
    page?: number;
    pageSize?: number;
  }): Promise<any> {
    const backendParams: Record<string, string | number> = {};
    if (params?.page !== undefined) backendParams.page = params.page;
    if (params?.pageSize !== undefined) backendParams.limit = params.pageSize;
    const query = this.buildQueryString(backendParams);
    return this.get<any>(this.appendQuery('/api/v1/admin/payouts/requests', query), 'Failed to fetch payout requests');
  }

  // Payments
  async getPayments(params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    fromDate?: string;
    toDate?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<any> {
    const backendParams: Record<string, string | number> = {};
    if (params?.page !== undefined) backendParams.page = params.page;
    if (params?.pageSize !== undefined) backendParams.limit = params.pageSize;
    if (params?.status) backendParams.status = params.status;
    if (params?.fromDate) backendParams.fromDate = params.fromDate;
    if (params?.toDate) backendParams.toDate = params.toDate;
    if (params?.sortOrder) {
      backendParams.sortOrder = params.sortOrder;
      backendParams.sortBy = params.sortBy || 'createdAt';
    } else if (params?.sortBy) {
      backendParams.sortBy = params.sortBy;
    }
    const query = this.buildQueryString(backendParams);
    return this.get<any>(this.appendQuery('/api/v1/admin/payments', query), 'Failed to fetch payments');
  }

  async verifyPaymentOrder(orderId: string): Promise<any> {
    return this.post<any>(`/api/v1/admin/payments/verify-order/${orderId}`, {}, 'Failed to verify payment order');
  }

  // Dev utilities
  async addTestMoney(params: { accountId: string; amount: number }): Promise<void> {
    await this.post<void>(
      '/api/v1/admin/dev/add-test-money',
      {
        accountId: params.accountId,
        amount: params.amount,
      },
      'Failed to add test money'
    );
  }

  // Reference data base path (backend: AdminReferenceDataController)
  private static readonly REFERENCE_DATA = '/api/v1/admin/reference-data';

  // Specializations
  async getSpecializations(): Promise<any[]> {
    return this.get<any[]>(
      `${AdminRepository.REFERENCE_DATA}/specializations`,
      'Failed to fetch specializations'
    );
  }

  async createSpecialization(data: { name: string }): Promise<any> {
    const response = await this.post<{ data: any }>(`${AdminRepository.REFERENCE_DATA}/specializations`, data, 'Failed to create specialization');
    return response.data;
  }

  async updateSpecialization(id: string, data: { name?: string; isActive?: boolean }): Promise<any> {
    const response = await this.put<{ data: any }>(`${AdminRepository.REFERENCE_DATA}/specializations/${id}`, data, 'Failed to update specialization');
    return response.data;
  }

  async deleteSpecialization(id: string): Promise<void> {
    await this.delete<void>(`${AdminRepository.REFERENCE_DATA}/specializations/${id}`, 'Failed to delete specialization');
  }

  // Symptoms
  async getSymptoms(): Promise<any[]> {
    return this.get<any[]>(
      `${AdminRepository.REFERENCE_DATA}/symptoms`,
      'Failed to fetch symptoms'
    );
  }

  async createSymptom(data: { name: string }): Promise<any> {
    const response = await this.post<{ data: any }>(
      `${AdminRepository.REFERENCE_DATA}/symptoms`,
      data,
      'Failed to create symptom'
    );
    return response.data;
  }

  async updateSymptom(id: string, data: { name?: string; isActive?: boolean }): Promise<any> {
    const response = await this.put<{ data: any }>(
      `${AdminRepository.REFERENCE_DATA}/symptoms/${id}`,
      data,
      'Failed to update symptom'
    );
    return response.data;
  }

  async deleteSymptom(id: string): Promise<void> {
    await this.delete<void>(`${AdminRepository.REFERENCE_DATA}/symptoms/${id}`, 'Failed to delete symptom');
  }

  // Symptom Categories
  async getSymptomCategories(): Promise<any[]> {
    return this.get<any[]>(
      `${AdminRepository.REFERENCE_DATA}/symptom-categories`,
      'Failed to fetch symptom categories'
    );
  }

  async getFullSymptoms(): Promise<{
    data: {
      symptoms: Array<{ id: string; name: string; isActive: boolean; createdAt: string; updatedAt: string }>;
      categories: Array<{
        id: string;
        name: string;
        displayOrder: number;
        isActive: boolean;
        symptoms: Array<{ id: string; name: string }>;
        createdAt: string;
        updatedAt: string;
      }>;
    };
  }> {
    const response = await this.get<{
      data: {
        symptoms: Array<{ id: string; name: string; isActive: boolean; createdAt: string; updatedAt: string }>;
        categories: Array<{
          id: string;
          name: string;
          displayOrder: number;
          isActive: boolean;
          symptoms: Array<{ id: string; name: string }>;
          createdAt: string;
          updatedAt: string;
        }>;
      };
    }>(
      `${AdminRepository.REFERENCE_DATA}/symptoms/full`,
      'Failed to fetch full symptom data'
    );
    return response;
  }

  async createSymptomCategory(data: { 
    name: string; 
    displayOrder?: number; 
    symptomIds?: string[] 
  }): Promise<any> {
    const response = await this.post<{ data: any }>(`${AdminRepository.REFERENCE_DATA}/symptom-categories`, data, 'Failed to create symptom category');
    return response.data;
  }

  async updateSymptomCategory(id: string, data: { 
    name?: string; 
    displayOrder?: number; 
    isActive?: boolean;
    symptomIds?: string[] 
  }): Promise<any> {
    const response = await this.put<{ data: any }>(`${AdminRepository.REFERENCE_DATA}/symptom-categories/${id}`, data, 'Failed to update symptom category');
    return response.data;
  }

  async deleteSymptomCategory(id: string): Promise<void> {
    await this.delete<void>(`${AdminRepository.REFERENCE_DATA}/symptom-categories/${id}`, 'Failed to delete symptom category');
  }

  // Languages
  async getLanguages(): Promise<any[]> {
    return this.get<any[]>(
      `${AdminRepository.REFERENCE_DATA}/languages`,
      'Failed to fetch languages'
    );
  }

  async createLanguage(data: { code: string; name: string }): Promise<any> {
    const response = await this.post<{ data: any }>(
      `${AdminRepository.REFERENCE_DATA}/languages`,
      data,
      'Failed to create language'
    );
    return response.data;
  }

  async updateLanguage(id: string, data: { code?: string; name?: string; isActive?: boolean }): Promise<any> {
    const response = await this.put<{ data: any }>(
      `${AdminRepository.REFERENCE_DATA}/languages/${id}`,
      data,
      'Failed to update language'
    );
    return response.data;
  }

  async deleteLanguage(id: string): Promise<void> {
    await this.delete<void>(`${AdminRepository.REFERENCE_DATA}/languages/${id}`, 'Failed to delete language');
  }

  // Medical Council
  async getMedicalCouncils(): Promise<any[]> {
    return this.get<any[]>(
      `${AdminRepository.REFERENCE_DATA}/medical-councils`,
      'Failed to fetch medical councils'
    );
  }

  async createMedicalCouncil(data: { name: string; state?: string }): Promise<any> {
    const response = await this.post<{ data: any }>(`${AdminRepository.REFERENCE_DATA}/medical-councils`, data, 'Failed to create medical council');
    return response.data;
  }

  async updateMedicalCouncil(id: string, data: { name: string; state?: string; isActive?: boolean }): Promise<any> {
    const response = await this.put<{ data: any }>(`${AdminRepository.REFERENCE_DATA}/medical-councils/${id}`, data, 'Failed to update medical council');
    return response.data;
  }

  async deleteMedicalCouncil(id: string): Promise<void> {
    await this.delete<void>(`${AdminRepository.REFERENCE_DATA}/medical-councils/${id}`, 'Failed to delete medical council');
  }
}
