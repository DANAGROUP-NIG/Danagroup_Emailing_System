'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useDirectoryUsers } from '@/hooks/useDirectory';
import EmployeeFilters from '@/components/directory/EmployeeFilters';
import EmployeeGrid from '@/components/directory/EmployeeGrid';
import { Button } from '@/components/ui/Button';
import { Download, Upload, Loader2 } from 'lucide-react';
import type { DirectoryFilters } from '@/hooks/useDirectory';
import { contactsApi } from '@/lib/api/contacts';
import { useToast } from '@/components/ui/Toast';

export default function DirectoryPage() {
  const searchParams = useSearchParams();
  const observerTarget = useRef<HTMLDivElement>(null);
  const [filters, setFilters] = useState<DirectoryFilters>({
    q: searchParams.get('q') || undefined,
    subsidiary: searchParams.get('subsidiary') || undefined,
    department: searchParams.get('department') || undefined,
    role: searchParams.get('role') || undefined,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const { showToast } = useToast();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isLoading,
  } = useDirectoryUsers(filters);

  const allUsers = data?.pages.flatMap((page) => page.data) || [];
  const totalCount = data?.pages[0]?.pagination?.total || 0;

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0]?.isIntersecting &&
          hasNextPage &&
          !isFetching &&
          !isLoading
        ) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetching, isLoading, fetchNextPage]);

  // Sync filters to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.q) params.set('q', filters.q);
    if (filters.subsidiary) params.set('subsidiary', filters.subsidiary);
    if (filters.department) params.set('department', filters.department);
    if (filters.role) params.set('role', filters.role);

    const newUrl =
      params.toString() ? `/directory?${params.toString()}` : '/directory';
    window.history.replaceState(null, '', newUrl);
  }, [filters]);

  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Role', 'Department', 'Subsidiary'];
    const rows = allUsers.map(u => [
      `"${u.firstName} ${u.lastName}"`,
      `"${u.email}"`,
      `"${u.role || ''}"`,
      `"${u.department?.name || ''}"`,
      `"${u.subsidiary?.name || ''}"`
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'directory.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (!file) return;
      try {
        setIsImporting(true);
        const res = await contactsApi.importCsv(file);
        showToast({ title: `Successfully imported ${res.data.imported} contact(s).`, variant: 'success' });
      } catch (err: unknown) {
        const errObj = err as { response?: { data?: { message?: string } }; message?: string };
        showToast({ title: errObj.response?.data?.message || errObj.message || 'Failed to import contacts', variant: 'error' });
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Employee Directory
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {totalCount > 0
              ? `${totalCount} employee${totalCount !== 1 ? 's' : ''} total`
              : 'Loading employees...'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            onChange={(e) => void handleFileChange(e)}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            size="sm"
            className="sm:w-auto"
            disabled={isImporting}
          >
            {isImporting ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Upload size={16} className="mr-2" />}
            Import Contacts
          </Button>
          <Button
            onClick={handleExportCSV}
            variant="outline"
            size="sm"
            className="sm:w-auto"
          >
            <Download size={16} className="mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <EmployeeFilters
        filters={filters}
        onFiltersChange={setFilters}
        isLoading={isLoading}
      />

      {/* Grid */}
      <div>
        <EmployeeGrid
          users={allUsers}
          isLoading={isLoading || isFetching}
          hasNextPage={hasNextPage || false}
          onLoadMore={() => fetchNextPage()}
        />
      </div>

      {/* Infinite Scroll Trigger */}
      <div ref={observerTarget} className="h-1" />
    </div>
  );
}
