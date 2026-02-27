import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useService } from '@/app/providers/useDI';
import { ADMIN_SYMBOLS } from '../../di/symbols';
import type { IAdminRepository } from '../../domain/ports/IAdminRepository';
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
import { Label } from '@/shadcn/components/ui/label';
import { Input } from '@/shadcn/components/ui/input';
import { Checkbox } from '@/shadcn/components/ui/checkbox';
import { Plus, Edit, Trash2, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/shadcn/lib/utils';

interface MedicalCondition {
  id: string;
  name: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export default function MedicalConditionsPage() {
  const repository = useService<IAdminRepository>(ADMIN_SYMBOLS.IAdminRepository);
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { data: conditions = [], isLoading } = useQuery({
    queryKey: ['medical-conditions'],
    queryFn: () => repository.getMedicalConditions(),
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string }) => repository.createMedicalCondition(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-conditions'] });
      setIsSuccess(true);
      setTimeout(() => {
        setIsDialogOpen(false);
        resetForm();
      }, 1000);
      toast.success('Medical condition created successfully');
    },
    onError: (error: any) => {
      setError(error.message || 'Failed to create medical condition');
      toast.error(error.message || 'Failed to create medical condition');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { name: string; isActive?: boolean };
    }) => repository.updateMedicalCondition(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-conditions'] });
      setIsSuccess(true);
      setTimeout(() => {
        setIsDialogOpen(false);
        resetForm();
      }, 1000);
      toast.success('Medical condition updated successfully');
    },
    onError: (error: any) => {
      setError(error.message || 'Failed to update medical condition');
      toast.error(error.message || 'Failed to update medical condition');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => repository.deleteMedicalCondition(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-conditions'] });
      setIsDeleteDialogOpen(false);
      setDeletingId(null);
      toast.success('Medical condition deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete medical condition');
    },
  });

  const resetForm = () => {
    setName('');
    setIsActive(true);
    setError('');
    setIsSaving(false);
    setIsSuccess(false);
    setEditingId(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (condition: MedicalCondition) => {
    setName(condition.name);
    setIsActive(condition.isActive);
    setError('');
    setIsSuccess(false);
    setEditingId(condition.id);
    setIsDialogOpen(true);
  };

  const handleOpenDelete = (id: string) => {
    setDeletingId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    setIsSaving(true);
    setError('');

    try {
      const payload: { name: string; isActive?: boolean } = {
        name: name.trim(),
      };

      if (editingId != null) {
        payload.isActive = isActive;
        await updateMutation.mutateAsync({ id: editingId, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
    } catch {
      // Error handled in mutation
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (deletingId) {
      deleteMutation.mutate(deletingId);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        if (isDialogOpen) {
          e.preventDefault();
          handleSave();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDialogOpen, handleSave]);

  const columns: DataTableColumn<MedicalCondition>[] = [
    {
      id: 'name',
      header: 'Name',
      cell: (row) => <span className="font-medium">{row.name}</span>,
      width: 240,
    },
    {
      id: 'status',
      header: 'Status',
      cell: (row) => (
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
            row.isActive
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
              : 'bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300'
          )}
        >
          {row.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
      width: 140,
    },
    {
      id: 'createdAt',
      header: 'Created',
      cell: (row) =>
        row.createdAt ? (
          <span className="text-xs text-muted-foreground">
            {new Date(row.createdAt).toLocaleString()}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
      width: 200,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleOpenEdit(row)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => handleOpenDelete(row.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
      width: 120,
    },
  ];

  return (
    <PageLayout
      title="Medical Conditions"
      subtitle="Manage medical conditions that can be associated with consultations and diagnoses."
      actions={
        <Button onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Create Condition
        </Button>
      }
      gap="md"
    >
      <div className="space-y-4">
        <DataTable
          columns={columns}
          data={conditions}
          mode="client"
          isLoading={isLoading}
          labels={{
            loading: 'Loading medical conditions...',
            noResults: 'No medical conditions found',
            search: 'Search medical conditions...',
          }}
        />

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingId ? 'Edit Medical Condition' : 'Create Medical Condition'}
              </DialogTitle>
            </DialogHeader>
            <form
              className="space-y-6"
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Hypertension"
                  />
                </div>

                {editingId && (
                  <div className="flex items-center justify-between rounded-md border p-3">
                    <div className="space-y-1">
                      <Label htmlFor="isActive" className="text-sm font-medium">
                        Active
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Control whether this condition can be used in the platform.
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isActive"
                        checked={isActive}
                        onCheckedChange={(checked) => setIsActive(checked === true)}
                      />
                      <Label htmlFor="isActive" className="text-sm">
                        {isActive ? 'Active' : 'Inactive'}
                      </Label>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <p>
                    Press{' '}
                    <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">⌘S</kbd>{' '}
                    or{' '}
                    <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Ctrl+S</kbd>{' '}
                    to save quickly.
                  </p>
                  {isSuccess && (
                    <span className="inline-flex items-center gap-1 text-emerald-600 text-xs">
                      <Check className="h-3 w-3" />
                      Saved
                    </span>
                  )}
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isSuccess ? 'Saved' : editingId ? 'Save changes' : 'Create condition'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete medical condition</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the medical
                condition and remove it from any future use in the platform.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
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

