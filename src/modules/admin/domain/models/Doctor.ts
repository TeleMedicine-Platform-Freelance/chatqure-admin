/**
 * Doctor Domain Models
 * Matches backend GetDoctorsResponseDto structure
 */

export interface Specialization {
  id: string;
  name: string;
}

export interface Language {
  id: string;
  name: string;
  code: string;
}

export interface MedicalCouncil {
  id: string;
  name: string;
  state?: string | null;
}

export interface Doctor {
  id: string;
  name: string; // Included in list response
  phoneNumber: string;
  tokenNumber: string | null;
  accountStatus: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  kycStatus: 'PENDING' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';
  specialization: string | Specialization | null; // In list response (string in list, Specialization in details)
  ratingAvg: number | string | null; // number in list, string in details response
  ratingCount: number;
  email?: string | null;
  experience?: number | null;
}

export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export interface DoctorDetails extends Doctor {
  name: string;
  tokenNumber: string | null;
  email: string | null;
  gender?: Gender | null;
  kycRejectionReason: string | null;
  kycSubmittedAt: string | null;
  kycVerifiedAt: string | null;
  specialization: Specialization | null;
  registrationNumber: string | null;
  registrationYear: number | null;
  aadhaarNumber: string | null;
  aadhaarFrontUrl: string | null;
  aadhaarBackUrl: string | null;
  panNumber: string | null;
  panCardUrl: string | null;
  educationCertUrl: string | null;
  ratePerMinute: string | null;
  ratingAvg: string | null;
  languages: Language[];
  createdAt: string;
  accountCreatedAt: string;
  lastLoginAt: string | null;
  updatedAt?: string;
  medicalCouncil?: MedicalCouncil | null;
  medicalCouncilOther?: string | null;
  medicalApproach?: string | null;
  about?: string | null;
  currentWorkplace?: string | null;
  profilePictureUrl?: string | null;
  photoUrls?: string[];
  walletBalance?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface DoctorListResponse {
  data: Doctor[];
  pagination: PaginationMeta;
}
