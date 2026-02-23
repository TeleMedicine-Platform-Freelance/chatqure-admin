import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useService } from '@/app/providers/useDI';
import { ADMIN_SYMBOLS } from '../../di/symbols';
import type { IAdminRepository } from '../../domain/ports/IAdminRepository';
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
import { FieldMultiSelect } from '@/shared/ui/components/forms/composites/field/select/FieldMultiSelect';
import type { SelectOption } from '@/shared/ui/components/forms/composites/field/select/types';
import { Plus, Edit, Trash2, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/shadcn/lib/utils';

interface Symptom {
  id: string;
  name: string;
  isActive: boolean;
  specializations?: Array<{ id: string; name: string }>;
  createdAt: string;
  updatedAt: string;
}

export default function SymptomsPage() {
  const repository = useService<IAdminRepository>(ADMIN_SYMBOLS.IAdminRepository);
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [selectedSpecializationIds, setSelectedSpecializationIds] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { data: symptoms = [], isLoading } = useQuery({
    queryKey: ['symptoms'],
    queryFn: () => repository.getSymptoms(),
  });

  const { data: specializations = [] } = useQuery({
    queryKey: ['specializations'],
    queryFn: () => repository.getSpecializations(),
  });

  const specializationOptions: SelectOption<string>[] = specializations.map((s: { id: string; name: string }) => ({
    value: s.id,
    label: s.name,
  }));

  // Categories are not needed for create/update in current admin flow

  const createMutation = useMutation({
    mutationFn: (data: { name: string; specializationIds?: string[] }) =>
      repository.createSymptom(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['symptoms'] });
      setIsSuccess(true);
      setTimeout(() => {
        setIsDialogOpen(false);
        resetForm();
      }, 1000);
      toast.success('Symptom created successfully');
    },
    onError: (error: any) => {
      setError(error.message || 'Failed to create symptom');
      toast.error(error.message || 'Failed to create symptom');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { name: string; isActive?: boolean; specializationIds?: string[] };
    }) => repository.updateSymptom(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['symptoms'] });
      setIsSuccess(true);
      setTimeout(() => {
        setIsDialogOpen(false);
        resetForm();
      }, 1000);
      toast.success('Symptom updated successfully');
    },
    onError: (error: any) => {
      setError(error.message || 'Failed to update symptom');
      toast.error(error.message || 'Failed to update symptom');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => repository.deleteSymptom(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['symptoms'] });
      setIsDeleteDialogOpen(false);
      setDeletingId(null);
      toast.success('Symptom deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete symptom');
    },
  });

  const resetForm = () => {
    setName('');
    setIsActive(true);
    setSelectedSpecializationIds([]);
    setError('');
    setIsSaving(false);
    setIsSuccess(false);
    setEditingId(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (symptom: Symptom) => {
    setName(symptom.name);
    setIsActive(symptom.isActive);
    setSelectedSpecializationIds(symptom.specializations?.map((s) => s.id) ?? []);
    setError('');
    setIsSuccess(false);
    setEditingId(symptom.id);
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
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          data: {
            name: name.trim(),
            isActive,
            specializationIds: selectedSpecializationIds,
          },
        });
      } else {
        await createMutation.mutateAsync({
          name: name.trim(),
          specializationIds:
            selectedSpecializationIds.length > 0 ? selectedSpecializationIds : undefined,
        });
      }
    } catch (error) {
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

    if (isDialogOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isDialogOpen, name, isActive, editingId]);

  const columns: DataTableColumn<Symptom>[] = [
    {
      id: 'id',
      header: 'ID',
      cell: (row) => <span className="font-mono text-xs">{row.id}</span>,
      width: 260,
    },
    {
      id: 'name',
      header: 'Name',
      cell: (row) => <span className="font-medium">{row.name}</span>,
      sortable: true,
      accessorKey: 'name',
      width: 300,
    },
    {
      id: 'specializations',
      header: 'Specializations',
      cell: (row) => (
        <span className="text-muted-foreground text-sm">
          {row.specializations?.length
            ? row.specializations.map((s) => s.name).join(', ')
            : '—'}
        </span>
      ),
      width: 240,
    },
    {
      id: 'isActive',
      header: 'Status',
      cell: (row) => (
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
            row.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
          )}
        >
          {row.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
      width: 120,
    },
    {
      id: 'createdAt',
      header: 'Created At',
      cell: (row) => new Date(row.createdAt).toLocaleDateString(),
      width: 140,
    },
    {
      id: 'updatedAt',
      header: 'Updated At',
      cell: (row) => new Date(row.updatedAt).toLocaleDateString(),
      width: 140,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(row)} className="h-8 w-8 p-0">
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenDelete(row.id)}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
      width: 100,
    },
  ];

  return (
    <div className="container mx-auto py-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Symptoms</h1>
          <p className="text-muted-foreground">Manage medical symptoms</p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Create Symptom
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={symptoms}
        mode="client"
        isLoading={isLoading}
        labels={{
          loading: 'Loading symptoms...',
          noResults: 'No symptoms found',
          search: 'Search symptoms...',
        }}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Symptom' : 'Create Symptom'}</DialogTitle>
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
                <div className="relative">
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setError('');
                    }}
                    className={cn(error ? 'border-destructive' : '')}
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">⌘S</kbd>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Specializations (specialists for this symptom)</Label>
                <FieldMultiSelect
                  value={selectedSpecializationIds}
                  onChange={setSelectedSpecializationIds}
                  options={specializationOptions}
                  placeholder="Select specializations..."
                  isLoading={specializationOptions.length === 0 && specializations.length === 0}
                />
                <p className="text-xs text-muted-foreground">
                  Doctors with these specializations can be found when patients select this symptom.
                </p>
              </div>

              {editingId && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isActive"
                    checked={isActive}
                    onCheckedChange={(checked) => setIsActive(Boolean(checked))}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
              )}

              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
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
                {isSuccess ? 'Saved' : isSaving ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the symptom.
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
  );
}
