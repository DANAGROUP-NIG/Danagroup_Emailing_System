"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { DataTable } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { useSubsidiaries } from "@/hooks/useDirectory";
import {
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
} from "@/hooks/useAdmin";
import {
  Building2,
  Layers3,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Select from "@radix-ui/react-select";
import { ColumnDef } from "@tanstack/react-table";
import type { Department } from "@/types/user.types";
import { departmentsApi } from "@/lib/api/departments";

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
    initialDept || { name: "", subsidiaryId: "" },
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
      title={initialDept ? "Edit Department" : "Create Department"}
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
            value={formData.subsidiaryId || "placeholder"}
            onValueChange={(value) =>
              setFormData({
                ...formData,
                subsidiaryId: value === "placeholder" ? "" : value,
              })
            }
          >
            <Select.Trigger className="w-full h-10 px-3 py-2 border border-input rounded-lg bg-background text-sm text-foreground flex items-center justify-between shadow-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <Select.Value placeholder="Select subsidiary..." />
              <Select.Icon className="ml-auto text-muted-foreground">
                ▾
              </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content
                position="popper"
                sideOffset={4}
                className="bg-background border border-border rounded-lg shadow-lg z-[200] w-[var(--radix-select-trigger-width)]"
              >
                <Select.Viewport>
                  <Select.Item
                    value="placeholder"
                    className="px-3 py-2 text-sm text-muted-foreground cursor-pointer hover:bg-primary/10 focus:bg-primary/10 outline-none"
                  >
                    <Select.ItemText>Select subsidiary...</Select.ItemText>
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
        <div className="flex gap-2 pt-4">
          <Button type="submit" variant="primary" className="flex-1">
            {initialDept ? "Update" : "Create"}
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

function AdminDepartmentsPageContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | undefined>();

  const { data: deptsData, isLoading } = useQuery<Department[]>({
    queryKey: ["departments"],
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
        d.subsidiary?.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [deptsData, searchQuery]);

  const departmentStats = useMemo(() => {
    const departments = deptsData || [];
    return {
      total: departments.length,
      subsidiaries: new Set(
        departments.map((department) => department.subsidiaryId),
      ).size,
      visible: filteredDepts.length,
    };
  }, [deptsData, filteredDepts]);

  const renderDepartmentActions = (department: Department) => (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground"
          aria-label={`Open actions for ${department.name}`}
        >
          <MoreHorizontal size={18} />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-50 w-48 rounded-xl border border-border bg-card p-1.5 shadow-dana-md"
        >
          <DropdownMenu.Item asChild>
            <button
              onClick={() => {
                setEditingDept(department);
                setIsFormOpen(true);
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-foreground outline-none transition-colors hover:bg-muted focus:bg-muted"
            >
              <Pencil size={15} className="text-muted-foreground" />
              Edit department
            </button>
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          <DropdownMenu.Item asChild>
            <button
              onClick={() => {
                if (window.confirm("Delete this department?")) {
                  deleteDept.mutate(department.id);
                }
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-danger outline-none transition-colors hover:bg-danger-light focus:bg-danger-light"
            >
              <Trash2 size={15} />
              Delete department
            </button>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );

  const columns: ColumnDef<Department>[] = [
    {
      accessorKey: "name",
      header: "Department",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary">
            <Layers3 size={17} />
          </span>
          <span className="font-semibold text-foreground">
            {row.original.name}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "subsidiary",
      header: "Subsidiary",
      cell: ({ row }) => row.original.subsidiary?.name || "-",
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => renderDepartmentActions(row.original),
    },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 pb-10 pt-4 sm:px-6 md:pt-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            <ShieldCheck size={15} />
            Administration
          </div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            Departments
          </h1>
          <p className="text-sm text-muted-foreground">
            Organize departments across company subsidiaries.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingDept(undefined);
            setIsFormOpen(true);
          }}
          variant="primary"
          className="w-full shadow-dana sm:w-auto"
        >
          <Plus size={17} />
          Create Department
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {[
          { label: "Departments", value: departmentStats.total, icon: Layers3 },
          {
            label: "Subsidiaries",
            value: departmentStats.subsidiaries,
            icon: Building2,
          },
          { label: "Showing", value: departmentStats.visible, icon: Search },
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

      <div className="rounded-xl border border-border bg-card p-3 shadow-dana-sm sm:p-4">
        <Input
          placeholder="Search by department or subsidiary..."
          aria-label="Search departments"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search />}
        />
      </div>

      <div className="overflow-hidden rounded-xl bg-card shadow-dana-sm [&>div]:rounded-xl">
        <DataTable
          columns={columns}
          data={filteredDepts}
          isLoading={isLoading}
          pageSize={10}
          renderMobileCard={(department) => (
            <div className="rounded-xl border border-border bg-card p-4 shadow-dana-sm">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
                  <Layers3 size={19} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold leading-5 text-foreground">
                        {department.name}
                      </p>
                      <div className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                        <Building2 size={13} className="shrink-0" />
                        <span className="truncate">
                          {department.subsidiary?.name ||
                            "No subsidiary assigned"}
                        </span>
                      </div>
                    </div>
                    {renderDepartmentActions(department)}
                  </div>
                </div>
              </div>
            </div>
          )}
        />
      </div>

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
