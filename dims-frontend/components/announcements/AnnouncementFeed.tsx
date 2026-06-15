'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import AnnouncementCard from './AnnouncementCard';
import { useAnnouncements, usePinnedAnnouncements } from '@/hooks/useAnnouncements';
import { Skeleton } from '@/components/ui/Skeleton';
import * as Select from '@radix-ui/react-select';
import { useSubsidiaries, useDepartments } from '@/hooks/useDirectory';
import type { AnnouncementFilters, AnnouncementTarget } from '@/hooks/useAnnouncements';
import type { Announcement } from '@/types/announcement.types';
import { AlertCircle, Check, ChevronDown } from 'lucide-react';

interface AnnouncementFeedProps {
  onEditAnnouncement?: (announcement: Announcement) => void;
  initialFilters?: AnnouncementFilters;
}

function SkeletonCard() {
  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4 md:p-6">
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-20 w-full" />
      <div className="flex items-center gap-2 pt-3 border-t border-border">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  );
}

export default function AnnouncementFeed({ onEditAnnouncement, initialFilters }: AnnouncementFeedProps) {
  const [filters, setFilters] = useState<AnnouncementFilters>(initialFilters || {});
  const { ref: observerRef, inView } = useInView();

  // Fetch data
  const { data: announcementsData, fetchNextPage, hasNextPage, isFetching, isLoading } = useAnnouncements(filters);
  const { data: pinnedData, isLoading: pinnedLoading } = usePinnedAnnouncements(filters);
  const { data: subsidiariesData } = useSubsidiaries();
  const { data: departmentsData } = useDepartments(filters.subsidiaryId);

  // Get all announcements
  const allAnnouncements = announcementsData?.pages.flatMap((page) => page.data) || [];

  // Infinite scroll trigger
  useEffect(() => {
    if (inView && hasNextPage && !isFetching) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetching, fetchNextPage]);

  const subsidiaries = subsidiariesData || [];
  const departments = departmentsData || [];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-4 md:p-6 space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Target Filter */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Target</label>
            <Select.Root
              value={filters.target || 'all'}
              onValueChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  target: (value === 'all' ? undefined : value) as AnnouncementTarget | undefined,
                  subsidiaryId: value === 'all' ? undefined : prev.subsidiaryId,
                  departmentId: value === 'all' ? undefined : prev.departmentId,
                }))
              }
            >
              <Select.Trigger className="flex items-center justify-between w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm">
                <Select.Value />
                <Select.Icon>
                  <ChevronDown size={16} />
                </Select.Icon>
              </Select.Trigger>
              <Select.Content className="bg-background border border-border rounded-md shadow-dana-md z-50">
                <Select.Item value="all" className="px-3 py-2 hover:bg-primary/10 cursor-pointer flex items-center justify-between">
                  <Select.ItemText>All Announcements</Select.ItemText>
                  {filters.target === undefined && <Check size={16} />}
                </Select.Item>
                <Select.Item value="subsidiary" className="px-3 py-2 hover:bg-primary/10 cursor-pointer flex items-center justify-between">
                  <Select.ItemText>Subsidiary</Select.ItemText>
                  {filters.target === 'subsidiary' && <Check size={16} />}
                </Select.Item>
                <Select.Item value="department" className="px-3 py-2 hover:bg-primary/10 cursor-pointer flex items-center justify-between">
                  <Select.ItemText>Department</Select.ItemText>
                  {filters.target === 'department' && <Check size={16} />}
                </Select.Item>
              </Select.Content>
            </Select.Root>
          </div>

          {/* Subsidiary Filter */}
          {filters.target && filters.target !== 'all' && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Subsidiary</label>
              <Select.Root
                value={filters.subsidiaryId || ''}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, subsidiaryId: value || undefined }))}
              >
                <Select.Trigger className="flex items-center justify-between w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm">
                  <Select.Value placeholder="Select subsidiary..." />
                  <Select.Icon>
                    <ChevronDown size={16} />
                  </Select.Icon>
                </Select.Trigger>
                <Select.Content className="bg-background border border-border rounded-md shadow-dana-md z-50">
                  {subsidiaries.map((sub) => (
                    <Select.Item key={sub.id} value={sub.id} className="px-3 py-2 hover:bg-primary/10 cursor-pointer">
                      {sub.name}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </div>
          )}

          {/* Department Filter */}
          {filters.target === 'department' && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Department</label>
              <Select.Root
                value={filters.departmentId || ''}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, departmentId: value || undefined }))}
              >
                <Select.Trigger className="flex items-center justify-between w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm">
                  <Select.Value placeholder="Select department..." />
                  <Select.Icon>
                    <ChevronDown size={16} />
                  </Select.Icon>
                </Select.Trigger>
                <Select.Content className="bg-background border border-border rounded-md shadow-dana-md z-50">
                  {departments.map((dept) => (
                    <Select.Item key={dept.id} value={dept.id} className="px-3 py-2 hover:bg-primary/10 cursor-pointer">
                      {dept.name}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </div>
          )}
        </div>
      </div>

      {/* Pinned Announcements */}
      {pinnedLoading || (pinnedData && pinnedData.length > 0) && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase">Pinned</h3>
          {pinnedLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {pinnedData?.map((announcement) => (
                <AnnouncementCard
                  key={announcement.id}
                  announcement={announcement}
                  onEdit={onEditAnnouncement}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recent Announcements */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase">Recent</h3>
        {isLoading && allAnnouncements.length === 0 ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : allAnnouncements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-sm font-medium text-foreground">No announcements yet</p>
            <p className="text-xs text-muted-foreground mt-1">Check back soon for updates</p>
          </div>
        ) : (
          <div className="space-y-4">
            {allAnnouncements.map((announcement) => (
              <AnnouncementCard
                key={announcement.id}
                announcement={announcement}
                onEdit={onEditAnnouncement}
              />
            ))}
          </div>
        )}
      </div>

      {/* Infinite Scroll Trigger */}
      {isFetching && allAnnouncements.length > 0 && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={`loading-${i}`} />
          ))}
        </div>
      )}
      <div ref={observerRef} className="h-1" />
    </div>
  );
}
