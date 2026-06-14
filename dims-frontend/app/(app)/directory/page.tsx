'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useDirectoryUsers } from '@/hooks/useDirectory';
import EmployeeFilters from '@/components/directory/EmployeeFilters';
import EmployeeGrid from '@/components/directory/EmployeeGrid';
import { Button } from '@/components/ui/Button';
import { Download } from 'lucide-react';
import type { DirectoryFilters } from '@/hooks/useDirectory';

export default function DirectoryPage() {
  const searchParams = useSearchParams();
  const observerTarget = useRef<HTMLDivElement>(null);
  const [filters, setFilters] = useState<DirectoryFilters>({
    q: searchParams.get('q') || undefined,
    subsidiaryId: searchParams.get('subsidiary') || undefined,
    departmentId: searchParams.get('department') || undefined,
    role: searchParams.get('role') || undefined,
  });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isLoading,
  } = useDirectoryUsers(filters);

  const allUsers = data?.pages.flatMap((page) => page.data) || [];
  const totalCount = data?.pages[0]?.total || 0;

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
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
    if (filters.subsidiaryId) params.set('subsidiary', filters.subsidiaryId);
    if (filters.departmentId) params.set('department', filters.departmentId);
    if (filters.role) params.set('role', filters.role);

    const newUrl =
      params.toString() ? `/directory?${params.toString()}` : '/directory';
    window.history.replaceState(null, '', newUrl);
  }, [filters]);

  const handleExportCSV = () => {
    // CSV export functionality would go here
  };

  return (
    <div className="flex flex-col gap-6 p-6">
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

      {/* Filters */}
      <EmployeeFilters
        filters={filters}
        onFiltersChange={setFilters}
        isLoading={isLoading}
      />

      {/* Grid */}
      <EmployeeGrid
        users={allUsers}
        isLoading={isLoading || isFetching}
        hasNextPage={hasNextPage || false}
        onLoadMore={() => fetchNextPage()}
      />

      {/* Infinite Scroll Trigger */}
      <div ref={observerTarget} className="h-1" />
    </div>
  );
}
