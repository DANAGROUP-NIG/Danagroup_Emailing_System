"use client";

import { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar, getInitials } from "@/components/ui/Avatar";
import { Input } from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { useSubsidiaries, useDepartments } from "@/hooks/useDirectory";
import {
  useCreateUser,
  useUpdateUser,
  useDeactivateUser,
  useResetUserPassword,
} from "@/hooks/useAdmin";
import {
  Building2,
  ChevronDown,
  KeyRound,
  Mail,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  UserMinus,
  Users,
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Select from "@radix-ui/react-select";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";
import type { User, UserRole } from "@/types/user.types";
import { ColumnDef } from "@tanstack/react-table";
import { apiClient } from "@/lib/api";

const DataTable = dynamic(
  () => import("@/components/admin/DataTable").then((m) => m.DataTable),
  { loading: () => <div className="h-64 animate-pulse rounded-lg bg-muted" /> },
) as typeof import("@/components/admin/DataTable").DataTable;

function generateRandomPassword(length = 14) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

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
          jobTitle: initialUser.jobTitle ?? "",
          subsidiaryId: initialUser.subsidiaryId ?? "",
          departmentId: initialUser.departmentId ?? "",
        }
      : {
          firstName: "",
          lastName: "",
          email: "",
          role: "employee",
          jobTitle: "",
          subsidiaryId: "",
          departmentId: "",
        },
  );
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const [password, setPassword] = useState(() => generateRandomPassword());

  useEffect(() => {
    if (isOpen && !initialUser) {
      setPassword(generateRandomPassword());
    }
  }, [isOpen, initialUser]);

  const { data: subsidiariesData } = useSubsidiaries();
  const { data: departmentsData } = useDepartments(formData.subsidiaryId);

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
        password: password.trim() || generateRandomPassword(),
        role: formData.role,
        jobTitle: formData.jobTitle || undefined,
        subsidiaryId: formData.subsidiaryId || undefined,
        departmentId: formData.departmentId || undefined,
      });
    }
    onClose();
  };

  const selectTriggerClass =
    "w-full h-10 px-3 py-2 border border-input rounded-lg bg-background text-sm text-foreground shadow-dana-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 flex items-center justify-between";
  const selectContentClass =
    "bg-background border border-border rounded-lg shadow-dana-md z-[200] overflow-hidden";
  const selectItemClass =
    "px-3 py-2 text-sm text-foreground cursor-pointer hover:bg-primary/10 focus:bg-primary/10 outline-none";

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={initialUser ? "Edit User" : "Create User"}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="First Name"
            value={formData.firstName}
            onChange={(e) =>
              setFormData({ ...formData, firstName: e.target.value })
            }
            required
          />
          <Input
            label="Last Name"
            value={formData.lastName}
            onChange={(e) =>
              setFormData({ ...formData, lastName: e.target.value })
            }
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
        {!initialUser && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">
              Initial password
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="flex-1"
                aria-label="Initial password"
              />
              <button
                type="button"
                onClick={() => setPassword(generateRandomPassword())}
                title="Generate new password"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-input bg-background text-muted-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Copy this password before creating the user; it won’t be shown
              again.
            </p>
          </div>
        )}
        <Input
          label="Job Title"
          value={formData.jobTitle || ""}
          onChange={(e) =>
            setFormData({ ...formData, jobTitle: e.target.value })
          }
        />

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">
            Subsidiary
          </label>
          <Select.Root
            value={formData.subsidiaryId || "placeholder"}
            onValueChange={(value) =>
              setFormData({
                ...formData,
                subsidiaryId: value === "placeholder" ? "" : value,
                departmentId: "",
              })
            }
          >
            <Select.Trigger
              aria-label="Select subsidiary"
              className={selectTriggerClass}
            >
              <Select.Value placeholder="Select subsidiary..." />
              <Select.Icon className="ml-auto text-muted-foreground">
                ▾
              </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content
                position="popper"
                className={selectContentClass}
                sideOffset={4}
              >
                <Select.Viewport>
                  <Select.Item value="placeholder" className={selectItemClass}>
                    <Select.ItemText>Select subsidiary...</Select.ItemText>
                  </Select.Item>
                  {subsidiariesData?.map((sub) => (
                    <Select.Item
                      key={sub.id}
                      value={sub.id}
                      className={selectItemClass}
                    >
                      <Select.ItemText>{sub.name}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">
            Department
          </label>
          <Select.Root
            value={formData.departmentId || "placeholder"}
            onValueChange={(value) =>
              setFormData({
                ...formData,
                departmentId: value === "placeholder" ? "" : value,
              })
            }
            disabled={!formData.subsidiaryId}
          >
            <Select.Trigger
              aria-label="Select department"
              className={selectTriggerClass}
            >
              <Select.Value placeholder="Select department..." />
              <Select.Icon className="ml-auto text-muted-foreground">
                ▾
              </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content
                position="popper"
                className={selectContentClass}
                sideOffset={4}
              >
                <Select.Viewport>
                  <Select.Item value="placeholder" className={selectItemClass}>
                    <Select.ItemText>Select department...</Select.ItemText>
                  </Select.Item>
                  {departmentsData?.map((dept) => (
                    <Select.Item
                      key={dept.id}
                      value={dept.id}
                      className={selectItemClass}
                    >
                      <Select.ItemText>{dept.name}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">
            Role
          </label>
          <Select.Root
            value={formData.role}
            onValueChange={(value: string) =>
              setFormData({ ...formData, role: value as UserRole })
            }
          >
            <Select.Trigger
              aria-label="Select role"
              className={selectTriggerClass}
            >
              <Select.Value />
              <Select.Icon className="ml-auto text-muted-foreground">
                ▾
              </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content
                position="popper"
                className={selectContentClass}
                sideOffset={4}
              >
                <Select.Viewport>
                  <Select.Item value="employee" className={selectItemClass}>
                    <Select.ItemText>Employee</Select.ItemText>
                  </Select.Item>
                  <Select.Item value="manager" className={selectItemClass}>
                    <Select.ItemText>Manager</Select.ItemText>
                  </Select.Item>
                  <Select.Item
                    value="subsidiary_admin"
                    className={selectItemClass}
                  >
                    <Select.ItemText>Subsidiary Admin</Select.ItemText>
                  </Select.Item>
                  <Select.Item value="group_admin" className={selectItemClass}>
                    <Select.ItemText>Group Admin</Select.ItemText>
                  </Select.Item>
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        </div>

        <div className="flex gap-3 pt-4 border-t border-border">
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
            disabled={createUser.isPending || updateUser.isPending}
          >
            {createUser.isPending || updateUser.isPending
              ? "Saving…"
              : initialUser
                ? "Update User"
                : "Create User"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function AdminUsersPageContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubsidiary, setSelectedSubsidiary] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>();

  const { data: usersData, isLoading } = useQuery<User[]>({
    queryKey: ["users", selectedSubsidiary],
    queryFn: async () => {
      const response = await apiClient.get<{ data: User[] }>("/users", {
        params: selectedSubsidiary ? { subsidiaryId: selectedSubsidiary } : {},
      });
      const result = response.data?.data;
      return Array.isArray(result) ? result : [];
    },
  });

  const { data: subsidiariesData } = useSubsidiaries();
  const deactivateUser = useDeactivateUser();
  const resetPassword = useResetUserPassword();

  const roleLabel = (role: UserRole) =>
    role
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  const filteredUsers = useMemo(() => {
    let filtered = usersData || [];
    if (searchQuery) {
      filtered = filtered.filter(
        (u) =>
          u.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.email.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }
    if (selectedSubsidiary) {
      filtered = filtered.filter((u) => u.subsidiaryId === selectedSubsidiary);
    }
    return filtered;
  }, [usersData, searchQuery, selectedSubsidiary]);

  const userStats = useMemo(() => {
    const users = usersData || [];
    return {
      total: users.length,
      active: users.filter((user) => user.isActive).length,
      admins: users.filter((user) =>
        ["group_admin", "subsidiary_admin"].includes(user.role),
      ).length,
    };
  }, [usersData]);

  const renderUserActions = (user: User) => (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground"
          aria-label={`Open actions for ${user.firstName} ${user.lastName}`}
        >
          <MoreHorizontal size={18} />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-50 w-52 rounded-xl border border-border bg-card p-1.5 shadow-dana-md"
        >
          <DropdownMenu.Item asChild>
            <button
              onClick={() => {
                setEditingUser(user);
                setIsFormOpen(true);
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-foreground outline-none transition-colors hover:bg-muted focus:bg-muted"
            >
              <Pencil size={15} className="text-muted-foreground" />
              Edit user
            </button>
          </DropdownMenu.Item>
          <DropdownMenu.Item asChild>
            <button
              onClick={() => resetPassword.mutate(user.id)}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-foreground outline-none transition-colors hover:bg-muted focus:bg-muted"
            >
              <KeyRound size={15} className="text-muted-foreground" />
              Reset password
            </button>
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          <DropdownMenu.Item asChild>
            <button
              onClick={() => {
                if (window.confirm("Deactivate this user?")) {
                  deactivateUser.mutate(user.id);
                }
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-danger outline-none transition-colors hover:bg-danger-light focus:bg-danger-light"
            >
              <UserMinus size={15} />
              Deactivate user
            </button>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "name",
      header: "User",
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
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-foreground">
                {user.firstName} {user.lastName}
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {user.email}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "jobTitle",
      header: "Title",
      cell: ({ row }) => row.original.jobTitle || "-",
    },
    {
      accessorKey: "department",
      header: "Department",
      cell: ({ row }) => row.original.department?.name || "-",
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => (
        <Badge variant="info" size="md" className="font-medium">
          {roleLabel(row.original.role)}
        </Badge>
      ),
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant={row.original.isActive ? "success" : "outline"}
          size="md"
          className={
            row.original.isActive ? "bg-success-light text-success" : ""
          }
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              row.original.isActive ? "bg-success" : "bg-muted-foreground"
            }`}
          />
          {row.original.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      accessorKey: "lastLoginAt",
      header: "Last Login",
      cell: ({ row }) =>
        row.original.lastLoginAt
          ? formatDistanceToNow(new Date(row.original.lastLoginAt), {
              addSuffix: true,
            })
          : "-",
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => renderUserActions(row.original),
    },
  ];

  return (
    <div
      data-testid="admin-panel"
      className="mx-auto w-full max-w-7xl space-y-6 px-4 pb-10 pt-4 sm:px-6 md:pt-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            <ShieldCheck size={15} />
            Administration
          </div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            User management
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage access, roles, and employee accounts.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingUser(undefined);
            setIsFormOpen(true);
          }}
          variant="primary"
          className="w-full shadow-dana sm:w-auto"
        >
          <Plus size={17} />
          Create User
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {[
          { label: "Total users", value: userStats.total, icon: Users },
          { label: "Active", value: userStats.active, icon: UserCheck },
          { label: "Admins", value: userStats.admins, icon: ShieldCheck },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border bg-card p-3 shadow-dana-sm sm:p-4"
          >
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="hidden rounded-lg bg-primary-light p-2 text-primary sm:inline-flex">
                <stat.icon size={17} />
              </span>
              <span className="truncate text-[11px] font-medium sm:text-xs">
                {stat.label}
              </span>
            </div>
            <p className="mt-1 text-xl font-bold leading-tight text-foreground sm:ml-10 sm:text-2xl">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-border bg-card p-3 shadow-dana-sm sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <Input
              placeholder="Search by name or email..."
              aria-label="Search users"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search />}
            />
          </div>
          <Select.Root
            value={selectedSubsidiary || "all"}
            onValueChange={(value) =>
              setSelectedSubsidiary(value === "all" ? "" : value)
            }
          >
            <Select.Trigger
              aria-label="Filter by subsidiary"
              className="flex h-10 w-full items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-dana-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 sm:w-[220px]"
            >
              <Building2 size={16} className="text-muted-foreground" />
              <Select.Value />
              <Select.Icon className="ml-auto text-muted-foreground">
                <ChevronDown size={15} />
              </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content
                position="popper"
                className="bg-background border border-border rounded-lg shadow-dana-md z-[100] overflow-hidden"
                sideOffset={4}
              >
                <Select.Viewport>
                  <Select.Item
                    value="all"
                    className="px-3 py-2 text-sm text-foreground cursor-pointer hover:bg-primary/10 focus:bg-primary/10 outline-none"
                  >
                    <Select.ItemText>All subsidiaries</Select.ItemText>
                  </Select.Item>
                  {subsidiariesData?.map((sub) => (
                    <Select.Item
                      key={sub.id}
                      value={sub.id}
                      className="px-3 py-2 text-sm text-foreground cursor-pointer hover:bg-primary/10 focus:bg-primary/10 outline-none"
                    >
                      <Select.ItemText>{sub.name}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl bg-card shadow-dana-sm [&>div]:rounded-xl">
        <DataTable
          columns={columns}
          data={filteredUsers}
          isLoading={isLoading}
          pageSize={10}
          renderMobileCard={(user) => (
            <div className="rounded-xl border border-border bg-card p-4 shadow-dana-sm">
              <div className="flex items-start gap-3">
                <Avatar
                  name={`${user.firstName} ${user.lastName}`}
                  initials={getInitials(user.firstName, user.lastName)}
                  avatarUrl={user.avatarUrl}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold leading-5 text-foreground">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {user.jobTitle || "No job title"}
                      </p>
                    </div>
                    {renderUserActions(user)}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge variant="info" size="md">
                      {roleLabel(user.role)}
                    </Badge>
                    <Badge
                      variant={user.isActive ? "success" : "outline"}
                      size="md"
                      className={
                        user.isActive ? "bg-success-light text-success" : ""
                      }
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${user.isActive ? "bg-success" : "bg-muted-foreground"}`}
                      />
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="mt-4 grid gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
                <div className="flex min-w-0 items-center gap-2">
                  <Mail size={14} className="shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>
                <div className="flex min-w-0 items-center gap-2">
                  <Building2 size={14} className="shrink-0" />
                  <span className="truncate">
                    {user.department?.name || "No department assigned"}
                  </span>
                </div>
              </div>
            </div>
          )}
        />
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
