import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useService } from '@/app/providers/useDI';
import { ADMIN_SYMBOLS } from '../../di/symbols';
import type { IAdminRepository } from '../../domain/ports/IAdminRepository';
import type { DataTableColumn } from '@/shared/ui/components/table/DataTable';
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
import { Plus, Edit, Trash2, Check, Loader2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/shadcn/lib/utils';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SymptomCategory {
  id: string;
  name: string;
  displayOrder?: number;
  isActive?: boolean;
  symptoms?: Array<{ id: string; name: string }>;
  createdAt?: string;
  updatedAt?: string;
}

// Sortable Row Component
function SortableRow({ 
  category, 
  columns, 
  onEdit, 
  onDelete 
}: { 
  category: SymptomCategory; 
  columns: DataTableColumn<SymptomCategory>[];
  onEdit: (category: SymptomCategory) => void;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr ref={setNodeRef} style={style} className={cn(isDragging && 'bg-muted')}>
      <td className="w-10 px-2">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        >
          <GripVertical className="h-4 w-4" />
        </div>
      </td>
      {columns.map((column) => {
        // Render actions column specially
        if (column.id === 'actions') {
          return (
            <td key={column.id} className="px-4 py-3">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => onEdit(category)} className="h-8 w-8 p-0">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(category.id)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </td>
          );
        }
        return (
          <td key={column.id} className="px-4 py-3">
            {column.cell ? column.cell(category) : null}
          </td>
        );
      })}
    </tr>
  );
}

