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
import FieldText from '@/shared/ui/components/forms/composites/field/FieldText';
import { Checkbox } from '@/shadcn/components/ui/checkbox';
import { Plus, Edit, Trash2, Check, Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/shadcn/lib/utils';
import { uploadFileToPresignedUrl } from '@/shared/utils/presignedUpload';

const ICON_TYPES = ['image/jpeg', 'image/png', 'image/svg+xml'];

interface Specialization {
  id: string;
  name: string;
  iconUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function SpecializationsPage() {
  const repository = useService<IAdminRepository>(ADMIN_SYMBOLS.IAdminRepository);
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [value, setValue] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [iconUploading, setIconUploading] = useState(false);

  const { data: specializations = [], isLoading } = useQuery({
    queryKey: ['specializations'],
    queryFn: () => repository.getSpecializations(),
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; iconUrl?: string }) => repository.createSpecialization(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['specializations'] });
      setIsSuccess(true);
      setTimeout(() => {
        setIsDialogOpen(false);
        resetForm();
      }, 1000);
      toast.success('Specialization created successfully');
    },
    onError: (error: any) => {
      setError(error.message || 'Failed to create specialization');
      toast.error(error.message || 'Failed to create specialization');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { name?: string; isActive?: boolean; iconUrl?: string | null };
    }) => repository.updateSpecialization(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['specializations'] });
      setIsSuccess(true);
      setTimeout(() => {
        setIsDialogOpen(false);
        resetForm();
      }, 1000);
      toast.success('Specialization updated successfully');
    },
    onError: (error: any) => {
      setError(error.message || 'Failed to update specialization');
      toast.error(error.message || 'Failed to update specialization');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => repository.deleteSpecialization(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['specializations'] });
      setIsDeleteDialogOpen(false);
      setDeletingId(null);
      toast.success('Specialization deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete specialization');
    },
  });

  const resetForm = () => {
    setValue('');
    setIconUrl('');
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

  const handleOpenEdit = (specialization: Specialization) => {
    setValue(specialization.name);
    setIconUrl(specialization.iconUrl || '');
    setIsActive(specialization.isActive);
    setError('');
    setIsSuccess(false);
    setEditingId(specialization.id);
    setIsDialogOpen(true);
  };

  const handleOpenDelete = (id: string) => {
    setDeletingId(id);
    setIsDeleteDialogOpen(true);
  };

  const sanitizeFilename = (name: string): string => {
    return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 200) || 'icon';
  };

  const handleIconFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ICON_TYPES.includes(file.type)) {
      toast.error('Please choose a JPEG, PNG or SVG image.');
      e.target.value = '';
      return;
    }
    setIconUploading(true);
    try {
      const filename = sanitizeFilename(file.name) || `icon.${file.type.split('/')[1]}`;
      const { uploadUrl, publicUrl } = await repository.getPresignedIconUploadUrl(
        'specialization_icon',
        filename,
        file.type
      );
      await uploadFileToPresignedUrl(uploadUrl, file);
      setIconUrl(publicUrl);
      toast.success('Icon uploaded.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Icon upload failed');
    } finally {
      setIconUploading(false);
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    if (!value.trim()) {
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
            name: value.trim(),
            isActive,
            iconUrl: iconUrl.trim() || null,
          },
        });
      } else {
        await createMutation.mutateAsync({
          name: value.trim(),
          iconUrl: iconUrl.trim() || undefined,
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

  // Keyboard shortcut: Cmd/Ctrl + S
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
  }, [isDialogOpen, value, isActive, editingId]);

  const columns: DataTableColumn<Specialization>[] = [
    {
      id: 'icon',
      header: 'Icon',
      cell: (row) =>
        row.iconUrl ? (
          <img
            src={row.iconUrl}
            alt=""
            className="h-8 w-8 object-contain rounded"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        ),
      width: 60,
    },
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenEdit(row)}
            className="h-8 w-8 p-0"
          >
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
    <PageLayout
      title="Specializations"
      subtitle="Manage medical specializations"
      actions={
        <Button onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Create Specialization
        </Button>
      }
      gap="md"
    >
      <div className="space-y-4">
        <DataTable
        columns={columns}
        data={specializations}
        mode="client"
        isLoading={isLoading}
        labels={{
          loading: 'Loading specializations...',
          noResults: 'No specializations found',
          search: 'Search specializations...',
        }}
      />

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Specialization' : 'Create Specialization'}</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
          >
            <div className="relative">
              <FieldText
                label="Name"
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  setError('');
                }}
                status={error ? 'error' : 'default'}
                statusMessage={error}
                required
                className="pr-12"
              />
              <div className="absolute right-3 top-9">
                <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">⌘S</kbd>
              </div>
            </div>

            <FieldText
              label="Icon URL"
              value={iconUrl}
              onChange={(e) => setIconUrl(e.target.value)}
              placeholder="https://... or upload below"
              className="text-sm"
            />
            <div className="space-y-2">
              <span className="text-sm text-muted-foreground">Or upload icon</span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={iconUploading}
                  onClick={() => document.getElementById('specialization-icon-upload')?.click()}
                >
                  {iconUploading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  {iconUploading ? 'Uploading...' : 'Choose file'}
                </Button>
                <input
                  id="specialization-icon-upload"
                  type="file"
                  accept=".jpg,.jpeg,.png,.svg,image/jpeg,image/png,image/svg+xml"
                  className="hidden"
                  onChange={handleIconFileSelect}
                />
              </div>
            </div>

            {editingId && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={(checked) => setIsActive(Boolean(checked))}
                />
                <label htmlFor="isActive" className="text-sm font-medium leading-none">
                  Active
                </label>
              </div>
            )}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the specialization.
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
