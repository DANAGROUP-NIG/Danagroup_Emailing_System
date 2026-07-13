'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { DataTable } from '@/components/admin/DataTable';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { useSubsidiaries } from '@/hooks/useDirectory';
import {
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
} from '@/hooks/useAdmin';
import { Plus, MoreVertical } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Select from '@radix-ui/react-select';
import { ColumnDef } from '@tanstack/react-table';
import type { Department } from '@/types/user.types';
import { departmentsApi } from '@/lib/api/departments';

function DepartmentFormModal({
  isOpen,
  onClose,
  initialDept,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialDept?: Department | undefined;
}) {
  const [formData, setFormData] = useState(
    initialDept || { name: '', subsidiaryId: '' }
  );

  const createDept = useCreateDepartment();
  const updateDept = useUpdateDepartment();
  const { data: subsidiariesData } = useSubsidiaries();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (initialDept) {
      await updateDept.mutateAsync({ id: initialDept.id, data: formData });
    } else {
      await createDept.mutateAsync(formData);
    }
    onClose();
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={initialDept ? 'Edit Department' : 'Create Department'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Department Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Subsidiary
          </label>
          <Select.Root
            value={formData.subsidiaryId}
            onValueChange={(value) => setFormData({ ...formData, subsidiaryId: value })}
          >
            <Select.Trigger className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm">
              <Select.Value placeholder="Select subsidiary..." />
            </Select.Trigger>
            <Select.Content className="bg-background border border-border rounded-md shadow-dana-md z-50">
              {subsidiariesData?.map((sub) => (
                <Select.Item key={sub.id} value={sub.id}>
                  {sub.name}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        </div>
        <div className="flex gap-2 pt-4">
          <Button type="submit" variant="primary" className="flex-1">
            {initialDept ? 'Update' : 'Create'}
          </Button>
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function AdminDepartmentsPageContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | undefined>();

  const { data: deptsData, isLoading } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await departmentsApi.list();
      const result = Array.isArray(response.data) ? response.data : [];
      return result as Department[];
    },
  });

  const deleteDept = useDeleteDepartment();

  const filteredDepts = useMemo(() => {
    const depts = deptsData || [];
    if (!searchQuery) return depts;
    return depts.filter(
      (d) =>
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.subsidiary?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [deptsData, searchQuery]);

  const columns: ColumnDef<Department>[] = [
    {
      accessorKey: 'name',
      header: 'Department',
    },
    {
      accessorKey: 'subsidiary',
      header: 'Subsidiary',
      cell: ({ row }) => row.original.subsidiary?.name || '-',
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <Button variant="ghost" size="sm" className="p-1">
              <MoreVertical size={16} />
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content align="end" className="w-40 bg-card border border-border rounded-md shadow-dana-md p-1 z-50">
            <DropdownMenu.Item asChild>
              <button
                onClick={() => {
                  setEditingDept(row.original);
                  setIsFormOpen(true);
                }}
                className="w-full px-3 py-2 text-sm text-foreground hover:bg-primary/10 rounded transition-colors text-left"
              >
                Edit
              </button>
            </DropdownMenu.Item>
            <DropdownMenu.Item asChild>
              <button
                onClick={() => {
                  if (window.confirm('Delete this department?')) {
                    deleteDept.mutate(row.original.id);
                  }
                }}
                className="w-full px-3 py-2 text-sm text-danger hover:bg-danger-light rounded transition-colors text-left"
              >
                Delete
              </button>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl p-4 md:p-6 pb-8 overflow-x-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Departments</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage company departments</p>
        </div>
        <Button
          onClick={() => {
            setEditingDept(undefined);
            setIsFormOpen(true);
          }}
          variant="primary"
        >
          <Plus size={16} className="mr-2" />
          Create Department
        </Button>
      </div>

      <Input
        placeholder="Search departments..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      <DataTable columns={columns} data={filteredDepts} isLoading={isLoading} pageSize={10} />

      <DepartmentFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingDept(undefined);
        }}
        initialDept={editingDept}
      />
    </div>
  );
}

export default function AdminDepartmentsPage() {
  return (
    <AdminGuard>
      <AdminDepartmentsPageContent />
    </AdminGuard>
  );
}