export default function SymptomCategoriesPage() {
  const repository = useService<IAdminRepository>(ADMIN_SYMBOLS.IAdminRepository);
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [value, setValue] = useState('');
  const [displayOrder, setDisplayOrder] = useState(0);
  const [selectedSymptomIds, setSelectedSymptomIds] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [localCategories, setLocalCategories] = useState<SymptomCategory[]>([]);

  const { data: fullSymptomData, isLoading } = useQuery({
    queryKey: ['full-symptoms'],
    queryFn: () => repository.getFullSymptoms(),
  });

  const categories = fullSymptomData?.data?.categories || [];

  // Sync local state with fetched data and fix gaps in displayOrder
  useEffect(() => {
    if (categories.length > 0) {
      const sorted = [...categories].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
      
      // Check if there are gaps in displayOrder (not starting from 1 or not sequential)
      const needsRenumbering = sorted.some((cat, index) => (cat.displayOrder ?? 0) !== index + 1);
      
      if (needsRenumbering) {
        // Automatically fix gaps by renumbering sequentially starting from 1
        const updates = sorted.map((cat, index) => ({
          id: cat.id,
          displayOrder: index + 1,
        }));
        
        // Update backend silently (don't show toast for auto-fix)
        Promise.all(
          updates.map(({ id, displayOrder }) =>
            repository.updateSymptomCategory(id, { displayOrder })
          )
        ).then(() => {
          queryClient.invalidateQueries({ queryKey: ['full-symptoms'] });
        }).catch(() => {
          // Silent fail - just use the data as-is
        });
        
        // Update local state with fixed order
        setLocalCategories(sorted.map((cat, index) => ({ ...cat, displayOrder: index + 1 })));
      } else {
        setLocalCategories(sorted);
      }
    } else {
      setLocalCategories([]);
    }
  }, [categories, repository, queryClient]);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Batch update mutation for reordering
  const batchUpdateMutation = useMutation({
    mutationFn: async (updates: Array<{ id: string; displayOrder: number }>) => {
      // Update all categories in parallel
      await Promise.all(
        updates.map(({ id, displayOrder }) =>
          repository.updateSymptomCategory(id, { displayOrder })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['full-symptoms'] });
      toast.success('Category order updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update category order');
      // Revert local state on error
      setLocalCategories([...categories].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)));
    },
  });

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = localCategories.findIndex((cat) => cat.id === active.id);
    const newIndex = localCategories.findIndex((cat) => cat.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newCategories = arrayMove(localCategories, oldIndex, newIndex);
      setLocalCategories(newCategories);

      // Update displayOrder for all affected categories (starting from 1, not 0)
      const updates = newCategories.map((cat, index) => ({
        id: cat.id,
        displayOrder: index + 1,
      }));

      batchUpdateMutation.mutate(updates);
    }
  };
  const allSymptoms = fullSymptomData?.data?.symptoms || [];
  const symptomOptions: SelectOption<string>[] = allSymptoms.map((symptom) => ({
    value: symptom.id,
    label: symptom.name,
  }));

  const createMutation = useMutation({
    mutationFn: (data: { name: string; displayOrder?: number; symptomIds?: string[] }) => 
      repository.createSymptomCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['full-symptoms'] });
      setIsSuccess(true);
      setTimeout(() => {
        setIsDialogOpen(false);
        resetForm();
      }, 1000);
      toast.success('Symptom category created successfully');
    },
    onError: (error: any) => {
      setError(error.message || 'Failed to create symptom category');
      toast.error(error.message || 'Failed to create symptom category');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; displayOrder?: number; isActive?: boolean; symptomIds?: string[] } }) =>
      repository.updateSymptomCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['full-symptoms'] });
      setIsSuccess(true);
      setTimeout(() => {
        setIsDialogOpen(false);
        resetForm();
      }, 1000);
      toast.success('Symptom category updated successfully');
    },
    onError: (error: any) => {
      setError(error.message || 'Failed to update symptom category');
      toast.error(error.message || 'Failed to update symptom category');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await repository.deleteSymptomCategory(id);
      // After deletion, renumber remaining categories sequentially (1, 2, 3...)
      const remainingCategories = localCategories.filter((cat) => cat.id !== id);
      if (remainingCategories.length > 0) {
        const renumberUpdates = remainingCategories.map((cat, index) => ({
          id: cat.id,
          displayOrder: index + 1,
        }));
        await Promise.all(
          renumberUpdates.map(({ id: catId, displayOrder }) =>
            repository.updateSymptomCategory(catId, { displayOrder })
          )
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['full-symptoms'] });
      setIsDeleteDialogOpen(false);
      setDeletingId(null);
      toast.success('Symptom category deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete symptom category');
    },
  });

  // Calculate next display order (max + 1, minimum 1)
  const getNextDisplayOrder = useMemo(() => {
    if (localCategories.length === 0) return 1;
    const maxOrder = Math.max(...localCategories.map((cat) => cat.displayOrder ?? 0));
    return maxOrder + 1;
  }, [localCategories]);

  const resetForm = () => {
    setValue('');
    setDisplayOrder(getNextDisplayOrder);
    setSelectedSymptomIds([]);
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

  const handleOpenEdit = (category: SymptomCategory) => {
    setValue(category.name);
    setDisplayOrder(category.displayOrder ?? 0);
    setSelectedSymptomIds(category.symptoms?.map((s) => s.id) || []);
    setIsActive(category.isActive ?? true);
    setError('');
    setIsSuccess(false);
    setEditingId(category.id);
    setIsDialogOpen(true);
  };

  const handleOpenDelete = (id: string) => {
    setDeletingId(id);
    setIsDeleteDialogOpen(true);
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
            displayOrder,
            isActive,
            symptomIds: selectedSymptomIds.length > 0 ? selectedSymptomIds : undefined,
          } 
        });
      } else {
        await createMutation.mutateAsync({ 
          name: value.trim(),
          displayOrder,
          symptomIds: selectedSymptomIds.length > 0 ? selectedSymptomIds : undefined,
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
  }, [isDialogOpen, value, displayOrder, selectedSymptomIds, isActive, editingId]);

  const columns: DataTableColumn<SymptomCategory>[] = [
    {
      id: 'name',
      header: 'Name',
      cell: (row) => <span className="font-medium">{row.name}</span>,
      sortable: true,
      accessorKey: 'name',
      width: 250,
    },
    {
      id: 'displayOrder',
      header: 'Order',
      cell: (row) => <span className="text-muted-foreground">{row.displayOrder ?? 0}</span>,
      sortable: true,
      accessorKey: 'displayOrder',
      width: 80,
    },
    {
      id: 'symptoms',
      header: 'Symptoms',
      cell: (row) => (
        <div className="flex flex-wrap gap-1 max-w-md">
          {row.symptoms && row.symptoms.length > 0 ? (
            row.symptoms.map((symptom) => (
              <span
                key={symptom.id}
                className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground"
              >
                {symptom.name}
              </span>
            ))
          ) : (
            <span className="text-muted-foreground text-sm">No symptoms</span>
          )}
        </div>
      ),
      width: 400,
    },
    {
      id: 'isActive',
      header: 'Status',
      cell: (row) => (
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
            row.isActive !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
          )}
        >
          {row.isActive !== false ? 'Active' : 'Inactive'}
        </span>
      ),
      width: 100,
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
          <h1 className="text-3xl font-bold tracking-tight">Symptom Categories</h1>
          <p className="text-muted-foreground">
            Manage symptom categories. Drag and drop rows to reorder them.
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Create Category
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={localCategories.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="w-10 px-2"></th>
                  {columns.map((column) => (
                    <th key={column.id} className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      {column.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={columns.length + 1} className="px-4 py-8 text-center text-muted-foreground">
                      Loading categories...
                    </td>
                  </tr>
                ) : localCategories.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length + 1} className="px-4 py-8 text-center text-muted-foreground">
                      No categories found
                    </td>
                  </tr>
                ) : (
                  localCategories.map((category) => (
                    <SortableRow
                      key={category.id}
                      category={category}
                      columns={columns}
                      onEdit={handleOpenEdit}
                      onDelete={handleOpenDelete}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </SortableContext>
        <DragOverlay>
          {activeId ? (
            <div className="bg-background border rounded-md p-4 shadow-lg opacity-90">
              <span className="font-medium">
                {localCategories.find((c) => c.id === activeId)?.name}
              </span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Symptom Category' : 'Create Symptom Category'}</DialogTitle>
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
                    value={value}
                    onChange={(e) => {
                      setValue(e.target.value);
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
                <Label htmlFor="displayOrder">Display Order</Label>
                <Input
                  id="displayOrder"
                  type="number"
                  min="0"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(Number(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground">Lower numbers appear first</p>
              </div>

              <div className="space-y-2">
                <Label>Select Symptoms</Label>
                <FieldMultiSelect
                  value={selectedSymptomIds}
                  onChange={setSelectedSymptomIds}
                  options={symptomOptions}
                  placeholder="Select symptoms for this category..."
                  isLoading={!fullSymptomData}
                />
                <p className="text-xs text-muted-foreground">
                  Selected symptoms will appear in this category. Order matters - symptoms are displayed in selection order.
                </p>
              </div>

              {editingId && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isActive"
                    checked={isActive}
                    onCheckedChange={(checked) => setIsActive(Boolean(checked))}
                  />
                  <Label htmlFor="isActive" className="cursor-pointer">
                    Active
                  </Label>
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
              This action cannot be undone. This will permanently delete the symptom category.
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
