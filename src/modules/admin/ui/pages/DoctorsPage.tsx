import { useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { useService } from '@/app/providers/useDI';
import { ADMIN_SYMBOLS } from '../../di/symbols';
import type { IAdminRepository } from '../../domain/ports/IAdminRepository';
import type { Doctor } from '../../domain/models/Doctor';
import { ADMIN_PATHS } from '../routes/paths';
import {
  getDoctorsListApiParams,
  getDoctorsListQueryKeyFragment,
  serializeDoctorsListStateToParams,
  parseDoctorsListParamsToState,
  DOCTORS_LIST_KYC_STATUSES,
} from '../../config/doctors-list.config';
import { useServerTableState } from '@/shared/hooks/useServerTableState';
import PageLayout from '@/shared/ui/components/PageLayout';
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

const KYC_FILTER_OPTIONS = DOCTORS_LIST_KYC_STATUSES.map((value) => ({
  label: value.charAt(0) + value.slice(1).toLowerCase(),
  value,
}));

const DOCTORS_URL_SYNC = {
  serialize: serializeDoctorsListStateToParams,
  parse: parseDoctorsListParamsToState,
};

export default function DoctorsPage() {
  const repository = useService<IAdminRepository>(ADMIN_SYMBOLS.IAdminRepository);
  const navigate = useNavigate();
  const location = useLocation();

  const {
    state: tableState,
    onPaginationChange,
    onSortingChange,
    onColumnFiltersChange,
    onGlobalFilterChange,
  } = useServerTableState({
    defaultPageSize: 10,
    urlSync: DOCTORS_URL_SYNC,
  });

  const apiParams = useMemo(
    () => getDoctorsListApiParams(tableState),
    [tableState]
  );
  const queryKeyFragment = useMemo(
    () => getDoctorsListQueryKeyFragment(tableState),
    [tableState]
  );

  const selectedDoctorId = useMemo(() => {
    const match = location.pathname.match(/\/admin\/doctors\/([^/]+)$/);
    return match ? match[1] : null;
  }, [location.pathname]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['doctors', ...queryKeyFragment],
    queryFn: () => repository.getDoctors(apiParams),
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
        id: 'name',
        header: 'Name',
        cell: (row) => (
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'font-medium',
                selectedDoctorId === row.id && 'text-primary'
              )}
            >
              {row.name}
            </span>
            {selectedDoctorId === row.id && (
              <Badge variant="default" className="text-xs">
                Selected
              </Badge>
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
        cell: (row) => row.phoneNumber,
        sortable: true,
        accessorKey: 'phoneNumber',
        filter: {
          type: 'text',
          placeholder: 'Search phone...',
        },
        width: 150,
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
        sortable: true,
        accessorKey: 'experience',
        width: 120,
      },
      {
        id: 'kycStatus',
        header: 'KYC Status',
        cell: (row) => {
          const status = row.kycStatus || 'PENDING';
          const variant =
            status === 'VERIFIED'
              ? 'default'
              : status === 'REJECTED'
                ? 'destructive'
                : status === 'SUBMITTED'
                  ? 'secondary'
                  : 'outline';
          return <Badge variant={variant}>{status}</Badge>;
        },
        filter: {
          type: 'select',
          options: KYC_FILTER_OPTIONS,
        },
        sortable: true,
        accessorKey: 'kycStatus',
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
    [handleViewDetails, selectedDoctorId]
  );

  return (
    <PageLayout
      title="Doctors"
      subtitle="Manage and view all registered doctors"
      gap="md"
    >
      <div className="space-y-4">
        <DataTable
        columns={columns}
        data={data?.data || []}
        mode="server"
        isLoading={isLoading}
        isError={isError}
        totalCount={data?.pagination?.total || 0}
        getRowClassName={(doctor) =>
          selectedDoctorId === doctor.id
            ? 'bg-primary/5 border-l-4 border-l-primary'
            : ''
        }
        onPaginationChange={onPaginationChange}
        onSortingChange={onSortingChange}
        onGlobalFilterChange={onGlobalFilterChange}
        onColumnFiltersChange={onColumnFiltersChange}
        pageSizeOptions={[10, 25, 50, 100]}
        defaultPageSize={10}
        enableGlobalSearch
        enableColumnVisibility
        enableColumnResizing
        enableDensitySelector
        enableCsvExport
        storageKey="doctors-table-v1"
        labels={{
          loading: 'Loading doctors...',
          noResults: 'No doctors found',
          errorMessage:
            error instanceof Error ? error.message : 'Failed to load doctors',
          search: 'Search doctors...',
        }}
        emptyContent={
          <div className="text-center py-12">
            <p className="text-muted-foreground">No doctors found</p>
          </div>
        }
      />
      </div>
    </PageLayout>
  );
}
