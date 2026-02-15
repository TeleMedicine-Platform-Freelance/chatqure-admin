import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { PaginationState } from '@tanstack/react-table';
import { useService } from '@/app/providers/useDI';
import { ADMIN_SYMBOLS } from '../../di/symbols';
import type { IAdminRepository } from '../../domain/ports/IAdminRepository';
import { DataTable, type DataTableColumn } from '@/shared/ui/components/table/DataTable';
import { Badge } from '@/shared/ui/shadcn/components/ui/badge';

interface PayoutRequest {
  id: string;
  amount: string;
  status: string;
  requestedAt?: string;
  processedAt?: string;
}

export default function PayoutRequestsPage() {
  const repository = useService<IAdminRepository>(ADMIN_SYMBOLS.IAdminRepository);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['payout-requests', pagination],
    queryFn: async () => {
      return repository.getPayoutRequests({
        page: pagination.pageIndex + 1,
        pageSize: pagination.pageSize,
      });
    },
  });

  const columns: DataTableColumn<PayoutRequest>[] = useMemo(
    () => [
      {
        id: 'id',
        header: 'ID',
        cell: (row) => <span className="font-mono text-xs">{row.id.slice(0, 8)}...</span>,
        width: 120,
      },
      {
        id: 'amount',
        header: 'Amount',
        cell: (row) => <span className="font-medium">₹{row.amount || '0'}</span>,
        width: 150,
      },
      {
        id: 'status',
        header: 'Status',
        cell: (row) => {
          const status = row.status || 'PENDING';
          const variant =
            status === 'APPROVED' ? 'default' :
            status === 'REJECTED' ? 'destructive' :
            'outline';
          return <Badge variant={variant}>{status}</Badge>;
        },
        width: 120,
      },
      {
        id: 'requestedAt',
        header: 'Requested At',
        cell: (row) => row.requestedAt ? new Date(row.requestedAt).toLocaleDateString() : '-',
        width: 150,
      },
      {
        id: 'processedAt',
        header: 'Processed At',
        cell: (row) => row.processedAt ? new Date(row.processedAt).toLocaleDateString() : '-',
        width: 150,
      },
    ],
    []
  );

  return (
    <div className="container mx-auto py-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payout Requests</h1>
          <p className="text-muted-foreground">Manage doctor payout withdrawal requests</p>
        </div>
      </div>

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
        pageSizeOptions={[10, 25, 50, 100]}
        defaultPageSize={10}
        enableGlobalSearch
        enableColumnVisibility
        enableColumnResizing
        enableDensitySelector
        enableCsvExport
        storageKey="payout-requests-table-v1"
        labels={{
          loading: 'Loading payout requests...',
          noResults: 'No payout requests found',
          errorMessage: error instanceof Error ? error.message : 'Failed to load payout requests',
          search: 'Search payout requests...',
        }}
        emptyContent={
          <div className="text-center py-12">
            <p className="text-muted-foreground">No payout requests found</p>
          </div>
        }
      />
    </div>
  );
}
