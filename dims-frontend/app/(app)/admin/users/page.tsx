'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Avatar, getInitials } from '@/components/ui/Avatar';
import { Input } from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { useSubsidiaries, useDepartments } from '@/hooks/useDirectory';
import {
  useCreateUser,
  useUpdateUser,
  useDeactivateUser,
  useResetUserPassword,
} from '@/hooks/useAdmin';
import { MoreVertical, Plus, Mail } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Select from '@radix-ui/react-select';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import type { User, UserRole } from '@/types/user.types';
import { ColumnDef } from '@tanstack/react-table';
import { apiClient } from '@/lib/api';

const DataTable = dynamic(
  () => import('@/components/admin/DataTable').then((m) => m.DataTable),
  { loading: () => <div className="h-64 animate-pulse rounded-lg bg-muted" /> },
) as typeof import('@/components/admin/DataTable').DataTable;

function UserFormModal({
  isOpen,
  onClose,
  initialUser,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialUser?: User | undefined;
}) {
  const [formData, setFormData] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
    jobTitle: string;
    subsidiaryId: string;
    departmentId: string;
  }>(
    initialUser
      ? {
          firstName: initialUser.firstName,
          lastName: initialUser.lastName,
          email: initialUser.email,
          role: initialUser.role,
          jobTitle: initialUser.jobTitle ?? '',
          subsidiaryId: initialUser.subsidiaryId ?? '',
          departmentId: initialUser.departmentId ?? '',
        }
      : {
          firstName: '',
          lastName: '',
          email: '',
          role: 'employee',
          jobTitle: '',
          subsidiaryId: '',
          departmentId: '',
        }
  );
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const { data: subsidiariesData } = useSubsidiaries();
  useDepartments(formData.subsidiaryId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (initialUser) {
      await updateUser.mutateAsync({
        id: initialUser.id,
        data: formData,
      });
    } else {
      await createUser.mutateAsync({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        role: formData.role,
        jobTitle: formData.jobTitle || undefined,
        subsidiary: formData.subsidiaryId || undefined,
        department: formData.departmentId || undefined,
      });
    }
    onClose();
  };

  const selectTriggerClass = 'w-full h-10 px-3 py-2 border border-input rounded-lg bg-background text-sm text-foreground shadow-dana-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 flex items-center justify-between';
  const selectContentClass = 'bg-background border border-border rounded-lg shadow-dana-md z-[200] overflow-hidden';
  const selectItemClass = 'px-3 py-2 text-sm text-foreground cursor-pointer hover:bg-primary/10 focus:bg-primary/10 outline-none';

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={initialUser ? 'Edit User' : 'Invite User'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="First Name"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            required
          />
          <Input
            label="Last Name"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            required
          />
        </div>
        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          disabled={!!initialUser}
        />
        <Input
          label="Job Title"
          value={formData.jobTitle || ''}
          onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
        />

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Subsidiary</label>
          <Select.Root
            value={formData.subsidiaryId || 'placeholder'}
            onValueChange={(value) =>
              setFormData({ ...formData, subsidiaryId: value === 'placeholder' ? '' : value, departmentId: '' })
            }
          >
            <Select.Trigger aria-label="Select subsidiary" className={selectTriggerClass}>
              <Select.Value placeholder="Select subsidiary..." />
              <Select.Icon className="ml-auto text-muted-foreground">▾</Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content position="popper" className={selectContentClass} sideOffset={4}>
                <Select.Viewport>
                  <Select.Item value="placeholder" className={selectItemClass}>
                    <Select.ItemText>Select subsidiary...</Select.ItemText>
                  </Select.Item>
                  {subsidiariesData?.map((sub) => (
                    <Select.Item key={sub.id} value={sub.id} className={selectItemClass}>
                      <Select.ItemText>{sub.name}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Role</label>
          <Select.Root
            value={formData.role}
            onValueChange={(value: string) => setFormData({ ...formData, role: value as UserRole })}
          >
            <Select.Trigger aria-label="Select role" className={selectTriggerClass}>
              <Select.Value />
              <Select.Icon className="ml-auto text-muted-foreground">▾</Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content position="popper" className={selectContentClass} sideOffset={4}>
                <Select.Viewport>
                  <Select.Item value="employee" className={selectItemClass}><Select.ItemText>Employee</Select.ItemText></Select.Item>
                  <Select.Item value="manager" className={selectItemClass}><Select.ItemText>Manager</Select.ItemText></Select.Item>
                  <Select.Item value="subsidiary_admin" className={selectItemClass}><Select.ItemText>Subsidiary Admin</Select.ItemText></Select.Item>
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        </div>

        <div className="flex gap-3 pt-4 border-t border-border">
          <Button type="submit" variant="primary" className="flex-1" disabled={createUser.isPending || updateUser.isPending}>
            {createUser.isPending || updateUser.isPending ? 'Saving…' : (initialUser ? 'Update User' : 'Invite User')}
          </Button>
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function AdminUsersPageContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubsidiary, setSelectedSubsidiary] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>();

  const { data: usersData, isLoading } = useQuery<User[]>({
    queryKey: ['users', selectedSubsidiary],
    queryFn: async () => {
      const response = await apiClient.get<{ data: User[] }>('/users', {
        params: selectedSubsidiary ? { subsidiaryId: selectedSubsidiary } : {},
      });
      const result = response.data?.data;
      return Array.isArray(result) ? result : [];
    },
  });

  const { data: subsidiariesData } = useSubsidiaries();
  const deactivateUser = useDeactivateUser();
  const resetPassword = useResetUserPassword();

  const filteredUsers = useMemo(() => {
    let filtered = usersData || [];
    if (searchQuery) {
      filtered = filtered.filter(
        (u) =>
          u.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (selectedSubsidiary) {
      filtered = filtered.filter((u) => u.subsidiaryId === selectedSubsidiary);
    }
    return filtered;
  }, [usersData, searchQuery, selectedSubsidiary]);

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'name',
      header: 'User',
      cell: ({ row }) => {
        const user = row.original;
        const initials = getInitials(user.firstName, user.lastName);
        return (
          <div className="flex items-center gap-3">
            <Avatar
              name={`${user.firstName} ${user.lastName}`}
              initials={initials}
              avatarUrl={user.avatarUrl}
              size="sm"
            />
            <div>
              <div className="font-medium text-sm">
                {user.firstName} {user.lastName}
              </div>
              <div className="text-xs text-muted-foreground">{user.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'jobTitle',
      header: 'Title',
      cell: ({ row }) => row.original.jobTitle || '-',
    },
    {
      accessorKey: 'department',
      header: 'Department',
      cell: ({ row }) => row.original.department?.name || '-',
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => (
        <Badge variant="primary" size="sm">
          {row.original.role}
        </Badge>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? 'success' : 'outline'} size="sm">
          {row.original.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      accessorKey: 'lastLoginAt',
      header: 'Last Login',
      cell: ({ row }) =>
        row.original.lastLoginAt
          ? formatDistanceToNow(new Date(row.original.lastLoginAt), { addSuffix: true })
          : '-',
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
          <DropdownMenu.Content align="end" className="w-48 bg-card border border-border rounded-md shadow-dana-md p-1 z-50">
            <DropdownMenu.Item asChild>
              <button
                onClick={() => {
                  setEditingUser(row.original);
                  setIsFormOpen(true);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-primary/10 rounded transition-colors"
              >
                Edit
              </button>
            </DropdownMenu.Item>
            <DropdownMenu.Item asChild>
              <button
                onClick={() => resetPassword.mutate(row.original.id)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-primary/10 rounded transition-colors"
              >
                <Mail size={14} />
                Reset Password
              </button>
            </DropdownMenu.Item>
            <DropdownMenu.Item asChild>
              <button
                onClick={() => {
                  if (window.confirm('Deactivate this user?')) {
                    deactivateUser.mutate(row.original.id);
                  }
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-danger-light rounded transition-colors"
              >
                Deactivate
              </button>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      ),
    },
  ];

  return (
    <div data-testid="admin-panel" className="space-y-6 max-w-7xl p-4 md:p-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">User Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage employees and their roles</p>
        </div>
        <Button
          onClick={() => {
            setEditingUser(undefined);
            setIsFormOpen(true);
          }}
          variant="primary"
        >
          <Plus size={16} className="mr-2" />
          Invite User
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Search users..."
          aria-label="Search users"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <Select.Root
          value={selectedSubsidiary || 'all'}
          onValueChange={(value) => setSelectedSubsidiary(value === 'all' ? '' : value)}
        >
          <Select.Trigger aria-label="Filter by subsidiary" className="h-10 px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm min-w-[180px] shadow-dana-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 flex items-center gap-2">
            <Select.Value />
            <Select.Icon className="ml-auto text-muted-foreground">▾</Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Content position="popper" className="bg-background border border-border rounded-lg shadow-dana-md z-[100] overflow-hidden" sideOffset={4}>
              <Select.Viewport>
                <Select.Item value="all" className="px-3 py-2 text-sm text-foreground cursor-pointer hover:bg-primary/10 focus:bg-primary/10 outline-none"><Select.ItemText>All subsidiaries</Select.ItemText></Select.Item>
                {subsidiariesData?.map((sub) => (
                  <Select.Item key={sub.id} value={sub.id} className="px-3 py-2 text-sm text-foreground cursor-pointer hover:bg-primary/10 focus:bg-primary/10 outline-none">
                    <Select.ItemText>{sub.name}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>
      </div>

      {/* Table */}
      <div className='overflow-x-auto rounded-lg'>
        <DataTable columns={columns} data={filteredUsers} isLoading={isLoading} pageSize={10} />
      </div>

      {/* Form Modal */}
      <UserFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingUser(undefined);
        }}
        initialUser={editingUser}
      />
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <AdminGuard>
      <AdminUsersPageContent />
    </AdminGuard>
  );
}
