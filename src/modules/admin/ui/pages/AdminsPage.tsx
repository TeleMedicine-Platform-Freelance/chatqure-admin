import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useService } from '@/app/providers/useDI';
import { ADMIN_SYMBOLS } from '../../di/symbols';
import type { IAdminRepository, AdminListItem } from '../../domain/ports/IAdminRepository';
import PageLayout from '@/shared/ui/components/PageLayout';
import { DataTable, type DataTableColumn } from '@/shared/ui/components/table/DataTable';
import { Button } from '@/shadcn/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/shadcn/components/ui/dialog';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shadcn/components/ui/dropdown-menu';
import FieldText from '@/shared/ui/components/forms/composites/field/FieldText';
import { Plus, Check, Loader2, MoreHorizontal, Ban, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/shadcn/lib/utils';

export default function AdminsPage() {
  const repository = useService<IAdminRepository>(ADMIN_SYMBOLS.IAdminRepository);
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [deactivatingAdmin, setDeactivatingAdmin] = useState<AdminListItem | null>(null);
  const [deletingAdmin, setDeletingAdmin] = useState<AdminListItem | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admins'],
    queryFn: () => repository.getAdmins(),
  });

  const admins: AdminListItem[] = data?.data ?? [];

  const activeAdminsCount = useMemo(
    () => admins.filter((admin) => admin.status === 'ACTIVE').length,
    [admins],
  );

  const createMutation = useMutation({
    mutationFn: (payload: { email: string; password: string }) =>
      repository.createAdmin(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      setIsSuccess(true);
      setTimeout(() => {
        setIsDialogOpen(false);
        resetForm();
      }, 1000);
      toast.success('Admin created. They can log in with the provided email and password.');
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Failed to create admin';
      setError(message);
      toast.error(message);
    },
  });

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setError('');
    setIsSaving(false);
    setIsSuccess(false);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleCreate = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Email is required');
      return;
    }
    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setIsSaving(true);
    setError('');
    try {
      await createMutation.mutateAsync({ email: trimmedEmail, password });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackendError = (err: unknown, defaultMessage: string) => {
    const error = err as any;
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'LAST_ADMIN_CANNOT_BE_DELETED') {
        toast.error('Cannot delete the last active admin. Create another admin first.');
        return;
      }
      if (error.code === 'LAST_ADMIN_CANNOT_BE_DEACTIVATED') {
        toast.error('Cannot deactivate the last active admin. Create another admin first.');
        return;
      }
    }

    const message =
      typeof error === 'string'
        ? error
        : (error && typeof error.message === 'string' && error.message) || defaultMessage;
    toast.error(message);
  };

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => repository.deactivateAdmin(id),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      setDeactivatingAdmin(null);
      toast.success(result?.message || 'Admin deactivated successfully');
    },
    onError: (err) => {
      handleBackendError(err, 'Failed to deactivate admin');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => repository.deleteAdmin(id),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      setDeletingAdmin(null);
      toast.success(result?.message || 'Admin deleted successfully');
    },
    onError: (err) => {
      handleBackendError(err, 'Failed to delete admin');
    },
  });

  const columns: DataTableColumn<AdminListItem>[] = [
    {
      id: 'email',
      header: 'Email',
      cell: (row) => <span className="font-medium">{row.email}</span>,
      sortable: true,
      accessorKey: 'email',
      width: 280,
    },
    {
      id: 'status',
      header: 'Status',
      cell: (row) => {
        const status = row.status;
        const isActive = status === 'ACTIVE';
        const isSuspended = status === 'SUSPENDED';
        const isPendingDeletion = status === 'PENDING_DELETION';

        const classes = cn(
          'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
          isActive && 'bg-emerald-50 text-emerald-700',
          isSuspended && 'bg-amber-50 text-amber-700',
          isPendingDeletion && 'bg-red-50 text-red-700',
          !isActive && !isSuspended && !isPendingDeletion && 'bg-slate-100 text-slate-600',
        );

        const label =
          status === 'PENDING_DELETION'
            ? 'Pending deletion'
            : status === 'SUSPENDED'
              ? 'Suspended'
              : status;

        return <span className={classes}>{label}</span>;
      },
      width: 140,
    },
    {
      id: 'createdAt',
      header: 'Created',
      cell: (row) =>
        new Date(row.createdAt).toLocaleString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      width: 180,
    },
    {
      id: 'lastLoginAt',
      header: 'Last login',
      cell: (row) =>
        row.lastLoginAt
          ? new Date(row.lastLoginAt).toLocaleString('en-GB', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : '—',
      width: 180,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (row) => {
        const isActive = row.status === 'ACTIVE';
        const isDeleted = row.status === 'DELETED';
        const isPendingDeletion = row.status === 'PENDING_DELETION';
        const isOnlyActiveAdmin = isActive && activeAdminsCount <= 1;

        const canDeactivate = isActive;
        const canDelete = !isDeleted && !isPendingDeletion;

        if (!canDeactivate && !canDelete) {
          return (
            <span className="text-xs text-muted-foreground">
              No actions
            </span>
          );
        }

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canDeactivate && (
                <DropdownMenuItem
                  onClick={() => setDeactivatingAdmin(row)}
                  disabled={deactivateMutation.isPending || isOnlyActiveAdmin}
                >
                  <Ban className="mr-2 h-4 w-4" />
                  {isOnlyActiveAdmin ? 'Cannot deactivate last admin' : 'Deactivate admin'}
                </DropdownMenuItem>
              )}
              {canDelete && (
                <DropdownMenuItem
                  onClick={() => setDeletingAdmin(row)}
                  disabled={deleteMutation.isPending || isOnlyActiveAdmin}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {isOnlyActiveAdmin ? 'Cannot delete last admin' : 'Delete admin'}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      width: 120,
    },
  ];

  return (
    <PageLayout
      title="Admins"
      subtitle="Manage admin users who can access this panel"
      actions={
        <Button onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add admin
        </Button>
      }
      gap="md"
    >
      <div className="space-y-4">
        <DataTable
        columns={columns}
        data={admins}
        mode="client"
        isLoading={isLoading}
        labels={{
          loading: 'Loading admins...',
          noResults: 'No admins found',
          search: 'Search admins...',
        }}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add admin</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              handleCreate();
            }}
          >
            <FieldText
              label="Email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              placeholder="admin@example.com"
              status={error ? 'error' : 'default'}
              statusMessage={error}
              required
            />
            <FieldText
              label="Password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder="Min 8 characters"
              status={error ? 'error' : 'default'}
              required
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSuccess ? (
                  <Check className="mr-2 h-4 w-4" />
                ) : isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {isSuccess ? 'Created' : isSaving ? 'Creating...' : 'Create admin'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deactivatingAdmin}
        onOpenChange={(open) => {
          if (!open && !deactivateMutation.isPending) {
            setDeactivatingAdmin(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate admin?</AlertDialogTitle>
            <AlertDialogDescription>
              {deactivatingAdmin
                ? `This will suspend ${deactivatingAdmin.email}, log them out, and block further logins. You can keep their data without deleting the account.`
                : 'This will suspend the selected admin and block further logins.'}
              {activeAdminsCount <= 1 && deactivatingAdmin?.status === 'ACTIVE' && (
                <span className="mt-2 block font-medium text-destructive">
                  You must keep at least one active admin. Create another admin before deactivating this one.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deactivateMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={
                deactivateMutation.isPending ||
                !deactivatingAdmin ||
                (activeAdminsCount <= 1 && deactivatingAdmin.status === 'ACTIVE')
              }
              onClick={() => {
                if (deactivatingAdmin) {
                  deactivateMutation.mutate(deactivatingAdmin.id);
                }
              }}
            >
              {deactivateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deactivating...
                </>
              ) : (
                'Deactivate'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!deletingAdmin}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) {
            setDeletingAdmin(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete admin?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingAdmin
                ? `This will permanently remove ${deletingAdmin.email}'s admin access. Financial/audit logs remain, but the admin account itself is deleted.`
                : 'This will permanently remove the selected admin account.'}
              <span className="mt-2 block">
                This action cannot be undone. Consider deactivating instead if you only want to temporarily block access.
              </span>
              {activeAdminsCount <= 1 && deletingAdmin?.status === 'ACTIVE' && (
                <span className="mt-2 block font-medium text-destructive">
                  You must keep at least one active admin. Create another admin before deleting this one.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={
                deleteMutation.isPending ||
                !deletingAdmin ||
                (activeAdminsCount <= 1 && deletingAdmin.status === 'ACTIVE')
              }
              onClick={() => {
                if (deletingAdmin) {
                  deleteMutation.mutate(deletingAdmin.id);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </PageLayout>
  );
}
