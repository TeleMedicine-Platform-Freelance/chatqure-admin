/**
 * Patient Domain Models
 * Aligned with backend GetPatientsResponseDto and GetPatientDetailResponseDto
 */

export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

/** List item from GET /admin/patients */
export interface Patient {
  id: string;
  clientCode: string;
  name: string;
  phoneNumber: string;
  gender: Gender | null;
  dateOfBirth: string | null;
  ageYears: number | null;
  height: number | null;
  weight: number | null;
  walletBalance: string;
  createdAt: string;
}

/** Detail from GET /admin/patients/:id */
export interface PatientDetails extends Patient {
  profilePictureUrl: string | null;
  bloodGroup: string | null;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PatientListResponse {
  data: Patient[];
  pagination: PaginationMeta;
}
