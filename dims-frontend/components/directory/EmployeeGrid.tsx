'use client';

import { User } from '@/types/user.types';
import EmployeeCard from './EmployeeCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { AlertCircle } from 'lucide-react';

interface EmployeeGridProps {
  users: User[];
  isLoading?: boolean;
  hasNextPage?: boolean;
  onLoadMore?: () => void;
}

function SkeletonCard() {
  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4">
      <div className="flex gap-3">
        <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-48" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-8 flex-1" />
        <Skeleton className="h-8 flex-1" />
      </div>
    </div>
  );
}

export default function EmployeeGrid({
  users,
  isLoading = false,
  hasNextPage = false,
  onLoadMore,
}: EmployeeGridProps) {
  const gridColsClass =
    'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4';

  if (isLoading && users.length === 0) {
    return (
      <div className={gridColsClass}>
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-3" />
        <p className="text-sm font-medium text-foreground">
          No employees found
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Try adjusting your filters or search terms
        </p>
      </div>
    );
  }

  return (
    <>
      <div className={gridColsClass}>
        {users.map((user) => (
          <EmployeeCard key={user.id} user={user} />
        ))}
      </div>

      {/* Load More Indicator */}
      {isLoading && users.length > 0 && (
        <div className={gridColsClass + ' mt-4'}>
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={`skeleton-${i}`} />
          ))}
        </div>
      )}

      {/* Infinite Scroll Trigger */}
      {hasNextPage && !isLoading && (
        <div className="flex justify-center mt-8">
          <button
            onClick={onLoadMore}
            className="px-4 py-2 text-sm font-medium text-primary hover:text-primary-hover transition-colors"
          >
            Load more employees
          </button>
        </div>
      )}
    </>
  );
}
