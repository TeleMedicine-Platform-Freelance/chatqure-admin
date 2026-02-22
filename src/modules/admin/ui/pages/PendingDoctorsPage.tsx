import { useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useService } from '@/app/providers/useDI';
import { ADMIN_SYMBOLS } from '../../di/symbols';
import type { IAdminRepository } from '../../domain/ports/IAdminRepository';
import type { Doctor } from '../../domain/models/Doctor';
import { ADMIN_PATHS } from '../routes/paths';
import {
  getPendingDoctorsListApiParams,
  getPendingDoctorsListQueryKeyFragment,
  serializePendingDoctorsListStateToParams,
  parsePendingDoctorsListParamsToState,
} from '../../config/pending-doctors-list.config';
import { useServerTableState } from '@/shared/hooks/useServerTableState';

const PENDING_DOCTORS_URL_SYNC = {
  serialize: serializePendingDoctorsListStateToParams,
  parse: parsePendingDoctorsListParamsToState,
};
import { DataTable, type DataTableColumn } from '@/shared/ui/components/table/DataTable';
import { Badge } from '@/shared/ui/shadcn/components/ui/badge';
import { Button } from '@/shadcn/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shadcn/components/ui/dropdown-menu';
import { MoreHorizontal, Eye } from 'lucide-react';

export default function PendingDoctorsPage() {
  const repository = useService<IAdminRepository>(ADMIN_SYMBOLS.IAdminRepository);
  const navigate = useNavigate();

  const {
    state: tableState,
    onPaginationChange,
    onSortingChange,
    onColumnFiltersChange,
  } = useServerTableState({
    defaultPageSize: 10,
    urlSync: PENDING_DOCTORS_URL_SYNC,
  });

  const apiParams = useMemo(
    () => getPendingDoctorsListApiParams(tableState),
    [tableState]
  );
  const queryKeyFragment = useMemo(
    () => getPendingDoctorsListQueryKeyFragment(tableState),
    [tableState]
  );

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['pendingDoctors', ...queryKeyFragment],
    queryFn: () => repository.getPendingDoctors(apiParams),
  });

  const handleViewDetails = useCallback(
    (doctor: Doctor) => {
      navigate(ADMIN_PATHS.DOCTOR_DETAILS.replace(':id', doctor.id));
    },
    [navigate]
  );

  const columns: DataTableColumn<Doctor>[] = useMemo(
    () => [
      {
        id: 'tokenNumber',
        header: 'Token Number',
        cell: (row) => (
          <span className="font-mono font-medium">{row.tokenNumber || '-'}</span>
        ),
        accessorKey: 'tokenNumber',
        filter: {
          type: 'text',
          placeholder: 'Filter by token (8 digits)...',
        },
        width: 150,
      },
      {
        id: 'name',
        header: 'Name',
        cell: (row) => <span className="font-medium">{row.name || '-'}</span>,
        accessorKey: 'name',
        filter: {
          type: 'text',
          placeholder: 'Search names...',
        },
        width: 200,
      },
      {
        id: 'phoneNumber',
        header: 'Phone Number',
        cell: (row) => row.phoneNumber,
        accessorKey: 'phoneNumber',
        filter: {
          type: 'text',
          placeholder: 'Search phone...',
        },
        width: 150,
      },
      {
        id: 'email',
        header: 'Email',
        cell: (row) => row.email ?? <span className="text-muted-foreground">-</span>,
        accessorKey: 'email',
        width: 200,
      },
      {
        id: 'specialization',
        header: 'Specialization',
        cell: (row) => {
          if (!row.specialization) {
            return <span className="text-muted-foreground">-</span>;
          }
          const label =
            typeof row.specialization === 'string'
              ? row.specialization
              : row.specialization.name;
          return (
            <Badge variant="secondary" className="text-xs">
              {label}
            </Badge>
          );
        },
        width: 200,
      },
      {
        id: 'experience',
        header: 'Experience',
        cell: (row) => {
          if (row.experience === undefined || row.experience === null) {
            return <span className="text-muted-foreground">-</span>;
          }
          return (
            <span>
              {row.experience} {row.experience === 1 ? 'year' : 'years'}
            </span>
          );
        },
        accessorKey: 'experience',
        width: 120,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: (row) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleViewDetails(row)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
        width: 80,
        visible: true,
      },
    ],
    [handleViewDetails]
  );

  return (
    <div className="container mx-auto py-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pending Doctors</h1>
          <p className="text-muted-foreground">
            Review and manage doctors with pending KYC applications
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        mode="server"
        isLoading={isLoading}
        isError={isError}
        totalCount={data?.pagination?.total ?? 0}
        onPaginationChange={onPaginationChange}
        onSortingChange={onSortingChange}
        onColumnFiltersChange={onColumnFiltersChange}
        onGlobalFilterChange={() => {}}
        pageSizeOptions={[10, 25, 50, 100]}
        defaultPageSize={10}
        enableGlobalSearch={false}
        enableColumnVisibility
        enableColumnResizing
        enableDensitySelector
        enableCsvExport
        storageKey="pending-doctors-table-v1"
        labels={{
          loading: 'Loading pending doctors...',
          noResults: 'No pending doctors found',
          errorMessage:
            error instanceof Error ? error.message : 'Failed to load pending doctors',
          search: 'Search pending doctors...',
        }}
        emptyContent={
          <div className="text-center py-12">
            <p className="text-muted-foreground">No pending doctors found</p>
          </div>
        }
      />
    </div>
  );
}
