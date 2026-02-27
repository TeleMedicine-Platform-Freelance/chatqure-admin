import type { PaginationState } from '@tanstack/react-table';

/**
 * Single source of truth for admin transactions list: filter options and API param derivation.
 * Aligns with GET /api/v1/admin/transactions (AdminTransactionsQueryDto).
 */

/** Sentinel for "all" in Select (Radix Select cannot use empty string as value). */
export const TRANSACTIONS_LIST_ALL_OPTION_VALUE = '__all__';

/** Owner type filter options (backend WalletOwnerType: USER = patient, DOCTOR, PLATFORM). */
export const TRANSACTIONS_LIST_OWNER_TYPE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: TRANSACTIONS_LIST_ALL_OPTION_VALUE, label: 'All owners' },
  { value: 'USER', label: 'Patients' },
  { value: 'DOCTOR', label: 'Doctors' },
  { value: 'PLATFORM', label: 'Platform' },
];

/** Transaction type filter options (backend TransactionType). */
export const TRANSACTIONS_LIST_TRANSACTION_TYPE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: TRANSACTIONS_LIST_ALL_OPTION_VALUE, label: 'All types' },
  { value: 'USER_RECHARGE', label: 'User recharge' },
  { value: 'CONSULTATION_DEBIT', label: 'Consultation debit' },
  { value: 'DOCTOR_EARNING_CREDIT', label: 'Doctor earning credit' },
  { value: 'PLATFORM_COMMISSION', label: 'Platform commission' },
  { value: 'GST_COMPONENT', label: 'GST component' },
];

export interface TransactionsListTableState {
  pagination: PaginationState;
  from: string;
  to: string;
  ownerType: string;
  transactionType: string;
  consultationId: string;
}

export interface TransactionsListApiParams {
  page: number;
  pageSize: number;
  from?: string;
  to?: string;
  ownerType?: string;
  transactionType?: string;
  consultationId?: string;
}

/**
 * Derives API params from table state for GET /admin/transactions.
 */
export function getTransactionsListApiParams(
  state: TransactionsListTableState
): TransactionsListApiParams {
  const { pagination, from, to, ownerType, transactionType, consultationId } = state;
  const trimmedConsultation = (consultationId || '').trim();
  return {
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
    ...(from && { from }),
    ...(to && { to }),
    ...(ownerType &&
      ownerType !== TRANSACTIONS_LIST_ALL_OPTION_VALUE && { ownerType }),
    ...(transactionType &&
      transactionType !== TRANSACTIONS_LIST_ALL_OPTION_VALUE && { transactionType }),
    ...(trimmedConsultation && { consultationId: trimmedConsultation }),
  };
}

/**
 * Query key fragment for useQuery. Keeps cache keys consistent with API params.
 */
export function getTransactionsListQueryKeyFragment(
  state: TransactionsListTableState
): unknown[] {
  const params = getTransactionsListApiParams(state);
  return [
    state.pagination,
    params.from,
    params.to,
    params.ownerType,
    params.transactionType,
    params.consultationId,
  ];
}
