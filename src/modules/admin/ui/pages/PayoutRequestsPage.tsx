import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { PaginationState } from '@tanstack/react-table';
import { useService } from '@/app/providers/useDI';
import { ADMIN_SYMBOLS } from '../../di/symbols';
import type { IAdminRepository } from '../../domain/ports/IAdminRepository';
import PageLayout from '@/shared/ui/components/PageLayout';
import { DataTable, type DataTableColumn } from '@/shared/ui/components/table/DataTable';
import { Badge } from '@/shared/ui/shadcn/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/ui/shadcn/components/ui/dialog';
import { Button } from '@/shadcn/components/ui/button';
import { toast } from 'sonner';
import { Check, XCircle, Loader2 } from 'lucide-react';

interface PayoutRequest {
  id: string;
  doctorCode: string | null;
  name: string;
  amount: string;
  netAmount: string;
  tdsAmount: string;
  status: string;
  createdAt: string;
}

export default function PayoutRequestsPage() {
  const repository = useService<IAdminRepository>(ADMIN_SYMBOLS.IAdminRepository);
  const queryClient = useQueryClient();
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [actingId, setActingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['payout-requests', pagination],
    queryFn: async () => {
      return repository.getPayoutRequests({
        page: pagination.pageIndex + 1,
        pageSize: pagination.pageSize,
      });
    },
  });

  const {
    data: selectedDetails,
    isLoading: detailsLoading,
    isError: detailsError,
    error: detailsErrorObj,
  } = useQuery({
    queryKey: ['payout-request', selectedId],
    queryFn: () => repository.getPayoutRequest(selectedId as string),
    enabled: Boolean(selectedId),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => repository.approvePayoutRequest(id),
    onSuccess: () => {
      toast.success('Payout request approved');
      queryClient.invalidateQueries({ queryKey: ['payout-requests'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to approve payout request');
    },
    onSettled: () => setActingId(null),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      repository.rejectPayoutRequest(id, reason),
    onSuccess: () => {
      toast.success('Payout request rejected');
      queryClient.invalidateQueries({ queryKey: ['payout-requests'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to reject payout request');
    },
    onSettled: () => setActingId(null),
  });

  const handleApprove = (id: string) => {
    setActingId(id);
    approveMutation.mutate(id);
  };

  const handleReject = (id: string) => {
    const reason = window.prompt('Enter rejection reason:', 'Insufficient details');
    if (reason === null) return;
    setActingId(id);
    rejectMutation.mutate({ id, reason: reason.trim() || 'Rejected by admin' });
  };

  const handleOpenDetails = (id: string) => {
    setSelectedId(id);
    setIsDetailsOpen(true);
  };

  const columns: DataTableColumn<PayoutRequest>[] = useMemo(
    () => [
      {
        id: 'id',
        header: 'ID',
        cell: (row) => <span className="font-mono text-xs">{row.id.slice(0, 8)}...</span>,
        width: 120,
      },
      {
        id: 'name',
        header: 'Doctor',
        cell: (row) => <span className="font-medium">{row.name}</span>,
        width: 200,
      },
      {
        id: 'doctorCode',
        header: 'Doctor Code',
        cell: (row) =>
          row.doctorCode ? (
            <span className="font-mono text-xs">{row.doctorCode}</span>
          ) : (
            <span className="text-muted-foreground text-xs">-</span>
          ),
        width: 140,
      },
      {
        id: 'amount',
        header: 'Amount (gross)',
        cell: (row) => <span className="font-medium">₹{row.amount || '0'}</span>,
        width: 140,
      },
      {
        id: 'netAmount',
        header: 'Net Amount',
        cell: (row) => <span className="font-medium">₹{row.netAmount || '0'}</span>,
        width: 140,
      },
      {
        id: 'tdsAmount',
        header: 'TDS',
        cell: (row) => <span className="text-sm">₹{row.tdsAmount || '0'}</span>,
        width: 100,
      },
      {
        id: 'status',
        header: 'Status',
        cell: (row) => {
          const status = row.status || 'PENDING_REVIEW';
          const variant =
            status === 'APPROVED'
              ? 'default'
              : status === 'REJECTED'
              ? 'destructive'
              : status === 'PAID'
              ? 'secondary'
              : status === 'FAILED'
              ? 'destructive'
              : 'outline';
          return <Badge variant={variant}>{status}</Badge>;
        },
        width: 140,
      },
      {
        id: 'createdAt',
        header: 'Requested At',
        cell: (row) => {
          const ts = row.createdAt;
          if (!ts) return '-';
          return new Date(ts).toLocaleString();
        },
        width: 180,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: (row) => {
          const status = row.status;
          const canAct =
            status === 'REQUESTED' || status === 'PENDING_REVIEW' || status === 'PROCESSING';
          if (!canAct) {
            return (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleOpenDetails(row.id)}
              >
                View
              </Button>
            );
          }
          const isActing = actingId === row.id && (approveMutation.isPending || rejectMutation.isPending);
          return (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleOpenDetails(row.id)}
              >
                View
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleApprove(row.id)}
                disabled={approveMutation.isPending || isActing}
              >
                {isActing && approveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => handleReject(row.id)}
                disabled={rejectMutation.isPending || isActing}
              >
                {isActing && rejectMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
              </Button>
            </div>
          );
        },
        width: 150,
      },
    ],
    [actingId, approveMutation.isPending, rejectMutation.isPending]
  );

  return (
    <PageLayout
      title="Payout Requests"
      subtitle="Manage doctor payout withdrawal requests"
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

      <Dialog
        open={isDetailsOpen}
        onOpenChange={(open) => {
          setIsDetailsOpen(open);
          if (!open) {
            setSelectedId(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payout Request Details</DialogTitle>
            <DialogDescription>
              View doctor information and payout bank details for this withdrawal request.
            </DialogDescription>
          </DialogHeader>
          {detailsLoading && (
            <div className="py-4 text-sm text-muted-foreground">Loading details...</div>
          )}
          {detailsError && (
            <div className="py-4 text-sm text-destructive">
              {detailsErrorObj instanceof Error
                ? detailsErrorObj.message
                : 'Failed to load payout details.'}
            </div>
          )}
          {!detailsLoading && !detailsError && selectedDetails && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-1">Doctor</h3>
                <div className="space-y-1 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name: </span>
                    <span>{selectedDetails.doctor?.name ?? 'Unknown Doctor'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Doctor Code: </span>
                    <span className="font-mono text-xs">
                      {selectedDetails.doctor?.doctorCode ?? '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Account ID: </span>
                    <span className="font-mono text-xs">
                      {selectedDetails.doctor?.accountId ?? '—'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-1">Amounts</h3>
                <div className="space-y-1 text-sm">
                  <div>
                    <span className="text-muted-foreground">Amount (gross): </span>
                    <span>
                      {selectedDetails.currency} {selectedDetails.amount}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Net amount: </span>
                    <span>
                      {selectedDetails.currency} {selectedDetails.netAmount}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">TDS: </span>
                    <span>
                      {selectedDetails.currency} {selectedDetails.tdsAmount}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status: </span>
                    <Badge variant="outline">{selectedDetails.status}</Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Requested at: </span>
                    <span>{new Date(selectedDetails.createdAt).toLocaleString()}</span>
                  </div>
                  {selectedDetails.notes && (
                    <div>
                      <span className="text-muted-foreground">Notes: </span>
                      <span>{selectedDetails.notes}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-1">Payout Method (Bank Details)</h3>
                {selectedDetails.payoutMethod ? (
                  <div className="space-y-1 text-sm">
                    <div>
                      <span className="text-muted-foreground">Bank: </span>
                      <span>{selectedDetails.payoutMethod.bankName}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Branch: </span>
                      <span>{selectedDetails.payoutMethod.branchName}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Account Holder: </span>
                      <span>{selectedDetails.payoutMethod.accountHolderName}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Account Number: </span>
                      <span className="font-mono text-xs">
                        {selectedDetails.payoutMethod.accountNumber ?? '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">IFSC: </span>
                      <span className="font-mono text-xs">
                        {selectedDetails.payoutMethod.ifscCode}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No payout method found.</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </PageLayout>
  );
}
