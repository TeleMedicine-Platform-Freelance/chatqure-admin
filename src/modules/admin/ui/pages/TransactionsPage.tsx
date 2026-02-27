import { useMemo, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { PaginationState } from '@tanstack/react-table';
import { useService } from '@/app/providers/useDI';
import { ADMIN_SYMBOLS } from '../../di/symbols';
import type { IAdminRepository } from '../../domain/ports/IAdminRepository';
import {
  getTransactionsListApiParams,
  getTransactionsListQueryKeyFragment,
  TRANSACTIONS_LIST_ALL_OPTION_VALUE,
  TRANSACTIONS_LIST_OWNER_TYPE_OPTIONS,
  TRANSACTIONS_LIST_TRANSACTION_TYPE_OPTIONS,
} from '../../config/transactions-list.config';
import PageLayout from '@/shared/ui/components/PageLayout';
import { DataTable, type DataTableColumn } from '@/shared/ui/components/table/DataTable';
import { Badge } from '@/shared/ui/shadcn/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/shared/ui/shadcn/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/shadcn/components/ui/select';
import { Input } from '@/shared/ui/shadcn/components/ui/input';
import { Label } from '@/shared/ui/shadcn/components/ui/label';
import { Button } from '@/shadcn/components/ui/button';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface AdminTransaction {
  id: string;
  walletId: string;
  ownerType: string;
  accountId: string;
  transactionType: string;
  amount: string;
  currency: string;
  referenceId?: string | null;
  referenceType?: string | null;
  consultationId?: string | null;
  bookingNumber?: string | null;
  createdAt: string;
}

export default function TransactionsPage() {
  const repository = useService<IAdminRepository>(ADMIN_SYMBOLS.IAdminRepository);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [ownerType, setOwnerType] = useState(TRANSACTIONS_LIST_ALL_OPTION_VALUE);
  const [transactionType, setTransactionType] = useState(
    TRANSACTIONS_LIST_ALL_OPTION_VALUE
  );
  const [consultationFilter, setConsultationFilter] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const tableState = useMemo(
    () => ({
      pagination,
      from: fromDate,
      to: toDate,
      ownerType,
      transactionType,
      consultationId: consultationFilter,
    }),
    [pagination, fromDate, toDate, ownerType, transactionType, consultationFilter]
  );

  const apiParams = useMemo(
    () => getTransactionsListApiParams(tableState),
    [tableState]
  );
  const queryKeyFragment = useMemo(
    () => getTransactionsListQueryKeyFragment(tableState),
    [tableState]
  );

  const resetPage = useCallback(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, []);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['transactions', ...queryKeyFragment],
    queryFn: () => repository.getTransactions(apiParams),
  });

  const columns: DataTableColumn<AdminTransaction>[] = useMemo(
    () => [
      {
        id: 'ownerType',
        header: 'Owner',
        cell: (row) => {
          const label =
            row.ownerType === 'USER'
              ? 'Patient'
              : row.ownerType === 'DOCTOR'
                ? 'Doctor'
                : 'Platform';
          return <Badge variant="outline">{label}</Badge>;
        },
        width: 140,
      },
      {
        id: 'transactionType',
        header: 'Type',
        cell: (row) => <span className="text-sm">{row.transactionType}</span>,
        width: 200,
      },
      {
        id: 'amount',
        header: 'Amount',
        cell: (row) => (
          <span className="font-medium">
            {row.currency} {row.amount}
          </span>
        ),
        width: 140,
      },
      {
        id: 'bookingNumber',
        header: 'Booking / Consultation',
        cell: (row) => {
          if (row.bookingNumber) {
            return <span className="font-mono text-xs">{row.bookingNumber}</span>;
          }
          if (row.consultationId) {
            return (
              <span className="font-mono text-xs">
                {row.consultationId.slice(0, 8)}...
              </span>
            );
          }
          return <span className="text-muted-foreground text-xs">—</span>;
        },
        width: 200,
      },
      {
        id: 'createdAt',
        header: 'Created At',
        cell: (row) => new Date(row.createdAt).toLocaleString(),
        width: 200,
      },
    ],
    []
  );

  return (
    <PageLayout
      title="Transactions"
      subtitle="Wallet transactions inside the platform (internal ledger) with filters for owner type, date range, and consultation. For Razorpay payment orders, use the Payments page."
      gap="md"
    >
      <div className="space-y-4">
        <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            {filtersOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            Filters
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div className="space-y-1">
              <Label htmlFor="transactions-from">From date</Label>
              <Input
                id="transactions-from"
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  resetPage();
                }}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="transactions-to">To date</Label>
              <Input
                id="transactions-to"
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  resetPage();
                }}
              />
            </div>
            <div className="space-y-1">
              <Label>Owner type</Label>
              <Select
                value={ownerType}
                onValueChange={(v) => {
                  setOwnerType(v);
                  resetPage();
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All owners" />
                </SelectTrigger>
                <SelectContent>
                  {TRANSACTIONS_LIST_OWNER_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Transaction type</Label>
              <Select
                value={transactionType}
                onValueChange={(v) => {
                  setTransactionType(v);
                  resetPage();
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  {TRANSACTIONS_LIST_TRANSACTION_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <DataTable
        columns={columns}
        data={data?.data || []}
        mode="server"
        isLoading={isLoading}
        isError={isError}
        totalCount={data?.pagination?.total || 0}
        onPaginationChange={(newPagination) => {
          setPagination(newPagination);
        }}
        onGlobalFilterChange={(search) => {
          setConsultationFilter(search);
          resetPage();
        }}
        pageSizeOptions={[10, 25, 50, 100]}
        defaultPageSize={10}
        enableGlobalSearch
        enableColumnVisibility
        enableColumnResizing
        enableDensitySelector
        enableCsvExport
        storageKey="transactions-table-v1"
        labels={{
          loading: 'Loading transactions...',
          noResults: 'No transactions found',
          errorMessage:
            error instanceof Error ? error.message : 'Failed to load transactions',
          search: 'Search transactions...',
        }}
        emptyContent={
          <div className="text-center py-12">
            <p className="text-muted-foreground">No transactions found</p>
          </div>
        }
      />
      </div>
    </PageLayout>
  );
}
