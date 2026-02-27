import { useState } from 'react';
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
import FieldText from '@/shared/ui/components/forms/composites/field/FieldText';
import { Plus, Check, Loader2 } from 'lucide-react';
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

  const { data, isLoading } = useQuery({
    queryKey: ['admins'],
    queryFn: () => repository.getAdmins(),
  });

  const admins: AdminListItem[] = data?.data ?? [];

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
      cell: (row) => (
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
            row.status === 'ACTIVE'
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-slate-100 text-slate-600'
          )}
        >
          {row.status}
        </span>
      ),
      width: 100,
    },
    {
      id: 'createdAt',
      header: 'Created',
      cell: (row) => new Date(row.createdAt).toLocaleString(),
      width: 180,
    },
    {
      id: 'lastLoginAt',
      header: 'Last login',
      cell: (row) =>
        row.lastLoginAt ? new Date(row.lastLoginAt).toLocaleString() : '—',
      width: 180,
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
      </div>
    </PageLayout>
  );
}
