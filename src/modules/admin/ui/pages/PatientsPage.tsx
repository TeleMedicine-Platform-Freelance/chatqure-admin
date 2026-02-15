import { useMemo, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import type { SortingState, PaginationState } from '@tanstack/react-table';
import { useService } from '@/app/providers/useDI';
import { ADMIN_SYMBOLS } from '../../di/symbols';
import type { IAdminRepository } from '../../domain/ports/IAdminRepository';
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
import { cn } from '@/shadcn/lib/utils';

interface Patient {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  dateOfBirth?: string;
  createdAt?: string;
  walletBalance?: string;
}

export default function PatientsPage() {
  const repository = useService<IAdminRepository>(ADMIN_SYMBOLS.IAdminRepository);
  const navigate = useNavigate();
  const location = useLocation();
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const selectedPatientId = useMemo(() => {
    const match = location.pathname.match(/\/admin\/patients\/([^/]+)$/);
    return match ? match[1] : null;
  }, [location.pathname]);

  const mapSortField = (columnId: string): string | undefined => {
    const fieldMap: Record<string, string> = {
      name: 'name',
      phoneNumber: 'phoneNumber',
      dateOfBirth: 'dateOfBirth',
      createdAt: 'createdAt',
    };
    return fieldMap[columnId] || 'createdAt';
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['patients', pagination, sorting, globalFilter],
    queryFn: async () => {
      const sort = sorting[0];
      const sortBy = sort ? mapSortField(sort.id) : undefined;
      return repository.getPatients({
        page: pagination.pageIndex + 1,
        pageSize: pagination.pageSize,
        search: globalFilter || undefined,
        sortBy,
        sortOrder: sort?.desc ? 'desc' : 'asc',
      });
    },
  });

  const handleViewDetails = useCallback(
    (patient: Patient) => {
      navigate(ADMIN_PATHS.PATIENT_DETAILS.replace(':id', patient.id));
    },
    [navigate]
  );

  const columns: DataTableColumn<Patient>[] = useMemo(
    () => [
      {
        id: 'name',
        header: 'Name',
        cell: (row) => (
          <div className="flex items-center gap-2">
            <span className={cn('font-medium', selectedPatientId === row.id && 'text-primary')}>
              {row.name || '-'}
            </span>
            {selectedPatientId === row.id && (
              <Badge variant="default" className="text-xs">Selected</Badge>
            )}
          </div>
        ),
        sortable: true,
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
        cell: (row) => row.phoneNumber || '-',
        sortable: true,
        accessorKey: 'phoneNumber',
        width: 150,
      },
      {
        id: 'email',
        header: 'Email',
        cell: (row) => row.email || '-',
        width: 200,
      },
      {
        id: 'walletBalance',
        header: 'Wallet Balance',
        cell: (row) => row.walletBalance ? `₹${row.walletBalance}` : '₹0',
        width: 150,
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
      },
    ],
    [handleViewDetails, selectedPatientId]
  );

  return (
    <div className="container mx-auto py-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Patients</h1>
          <p className="text-muted-foreground">Manage and view all registered patients</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data?.data || []}
        mode="server"
        isLoading={isLoading}
        isError={isError}
        totalCount={data?.pagination?.total || 0}
        getRowClassName={(patient) =>
          selectedPatientId === patient.id
            ? 'bg-primary/5 border-l-4 border-l-primary'
            : ''
        }
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
        storageKey="patients-table-v1"
        labels={{
          loading: 'Loading patients...',
          noResults: 'No patients found',
          errorMessage: error instanceof Error ? error.message : 'Failed to load patients',
          search: 'Search patients...',
        }}
        emptyContent={
          <div className="text-center py-12">
            <p className="text-muted-foreground">No patients found</p>
          </div>
        }
      />
    </div>
  );
}
