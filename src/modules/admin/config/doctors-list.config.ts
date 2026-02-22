import type { ColumnFiltersState, PaginationState, SortingState } from '@tanstack/react-table';

/**
 * Single source of truth for doctors list: column IDs, backend param names, and API param derivation.
 * Use this for DataTable column definitions, useServerTableState, and repository calls.
 */

/** Backend sort field names (column id -> backend sortBy) */
export const DOCTORS_LIST_SORT_FIELDS: Record<string, string> = {
  name: 'email',
  phoneNumber: 'email',
  experience: 'experience',
  kycStatus: 'kycStatus',
  createdAt: 'createdAt',
  email: 'email',
  ratingAvg: 'ratingAvg',
  ratingCount: 'ratingCount',
} as const;

/** Default sort field when none selected */
export const DOCTORS_LIST_DEFAULT_SORT_FIELD = 'createdAt';

/** Valid KYC status filter values (aligned with backend DoctorApprovalStatus) */
export const DOCTORS_LIST_KYC_STATUSES = [
  'PENDING',
  'SUBMITTED',
  'VERIFIED',
  'REJECTED',
  'EXPIRED',
] as const;

/** Minimum search length (aligned with backend GetDoctorsQueryDto) */
export const DOCTORS_LIST_SEARCH_MIN_LENGTH = 2;

export interface DoctorsListApiParams {
  page: number;
  pageSize: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DoctorsListTableState {
  pagination: PaginationState;
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  globalFilter: string;
}

/**
 * Derives API params from table state for GET /admin/doctors.
 * Global search and name/phone column filters are combined into a single `search` param.
 */
export function getDoctorsListApiParams(state: DoctorsListTableState): DoctorsListApiParams {
  const { pagination, sorting, columnFilters, globalFilter } = state;

  const searchParam = deriveSearchParam(globalFilter, columnFilters);
  const statusParam = deriveStatusParam(columnFilters);
  const sort = sorting[0];
  const sortBy = sort
    ? (DOCTORS_LIST_SORT_FIELDS[sort.id] ?? DOCTORS_LIST_DEFAULT_SORT_FIELD)
    : DOCTORS_LIST_DEFAULT_SORT_FIELD;
  const sortOrder = sort?.desc ? 'desc' : 'asc';

  return {
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
    ...(searchParam && { search: searchParam }),
    ...(statusParam && { status: statusParam }),
    sortBy,
    sortOrder,
  };
}

/**
 * Query key fragment for useQuery: [pagination, sorting, searchParam, statusParam].
 * Keeps cache keys consistent with API params.
 */
export function getDoctorsListQueryKeyFragment(state: DoctorsListTableState): unknown[] {
  const params = getDoctorsListApiParams(state);
  return [
    state.pagination,
    state.sorting,
    params.search,
    params.status,
  ];
}

function deriveSearchParam(globalFilter: string, columnFilters: ColumnFiltersState): string | undefined {
  const g = (globalFilter || '').trim();
  if (g.length >= DOCTORS_LIST_SEARCH_MIN_LENGTH) return g;
  const nameVal = (columnFilters.find((f) => f.id === 'name')?.value as string)?.trim?.();
  const phoneVal = (columnFilters.find((f) => f.id === 'phoneNumber')?.value as string)?.trim?.();
  const combined = nameVal || phoneVal || '';
  return combined.length >= DOCTORS_LIST_SEARCH_MIN_LENGTH ? combined : undefined;
}

function deriveStatusParam(columnFilters: ColumnFiltersState): string | undefined {
  const kyc = columnFilters.find((f) => f.id === 'kycStatus')?.value as string | undefined;
  const valid = new Set<string>(DOCTORS_LIST_KYC_STATUSES);
  return kyc && valid.has(kyc) ? kyc : undefined;
}

/** Backend sortBy -> column id (for URL parse) */
const SORT_BY_TO_COLUMN_ID: Record<string, string> = {
  createdAt: 'createdAt',
  email: 'name',
  experience: 'experience',
  kycStatus: 'kycStatus',
  ratingAvg: 'ratingAvg',
  ratingCount: 'ratingCount',
};

/**
 * Serialize table state to URL search params (for shareable links).
 */
export function serializeDoctorsListStateToParams(
  state: DoctorsListTableState
): Record<string, string> {
  const params = getDoctorsListApiParams(state);
  const out: Record<string, string> = {
    page: String(params.page),
    pageSize: String(params.pageSize),
    sortBy: params.sortBy ?? DOCTORS_LIST_DEFAULT_SORT_FIELD,
    sortOrder: params.sortOrder ?? 'desc',
  };
  if (params.search) out.search = params.search;
  if (params.status) out.status = params.status;
  return out;
}

/**
 * Parse URL search params to partial table state (for initial load and back/forward).
 */
export function parseDoctorsListParamsToState(
  params: URLSearchParams
): Partial<DoctorsListTableState> {
  const page = params.get('page');
  const pageSize = params.get('pageSize');
  const sortBy = params.get('sortBy');
  const sortOrder = params.get('sortOrder');
  const search = params.get('search');
  const status = params.get('status');

  const pagination: PaginationState | undefined =
    page != null || pageSize != null
      ? {
          pageIndex: page ? Math.max(0, parseInt(page, 10) - 1) : 0,
          pageSize: pageSize ? Math.max(1, parseInt(pageSize, 10)) : 10,
        }
      : undefined;

  const sorting: SortingState | undefined =
    sortBy && SORT_BY_TO_COLUMN_ID[sortBy]
      ? [{ id: SORT_BY_TO_COLUMN_ID[sortBy], desc: sortOrder === 'desc' }]
      : undefined;

  const columnFilters: ColumnFiltersState = [];
  if (status && new Set(DOCTORS_LIST_KYC_STATUSES).has(status)) {
    columnFilters.push({ id: 'kycStatus', value: status });
  }

  return {
    ...(pagination && { pagination }),
    ...(sorting && { sorting }),
    ...(columnFilters.length > 0 && { columnFilters }),
    ...(search != null && search !== '' && { globalFilter: search }),
  };
}
