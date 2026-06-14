'use client';

import { useState, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { useSubsidiaries, useDepartments } from '@/hooks/useDirectory';
import type { DirectoryFilters } from '@/hooks/useDirectory';

const ROLES = [
  { value: 'employee', label: 'Employee' },
  { value: 'manager', label: 'Manager' },
  { value: 'subsidiary_admin', label: 'Subsidiary Admin' },
  { value: 'group_admin', label: 'Group Admin' },
];

interface EmployeeFiltersProps {
  filters: DirectoryFilters;
  onFiltersChange: (filters: DirectoryFilters) => void;
  isLoading?: boolean;
}

export default function EmployeeFilters({
  filters,
  onFiltersChange,
  isLoading = false,
}: EmployeeFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.q || '');
  const debouncedSearch = useDebounce(searchInput, 250);
  const { data: subsidiaries, isLoading: subsidariesLoading } =
    useSubsidiaries();
  const { data: departments, isLoading: departmentsLoading } = useDepartments(
    filters.subsidiaryId
  );

  // Sync debounced search to filters
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchInput(value);
      if (debouncedSearch !== filters.q) {
        onFiltersChange({ ...filters, q: value || undefined });
      }
    },
    [filters, debouncedSearch, onFiltersChange]
  );

  const handleSubsidiaryChange = (value: string) => {
    onFiltersChange({
      ...filters,
      subsidiaryId: value || undefined,
      departmentId: undefined, // Reset department when subsidiary changes
    });
  };

  const handleDepartmentChange = (value: string) => {
    onFiltersChange({
      ...filters,
      departmentId: value || undefined,
    });
  };

  const handleRoleChange = (value: string) => {
    onFiltersChange({
      ...filters,
      role: value || undefined,
    });
  };

  const hasActiveFilters =
    filters.q || filters.subsidiaryId || filters.departmentId || filters.role;

  const handleClearFilters = () => {
    setSearchInput('');
    onFiltersChange({});
  };

  return (
    <div className="space-y-4 p-4 bg-card border border-border rounded-lg">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          type="text"
          placeholder="Search by name or email..."
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          disabled={isLoading}
          className="pl-10"
        />
      </div>

      {/* Filter Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Subsidiary Select */}
        <Select
          value={filters.subsidiaryId || ''}
          onValueChange={handleSubsidiaryChange}
          disabled={subsidariesLoading || isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="All Subsidiaries" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Subsidiaries</SelectItem>
            {subsidiaries?.map((sub) => (
              <SelectItem key={sub.id} value={sub.id}>
                {sub.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Department Select */}
        <Select
          value={filters.departmentId || ''}
          onValueChange={handleDepartmentChange}
          disabled={departmentsLoading || isLoading || !filters.subsidiaryId}
        >
          <SelectTrigger>
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Departments</SelectItem>
            {departments?.map((dept) => (
              <SelectItem key={dept.id} value={dept.id}>
                {dept.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Role Select */}
        <Select
          value={filters.role || ''}
          onValueChange={handleRoleChange}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Roles</SelectItem>
            {ROLES.map((role) => (
              <SelectItem key={role.value} value={role.value}>
                {role.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Button
            onClick={handleClearFilters}
            variant="outline"
            size="sm"
            disabled={isLoading}
            className="w-full"
          >
            <X size={16} className="mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Active Filter Indicators */}
      {hasActiveFilters && (
        <div className="text-xs text-muted-foreground">
          Showing filtered results
          {filters.q && ` (${filters.q})`}
          {filters.subsidiaryId &&
            ` • ${subsidiaries?.find((s) => s.id === filters.subsidiaryId)?.name}`}
          {filters.departmentId &&
            ` • ${departments?.find((d) => d.id === filters.departmentId)?.name}`}
          {filters.role &&
            ` • ${ROLES.find((r) => r.value === filters.role)?.label}`}
        </div>
      )}
    </div>
  );
}
