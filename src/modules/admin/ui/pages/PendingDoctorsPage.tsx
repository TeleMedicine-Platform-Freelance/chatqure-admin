import { useMemo, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import type { SortingState, PaginationState } from '@tanstack/react-table';
import { useService } from '@/app/providers/useDI';
import { ADMIN_SYMBOLS } from '../../di/symbols';
import type { IAdminRepository } from '../../domain/ports/IAdminRepository';
import type { Doctor } from '../../domain/models/Doctor';
import { ADMIN_PATHS } from '../routes/paths';
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
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [tokenNumberFilter, setTokenNumberFilter] = useState('');
  const [nameFilter, setNameFilter] = useState('');
  const [phoneNumberFilter, setPhoneNumberFilter] = useState('');

  // Map frontend column IDs to backend sort field names
  const mapSortField = (columnId: string): string | undefined => {
    // Only createdAt is supported for pending doctors
    return columnId === 'createdAt' ? 'createdAt' : undefined;
  };

  // Fetch pending doctors
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['pendingDoctors', pagination, sorting, tokenNumberFilter, nameFilter, phoneNumberFilter],
    queryFn: async () => {
      const sort = sorting[0];
      const sortBy = sort ? mapSortField(sort.id) : 'createdAt';
      return repository.getPendingDoctors({
        page: pagination.pageIndex + 1,
        pageSize: pagination.pageSize,
        tokenNumber: tokenNumberFilter || undefined,
        name: nameFilter || undefined,
        phoneNumber: phoneNumberFilter || undefined,
        sortBy,
        sortOrder: sort?.desc ? 'desc' : 'asc',
      });
    },
  });

  // Navigate to doctor details page
  const handleViewDetails = useCallback(
    (doctor: Doctor) => {
      navigate(ADMIN_PATHS.DOCTOR_DETAILS.replace(':id', doctor.id));
    },
    [navigate]
  );

  // Define columns
  const columns: DataTableColumn<Doctor>[] = useMemo(
    () => [
      {
        id: 'tokenNumber',
        header: 'Token Number',
        cell: (row) => (
          <span className="font-mono font-medium">{row.tokenNumber || '-'}</span>
        ),
        sortable: false,
        accessorKey: 'tokenNumber',
        width: 150,
      },
      {
        id: 'name',
        header: 'Name',
        cell: (row) => <span className="font-medium">{row.name || '-'}</span>,
        sortable: false,
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
        sortable: false,
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
        cell: (row) => row.email || <span className="text-muted-foreground">-</span>,
        sortable: false,
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
          const label = typeof row.specialization === 'string' ? row.specialization : row.specialization.name;
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
        sortable: false,
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

      {/* Filter inputs */}
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="text-sm font-medium mb-1 block">Token Number</label>
          <input
            type="text"
            value={tokenNumberFilter}
            onChange={(e) => {
              setTokenNumberFilter(e.target.value);
              setPagination({ ...pagination, pageIndex: 0 });
            }}
            placeholder="Filter by token number..."
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        <div className="flex-1">
          <label className="text-sm font-medium mb-1 block">Name</label>
          <input
            type="text"
            value={nameFilter}
            onChange={(e) => {
              setNameFilter(e.target.value);
              setPagination({ ...pagination, pageIndex: 0 });
            }}
            placeholder="Filter by name..."
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        <div className="flex-1">
          <label className="text-sm font-medium mb-1 block">Phone Number</label>
          <input
            type="text"
            value={phoneNumberFilter}
            onChange={(e) => {
              setPhoneNumberFilter(e.target.value);
              setPagination({ ...pagination, pageIndex: 0 });
            }}
            placeholder="Filter by phone..."
            className="w-full px-3 py-2 border rounded-md"
          />
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
        onSortingChange={(newSorting) => {
          setSorting(newSorting);
        }}
        onGlobalFilterChange={(_search) => {
          // Not used for pending doctors, but required by DataTable
        }}
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
