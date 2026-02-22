import { useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import type {
  ColumnFiltersState,
  PaginationState,
  SortingState,
} from '@tanstack/react-table';

export interface ServerTableState {
  pagination: PaginationState;
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  globalFilter: string;
}

export interface UrlSyncConfig {
  /** Serialize table state to URL params (flat record) */
  serialize: (state: ServerTableState) => Record<string, string>;
  /** Parse URL params to partial table state (for initial load and back/forward) */
  parse: (params: URLSearchParams) => Partial<ServerTableState>;
}

export interface UseServerTableStateOptions {
  /** Initial page size */
  defaultPageSize?: number;
  /** Reset to first page when filters/sort/global search change */
  resetPageIndexOnFilterChange?: boolean;
  /** Sync state to URL (shareable links, back/forward). Requires React Router. */
  urlSync?: UrlSyncConfig;
}

const DEFAULT_OPTIONS: UseServerTableStateOptions = {
  defaultPageSize: 10,
  resetPageIndexOnFilterChange: true,
};

function mergeState(
  defaultState: ServerTableState,
  partial: Partial<ServerTableState>
): ServerTableState {
  return {
    pagination: partial.pagination ?? defaultState.pagination,
    sorting: partial.sorting ?? defaultState.sorting,
    columnFilters: partial.columnFilters ?? defaultState.columnFilters,
    globalFilter: partial.globalFilter ?? defaultState.globalFilter,
  };
}

/**
 * Reusable state for server-driven tables: pagination, sorting, column filters, global search.
 * Use with DataTable (mode="server") and derive API params in the page via a config (e.g. getDoctorsListApiParams).
 * Optional urlSync syncs state to URL for shareable links and browser back/forward.
 */
export function useServerTableState(
  options: UseServerTableStateOptions = {}
): {
  state: ServerTableState;
  setPagination: (updater: PaginationState | ((prev: PaginationState) => PaginationState)) => void;
  setSorting: (updater: SortingState | ((prev: SortingState) => SortingState)) => void;
  setColumnFilters: (updater: ColumnFiltersState | ((prev: ColumnFiltersState) => ColumnFiltersState)) => void;
  setGlobalFilter: (value: string) => void;
  onPaginationChange: (pagination: PaginationState) => void;
  onSortingChange: (sorting: SortingState) => void;
  onColumnFiltersChange: (filters: ColumnFiltersState) => void;
  onGlobalFilterChange: (search: string) => void;
} {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { defaultPageSize = 10, resetPageIndexOnFilterChange = true, urlSync } = opts;

  const defaultState: ServerTableState = {
    pagination: { pageIndex: 0, pageSize: defaultPageSize },
    sorting: [],
    columnFilters: [],
    globalFilter: '',
  };

  const [searchParams, setSearchParams] = useSearchParams();
  const lastSerializedRef = useRef<string | null>(null);

  const [pagination, setPaginationState] = useState<PaginationState>(defaultState.pagination);
  const [sorting, setSorting] = useState<SortingState>(defaultState.sorting);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(defaultState.columnFilters);
  const [globalFilter, setGlobalFilter] = useState(defaultState.globalFilter);

  const state: ServerTableState = {
    pagination,
    sorting,
    columnFilters,
    globalFilter,
  };

  // Initialize from URL on mount; sync URL -> state on back/forward (skip when URL was just set by us)
  useEffect(() => {
    if (!urlSync) return;
    const currentStr = searchParams.toString();
    if (currentStr && currentStr === lastSerializedRef.current) return;
    const parsed = urlSync.parse(searchParams);
    const merged = mergeState(defaultState, parsed);
    setPaginationState(merged.pagination);
    setSorting(merged.sorting);
    setColumnFilters(merged.columnFilters);
    setGlobalFilter(merged.globalFilter);
  }, [searchParams]);

  // When state changes (user action), sync state -> URL (skip if this update came from URL)
  useEffect(() => {
    if (!urlSync) return;
    const serialized = urlSync.serialize(state);
    const str = new URLSearchParams(serialized).toString();
    if (str === lastSerializedRef.current) return;
    lastSerializedRef.current = str;
    setSearchParams(serialized, { replace: true });
  }, [urlSync, state.pagination, state.sorting, state.columnFilters, state.globalFilter]);

  const setPagination = useCallback(
    (updater: PaginationState | ((prev: PaginationState) => PaginationState)) => {
      setPaginationState((prev) =>
        typeof updater === 'function' ? updater(prev) : updater
      );
    },
    []
  );

  const resetToFirstPage = useCallback(() => {
    if (!resetPageIndexOnFilterChange) return;
    setPaginationState((prev) => (prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 }));
  }, [resetPageIndexOnFilterChange]);

  const onPaginationChange = useCallback((newPagination: PaginationState) => {
    setPaginationState(newPagination);
  }, []);

  const onSortingChange = useCallback(
    (newSorting: SortingState) => {
      setSorting(newSorting);
      resetToFirstPage();
    },
    [resetToFirstPage]
  );

  const onColumnFiltersChange = useCallback(
    (filters: ColumnFiltersState) => {
      setColumnFilters(filters);
      resetToFirstPage();
    },
    [resetToFirstPage]
  );

  const onGlobalFilterChange = useCallback(
    (search: string) => {
      setGlobalFilter(search);
      resetToFirstPage();
    },
    [resetToFirstPage]
  );

  return {
    state,
    setPagination,
    setSorting,
    setColumnFilters,
    setGlobalFilter,
    onPaginationChange,
    onSortingChange,
    onColumnFiltersChange,
    onGlobalFilterChange,
  };
}
