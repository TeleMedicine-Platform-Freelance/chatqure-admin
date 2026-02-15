import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { SortingState, PaginationState } from '@tanstack/react-table';
import { useService } from '@/app/providers/useDI';
import { ADMIN_SYMBOLS } from '../../di/symbols';
import type { IAdminRepository } from '../../domain/ports/IAdminRepository';
import { DataTable, type DataTableColumn } from '@/shared/ui/components/table/DataTable';
import { Badge } from '@/shared/ui/shadcn/components/ui/badge';

interface Booking {
  id: string;
  bookingCode: string;
  clientName: string;
  clientPhoneNumber: string;
  doctorName: string;
  doctorPhoneNumber: string;
  bookingDate: string;
  acceptedAt: string | null;
  endedAt: string | null;
  status: string;
  mode: string;
}

export default function BookingsPage() {
  const repository = useService<IAdminRepository>(ADMIN_SYMBOLS.IAdminRepository);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const mapSortField = (columnId: string): string | undefined => {
    const fieldMap: Record<string, string> = {
      bookingDate: 'bookingDate',
      acceptedAt: 'acceptedAt',
      endedAt: 'endedAt',
      status: 'status',
    };
    return fieldMap[columnId] || 'bookingDate';
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['bookings', pagination, sorting, statusFilter],
    queryFn: async () => {
      const sort = sorting[0];
      const sortBy = sort ? mapSortField(sort.id) : undefined;
      return repository.getBookings({
        page: pagination.pageIndex + 1,
        pageSize: pagination.pageSize,
        status: statusFilter || undefined,
        sortBy,
        sortOrder: sort?.desc ? 'desc' : 'asc',
      });
    },
  });

  const columns: DataTableColumn<Booking>[] = useMemo(
    () => [
      {
        id: 'id',
        header: 'ID',
        cell: (row) => <span className="font-mono text-xs">{row.id.slice(0, 8)}...</span>,
        width: 120,
      },
      {
        id: 'bookingCode',
        header: 'Booking Code',
        cell: (row) => <span className="font-mono text-xs">{row.bookingCode}</span>,
        width: 200,
      },
      {
        id: 'clientName',
        header: 'Client',
        cell: (row) => (
          <div className="flex flex-col">
            <span>{row.clientName}</span>
            <span className="text-xs text-muted-foreground">{row.clientPhoneNumber}</span>
          </div>
        ),
        width: 200,
      },
      {
        id: 'doctorName',
        header: 'Doctor',
        cell: (row) => (
          <div className="flex flex-col">
            <span>{row.doctorName}</span>
            <span className="text-xs text-muted-foreground">{row.doctorPhoneNumber}</span>
          </div>
        ),
        width: 220,
      },
      {
        id: 'status',
        header: 'Status',
        cell: (row) => {
          const status = row.status || 'REQUESTED';
          const variant =
            status === 'SETTLED' ? 'default' :
            status === 'ENDED' ? 'secondary' :
            status === 'ACTIVE' ? 'default' :
            status === 'ACCEPTED' ? 'secondary' :
            'outline';
          return <Badge variant={variant}>{status}</Badge>;
        },
        filter: {
          type: 'select',
          options: [
            { label: 'Requested', value: 'REQUESTED' },
            { label: 'Accepted', value: 'ACCEPTED' },
            { label: 'Active', value: 'ACTIVE' },
            { label: 'Ended', value: 'ENDED' },
            { label: 'Settled', value: 'SETTLED' },
          ],
        },
        sortable: true,
        accessorKey: 'status',
        width: 120,
      },
      {
        id: 'mode',
        header: 'Mode',
        cell: (row) => <Badge variant="outline">{row.mode || 'CHAT'}</Badge>,
        width: 100,
      },
      {
        id: 'bookingDate',
        header: 'Booking Date',
        cell: (row) =>
          row.bookingDate ? new Date(row.bookingDate).toLocaleString() : '-',
        sortable: true,
        accessorKey: 'bookingDate',
        width: 180,
      },
      {
        id: 'acceptedAt',
        header: 'Accepted At',
        cell: (row) =>
          row.acceptedAt ? new Date(row.acceptedAt).toLocaleString() : '-',
        sortable: true,
        accessorKey: 'acceptedAt',
        width: 180,
      },
      {
        id: 'endedAt',
        header: 'Ended At',
        cell: (row) =>
          row.endedAt ? new Date(row.endedAt).toLocaleString() : '-',
        sortable: true,
        accessorKey: 'endedAt',
        width: 180,
      },
    ],
    []
  );

  return (
    <div className="container mx-auto py-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bookings</h1>
          <p className="text-muted-foreground">View all consultation bookings</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data?.data || []}
        mode="server"
        isLoading={isLoading}
        isError={isError}
        totalCount={data?.pagination?.total ?? data?.data?.length ?? 0}
        onPaginationChange={(newPagination) => {
          setPagination(newPagination);
        }}
        onSortingChange={(newSorting) => {
          setSorting(newSorting);
        }}
        onGlobalFilterChange={(search) => {
          setGlobalFilter(search);
          setPagination({ ...pagination, pageIndex: 0 });
        }}
        pageSizeOptions={[10, 25, 50, 100]}
        defaultPageSize={10}
        enableGlobalSearch
        enableColumnVisibility
        enableColumnResizing
        enableDensitySelector
        enableCsvExport
        storageKey="bookings-table-v1"
        labels={{
          loading: 'Loading bookings...',
          noResults: 'No bookings found',
          errorMessage: error instanceof Error ? error.message : 'Failed to load bookings',
          search: 'Search bookings...',
        }}
        emptyContent={
          <div className="text-center py-12">
            <p className="text-muted-foreground">No bookings found</p>
          </div>
        }
      />
    </div>
  );
}
