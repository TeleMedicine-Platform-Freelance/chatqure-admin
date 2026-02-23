/**
 * Admin Repository Interface
 */

import type { DoctorDetails, DoctorListResponse } from '../models/Doctor';
import type { PatientDetails, PatientListResponse } from '../models/Patient';

export interface AdminAnalyticsOverview {
  totalDoctors: number;
  verifiedDoctors: number;
  pendingKyc: number;
  totalPatients: number;
  totalConsultations: number;
  activeConsultations: number;
}

export type AdminDashboardMetricsRange =
  | 'all_time'
  | 'today'
  | 'yesterday'
  | 'last_7_days'
  | 'this_month'
  | 'last_month'
  | 'custom';

export interface AdminDashboardMetrics {
  range: {
    from?: string | null;
    to?: string | null;
  };
  snapshotAt: string;
  balances: {
    totalPlatformBalance: string;
    totalDoctorsBalance: string;
    totalPatientsBalance: string;
  };
  flows: {
    totalGstCollection: string;
    totalCommission: string;
    totalRazorpayDeposits: string;
    totalPayoutWithdrawals: string;
  };
}

/** Admin user (from GET /api/v1/admin/auth/admins) */
export interface AdminListItem {
  id: string;
  email: string;
  status: string;
  createdAt: string;
  lastLoginAt: string | null;
}

/** Message in a consultation (from GET /api/v1/consultation/:id/messages) */
export interface ConsultationMessage {
  id: string;
  consultationId: string;
  senderId: string;
  senderRole: 'PATIENT' | 'DOCTOR' | 'ADMIN';
  content: string;
  messageType: string;
  createdAt: string;
  metadata?: Record<string, unknown> | null;
}

export interface IAdminRepository {
  getAnalyticsOverview(): Promise<AdminAnalyticsOverview>;
  getDashboardMetrics(params?: {
    range?: AdminDashboardMetricsRange;
    from?: string;
    to?: string;
  }): Promise<AdminDashboardMetrics>;

  getAdmins(): Promise<{ data: AdminListItem[] }>;
  createAdmin(data: { email: string; password: string }): Promise<{ id: string; email: string; message: string }>;

  getDoctors(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    status?: string;
  }): Promise<DoctorListResponse>;
  
  getPendingDoctors(params?: {
    page?: number;
    pageSize?: number;
    tokenNumber?: string;
    name?: string;
    phoneNumber?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<DoctorListResponse>;
  
  getDoctorById(id: string): Promise<DoctorDetails>;
  
  approveKyc(doctorId: string, notes?: string): Promise<void>;
  
  rejectKyc(doctorId: string, reason?: string): Promise<void>;
  
  suspendDoctor(doctorId: string): Promise<void>;
  
  unsuspendDoctor(doctorId: string): Promise<void>;
  
  /**
   * Get a temporary presigned URL for viewing a private document (e.g. KYC).
   * Backend allows admin to access any document. Use for aadhaarFrontUrl, panCardUrl, etc.
   */
  getPresignedGetUrl(documentUrl: string): Promise<string>;

  /**
   * Get presigned upload URL for admin icon uploads (specialization or medical approach).
   * Frontend must PUT the file to uploadUrl, then use publicUrl in create/update API.
   */
  getPresignedIconUploadUrl(
    purpose: 'specialization_icon' | 'medical_approach_icon',
    filename: string,
    contentType: string
  ): Promise<{ uploadUrl: string; publicUrl: string }>;
  
  // Patients
  getPatients(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PatientListResponse>;

  getPatientById(id: string): Promise<PatientDetails>;
  
  // Bookings
  getBookings(params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    fromDate?: string;
    toDate?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<any>;

  /**
   * Get message history for a consultation (admin can view any booking's chat).
   * Uses GET /api/v1/consultation/:consultationId/messages with admin JWT.
   */
  getConsultationMessages(
    consultationId: string,
    params?: { limit?: number; offset?: number; order?: 'asc' | 'desc' }
  ): Promise<{ data: ConsultationMessage[]; total: number }>;
  
  // Payouts
  getPayoutRequests(params?: {
    page?: number;
    pageSize?: number;
  }): Promise<any>;
  
  // Payments
  getPayments(params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    fromDate?: string;
    toDate?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<any>;
  
  verifyPaymentOrder(orderId: string): Promise<any>;
  
  // Dev utilities
  addTestMoney(params: { accountId: string; amount: number }): Promise<void>;
  
  // Specializations
  getSpecializations(): Promise<any[]>;
  createSpecialization(data: { name: string; iconUrl?: string }): Promise<any>;
  updateSpecialization(id: string, data: { name?: string; isActive?: boolean; iconUrl?: string | null }): Promise<any>;
  deleteSpecialization(id: string): Promise<void>;

  // Medical Approaches
  getMedicalApproaches(): Promise<any[]>;
  createMedicalApproach(data: { code: string; name: string; iconUrl?: string }): Promise<any>;
  updateMedicalApproach(
    id: string,
    data: { code?: string; name?: string; isActive?: boolean; iconUrl?: string | null }
  ): Promise<any>;
  deleteMedicalApproach(id: string): Promise<void>;
  
  // Symptoms
  getSymptoms(): Promise<any[]>;
  createSymptom(data: { name: string; specializationIds?: string[] }): Promise<any>;
  updateSymptom(id: string, data: { name?: string; isActive?: boolean; specializationIds?: string[] }): Promise<any>;
  deleteSymptom(id: string): Promise<void>;
  
  // Symptom Categories
  getSymptomCategories(): Promise<any[]>;
  getFullSymptoms(): Promise<{
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
  }>;
  createSymptomCategory(data: { 
    name: string; 
    displayOrder?: number; 
    symptomIds?: string[] 
  }): Promise<any>;
  updateSymptomCategory(id: string, data: { 
    name?: string; 
    displayOrder?: number; 
    isActive?: boolean;
    symptomIds?: string[] 
  }): Promise<any>;
  deleteSymptomCategory(id: string): Promise<void>;
  
  // Languages
  getLanguages(): Promise<any[]>;
  createLanguage(data: { name: string; code: string }): Promise<any>;
  updateLanguage(id: string, data: { name?: string; code?: string; isActive?: boolean }): Promise<any>;
  deleteLanguage(id: string): Promise<void>;
  
  // Medical Council
  getMedicalCouncils(): Promise<any[]>;
  createMedicalCouncil(data: { name: string }): Promise<any>;
  updateMedicalCouncil(id: string, data: { name: string }): Promise<any>;
  deleteMedicalCouncil(id: string): Promise<void>;
}
