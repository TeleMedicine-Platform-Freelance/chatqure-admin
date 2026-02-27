import type {
  ColumnFiltersState,
  PaginationState,
  SortingState,
} from '@tanstack/react-table';

/**
 * Single source of truth for admin patients list: column IDs, backend param names, API param derivation.
 */

/** Backend sort field names (must match GetPatientsQueryDto / PatientsSortField) */
export const PATIENTS_LIST_SORT_FIELDS: Record<string, string> = {
  name: 'name',
  dateOfBirth: 'dateOfBirth',
  createdAt: 'createdAt',
};

export const PATIENTS_LIST_DEFAULT_SORT_FIELD = 'createdAt';

/** Minimum search length (aligned with backend GetPatientsQueryDto) */
export const PATIENTS_LIST_SEARCH_MIN_LENGTH = 2;

export interface PatientsListApiParams {
  page: number;
  pageSize: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PatientsListTableState {
  pagination: PaginationState;
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  globalFilter: string;
}

/**
 * Derives API params from table state for GET /admin/patients.
 */
export function getPatientsListApiParams(
  state: PatientsListTableState
): PatientsListApiParams {
  const { pagination, sorting, columnFilters, globalFilter } = state;

  const searchParam = deriveSearchParam(globalFilter, columnFilters);
  const sort = sorting[0];
  const sortBy = sort
    ? (PATIENTS_LIST_SORT_FIELDS[sort.id] ?? PATIENTS_LIST_DEFAULT_SORT_FIELD)
    : PATIENTS_LIST_DEFAULT_SORT_FIELD;
  const sortOrder = sort ? (sort.desc ? 'desc' : 'asc') : 'desc';

  return {
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
    ...(searchParam && { search: searchParam }),
    sortBy,
    sortOrder,
  };
}

export function getPatientsListQueryKeyFragment(
  state: PatientsListTableState
): unknown[] {
  const params = getPatientsListApiParams(state);
  return [state.pagination, state.sorting, params.search];
}

function deriveSearchParam(
  globalFilter: string,
  columnFilters: ColumnFiltersState
): string | undefined {
  const g = (globalFilter || '').trim();
  if (g.length >= PATIENTS_LIST_SEARCH_MIN_LENGTH) return g;
  const nameVal = (columnFilters.find((f) => f.id === 'name')?.value as string)
    ?.trim?.();
  const phoneVal = (
    columnFilters.find((f) => f.id === 'phoneNumber')?.value as string
  )?.trim?.();
  const combined = nameVal || phoneVal || '';
  return combined.length >= PATIENTS_LIST_SEARCH_MIN_LENGTH ? combined : undefined;
}

const SORT_BY_TO_COLUMN_ID: Record<string, string> = {
  name: 'name',
  dateOfBirth: 'dateOfBirth',
  createdAt: 'createdAt',
};

export function serializePatientsListStateToParams(
  state: PatientsListTableState
): Record<string, string> {
  const params = getPatientsListApiParams(state);
  return {
    page: String(params.page),
    pageSize: String(params.pageSize),
    sortBy: params.sortBy ?? PATIENTS_LIST_DEFAULT_SORT_FIELD,
    sortOrder: params.sortOrder ?? 'desc',
    ...(params.search && { search: params.search }),
  };
}

export function parsePatientsListParamsToState(
  params: URLSearchParams
): Partial<PatientsListTableState> {
  const page = params.get('page');
  const pageSize = params.get('pageSize');
  const sortBy = params.get('sortBy');
  const sortOrder = params.get('sortOrder');
  const search = params.get('search');

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

  return {
    ...(pagination && { pagination }),
    ...(sorting && { sorting }),
    ...(search != null && search !== '' && { globalFilter: search }),
  };
}
