/**
 * Admin Repository Interface
 */

import type { DoctorDetails, DoctorListResponse } from '../models/Doctor';

export interface AdminAnalyticsOverview {
  totalDoctors: number;
  verifiedDoctors: number;
  pendingKyc: number;
  totalPatients: number;
  totalConsultations: number;
  activeConsultations: number;
}

export interface AdminDashboardMetrics {
  totalPlatformBalance: string;
  totalGstCollection: string;
  totalCommission: string;
  totalDoctorsBalance: string;
  totalPatientsBalance: string;
  totalRazorpayDeposits: string;
}

export interface IAdminRepository {
  getAnalyticsOverview(): Promise<AdminAnalyticsOverview>;
  getDashboardMetrics(): Promise<AdminDashboardMetrics>;
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
  
  // Patients
  getPatients(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<any>;
  
  getPatientById(id: string): Promise<any>;
  
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
  createSpecialization(data: { name: string }): Promise<any>;
  updateSpecialization(id: string, data: { name?: string; isActive?: boolean }): Promise<any>;
  deleteSpecialization(id: string): Promise<void>;
  
  // Symptoms
  getSymptoms(): Promise<any[]>;
  createSymptom(data: { name: string; categoryId?: string }): Promise<any>;
  updateSymptom(id: string, data: { name: string; categoryId?: string }): Promise<any>;
  deleteSymptom(id: string): Promise<void>;
  
  // Symptom Categories
  getSymptomCategories(): Promise<any[]>;
  createSymptomCategory(data: { name: string }): Promise<any>;
  updateSymptomCategory(id: string, data: { name: string }): Promise<any>;
  deleteSymptomCategory(id: string): Promise<void>;
  
  // Languages
  getLanguages(): Promise<any[]>;
  createLanguage(data: { name: string; code: string }): Promise<any>;
  updateLanguage(id: string, data: { name: string; code: string }): Promise<any>;
  deleteLanguage(id: string): Promise<void>;
  
  // Medical Council
  getMedicalCouncils(): Promise<any[]>;
  createMedicalCouncil(data: { name: string }): Promise<any>;
  updateMedicalCouncil(id: string, data: { name: string }): Promise<any>;
  deleteMedicalCouncil(id: string): Promise<void>;
}
