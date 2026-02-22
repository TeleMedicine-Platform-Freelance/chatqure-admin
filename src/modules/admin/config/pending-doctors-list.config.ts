import type {
  ColumnFiltersState,
  PaginationState,
  SortingState,
} from '@tanstack/react-table';

/**
 * Single source of truth for admin pending doctors list: API param derivation and URL sync.
 * Backend: tokenNumber (exact 8 digits), name (min 2), phoneNumber (E.164 exact); sort by createdAt only.
 */

export const PENDING_DOCTORS_LIST_SORT_FIELDS: Record<string, string> = {
  createdAt: 'createdAt',
};

export const PENDING_DOCTORS_LIST_DEFAULT_SORT_FIELD = 'createdAt';

/** Token number must be exactly 8 digits (backend validation) */
export const PENDING_DOCTORS_TOKEN_LENGTH = 8;

/** Name search min length (backend) */
export const PENDING_DOCTORS_NAME_MIN_LENGTH = 2;

export interface PendingDoctorsListApiParams {
  page: number;
  pageSize: number;
  tokenNumber?: string;
  name?: string;
  phoneNumber?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PendingDoctorsListTableState {
  pagination: PaginationState;
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  globalFilter: string;
}

/**
 * Derives API params from table state for GET /admin/doctors/pending.
 */
export function getPendingDoctorsListApiParams(
  state: PendingDoctorsListTableState
): PendingDoctorsListApiParams {
  const { pagination, sorting, columnFilters } = state;

  const tokenNumber = (columnFilters.find((f) => f.id === 'tokenNumber')?.value as string)?.trim?.();
  const name = (columnFilters.find((f) => f.id === 'name')?.value as string)?.trim?.();
  const phoneNumber = (columnFilters.find((f) => f.id === 'phoneNumber')?.value as string)?.trim?.();

  const sort = sorting[0];
  const sortBy =
    sort && PENDING_DOCTORS_LIST_SORT_FIELDS[sort.id]
      ? PENDING_DOCTORS_LIST_SORT_FIELDS[sort.id]
      : PENDING_DOCTORS_LIST_DEFAULT_SORT_FIELD;
  const sortOrder = sort?.desc ? 'desc' : 'asc';

  return {
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
    ...(tokenNumber && tokenNumber.length === PENDING_DOCTORS_TOKEN_LENGTH && { tokenNumber }),
    ...(name && name.length >= PENDING_DOCTORS_NAME_MIN_LENGTH && { name }),
    ...(phoneNumber && { phoneNumber }),
    sortBy,
    sortOrder,
  };
}

export function getPendingDoctorsListQueryKeyFragment(
  state: PendingDoctorsListTableState
): unknown[] {
  const params = getPendingDoctorsListApiParams(state);
  return [state.pagination, state.sorting, params.tokenNumber, params.name, params.phoneNumber];
}

const SORT_BY_TO_COLUMN_ID: Record<string, string> = {
  createdAt: 'createdAt',
};

export function serializePendingDoctorsListStateToParams(
  state: PendingDoctorsListTableState
): Record<string, string> {
  const params = getPendingDoctorsListApiParams(state);
  const out: Record<string, string> = {
    page: String(params.page),
    pageSize: String(params.pageSize),
    sortBy: params.sortBy ?? PENDING_DOCTORS_LIST_DEFAULT_SORT_FIELD,
    sortOrder: params.sortOrder ?? 'asc',
  };
  if (params.tokenNumber) out.tokenNumber = params.tokenNumber;
  if (params.name) out.name = params.name;
  if (params.phoneNumber) out.phoneNumber = params.phoneNumber;
  return out;
}

export function parsePendingDoctorsListParamsToState(
  params: URLSearchParams
): Partial<PendingDoctorsListTableState> {
  const page = params.get('page');
  const pageSize = params.get('pageSize');
  const sortBy = params.get('sortBy');
  const sortOrder = params.get('sortOrder');
  const tokenNumber = params.get('tokenNumber');
  const name = params.get('name');
  const phoneNumber = params.get('phoneNumber');

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
  if (tokenNumber) columnFilters.push({ id: 'tokenNumber', value: tokenNumber });
  if (name) columnFilters.push({ id: 'name', value: name });
  if (phoneNumber) columnFilters.push({ id: 'phoneNumber', value: phoneNumber });

  return {
    ...(pagination && { pagination }),
    ...(sorting && { sorting }),
    ...(columnFilters.length > 0 && { columnFilters }),
  };
}
