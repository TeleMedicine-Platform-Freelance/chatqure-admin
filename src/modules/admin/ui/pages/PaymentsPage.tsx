import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SortingState, PaginationState } from '@tanstack/react-table';
import { useService } from '@/app/providers/useDI';
import { ADMIN_SYMBOLS } from '../../di/symbols';
import type { IAdminRepository } from '../../domain/ports/IAdminRepository';
import PageLayout from '@/shared/ui/components/PageLayout';
import { DataTable, type DataTableColumn } from '@/shared/ui/components/table/DataTable';
import { Badge } from '@/shared/ui/shadcn/components/ui/badge';
import { Button } from '@/shadcn/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shadcn/components/ui/alert-dialog';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Payment {
  id: string;
  // Original fields (still used for verify)
  orderId?: string;
  paymentId?: string;
  // New backend fields
  walletUserCode?: string;
  walletUserName?: string;
  userEmailOrPhone?: string;
  paymentType?: string; // e.g. Recharge, Consultation
  amount?: string; // e.g. "900"
  status: string; // SUCCESS, FAILED, PENDING, REFUNDED
  paymentTime?: string; // ISO datetime
  // Backwards compatibility
  totalAmount?: string;
  walletAmount?: string;
  createdAt?: string;
  completedAt?: string;
}

export default function PaymentsPage() {
  const repository = useService<IAdminRepository>(ADMIN_SYMBOLS.IAdminRepository);
  const queryClient = useQueryClient();
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [verifyingOrderId, setVerifyingOrderId] = useState<string | null>(null);
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false);

  const mapSortField = (columnId: string): string | undefined => {
    const fieldMap: Record<string, string> = {
      paymentTime: 'paymentTime',
      amount: 'amount',
      status: 'status',
    };
    return fieldMap[columnId] || 'createdAt';
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['payments', pagination, sorting, globalFilter],
    queryFn: async () => {
      const sort = sorting[0];
      const sortBy = sort ? mapSortField(sort.id) : undefined;
      return repository.getPayments({
        page: pagination.pageIndex + 1,
        pageSize: pagination.pageSize,
        sortBy,
        sortOrder: sort?.desc ? 'desc' : 'asc',
      });
    },
  });

  const verifyMutation = useMutation({
    mutationFn: (orderId: string) => repository.verifyPaymentOrder(orderId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setIsVerifyDialogOpen(false);
      setVerifyingOrderId(null);
      if (data.updated) {
        toast.success('Payment verified and fulfilled successfully');
      } else {
        toast.info('Payment was already processed or not found in Razorpay');
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to verify payment order');
    },
  });

  const handleVerify = useCallback((orderId: string) => {
    setVerifyingOrderId(orderId);
    setIsVerifyDialogOpen(true);
  }, []);

  const confirmVerify = () => {
    if (verifyingOrderId) {
      verifyMutation.mutate(verifyingOrderId);
    }
  };

  const columns: DataTableColumn<Payment>[] = useMemo(
    () => [
      {
        id: 'walletUserName',
        header: 'User Name',
        cell: (row) => row.walletUserName || '-',
        width: 180,
      },
      {
        id: 'walletUserCode',
        header: 'User Code',
        cell: (row) =>
          row.walletUserCode ? (
            <span className="font-mono text-xs">{row.walletUserCode}</span>
          ) : (
            <span className="text-muted-foreground text-xs">-</span>
          ),
        width: 220,
      },
      {
        id: 'userEmailOrPhone',
        header: 'Email / Phone',
        cell: (row) => row.userEmailOrPhone || '-',
        width: 200,
      },
      {
        id: 'paymentType',
        header: 'Payment Type',
        cell: (row) => row.paymentType || '-',
        width: 140,
      },
      {
        id: 'amount',
        header: 'Amount',
        cell: (row) => {
          const value = row.amount || row.totalAmount || '0';
          return <span className="font-medium">₹{value}</span>;
        },
        sortable: true,
        accessorKey: 'amount',
        width: 130,
      },
      {
        id: 'status',
        header: 'Status',
        cell: (row) => {
          const status = row.status || 'PENDING';
          const variant =
            status === 'SUCCESS' ? 'default' :
            status === 'FAILED' ? 'destructive' :
            status === 'REFUNDED' ? 'secondary' :
            'outline';
          return <Badge variant={variant}>{status}</Badge>;
        },
        filter: {
          type: 'select',
          options: [
            { label: 'Pending', value: 'PENDING' },
            { label: 'Success', value: 'SUCCESS' },
            { label: 'Failed', value: 'FAILED' },
            { label: 'Refunded', value: 'REFUNDED' },
          ],
        },
        sortable: true,
        accessorKey: 'status',
        width: 120,
      },
      {
        id: 'paymentTime',
        header: 'Payment Time',
        cell: (row) => {
          const ts = row.paymentTime || row.createdAt;
          if (!ts) return '-';
          const d = new Date(ts);
          return d.toLocaleString();
        },
        sortable: true,
        accessorKey: 'paymentTime',
        width: 200,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: (row) => (
          row.status === 'PENDING' && row.orderId ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleVerify(row.orderId!)}
              disabled={verifyMutation.isPending}
            >
              {verifyMutation.isPending && verifyingOrderId === row.orderId ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
            </Button>
          ) : null
        ),
        width: 100,
      },
    ],
    [handleVerify, verifyMutation.isPending, verifyingOrderId]
  );

  return (
    <PageLayout
      title="Payments"
      subtitle="View and verify payment orders"
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
        storageKey="payments-table-v1"
        labels={{
          loading: 'Loading payments...',
          noResults: 'No payments found',
          errorMessage: error instanceof Error ? error.message : 'Failed to load payments',
          search: 'Search payments...',
        }}
        emptyContent={
          <div className="text-center py-12">
            <p className="text-muted-foreground">No payments found</p>
          </div>
        }
      />

      <AlertDialog open={isVerifyDialogOpen} onOpenChange={setIsVerifyDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Verify Payment Order</AlertDialogTitle>
            <AlertDialogDescription>
              This will verify the payment order with Razorpay and fulfill it if the payment is captured.
              Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmVerify} disabled={verifyMutation.isPending}>
              {verifyMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </PageLayout>
  );
}
