'use client';

import { useParams, useRouter } from 'next/navigation';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { EmployeeProfile } from '@/components/directory/EmployeeProfile';
import { Button } from '@/components/ui/Button';

export default function EmployeeProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.userId as string;

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <ChevronRight size={16} className="text-muted-foreground" />
        <span className="text-foreground font-medium">Employee Profile</span>
      </div>

      {/* Profile */}
      <EmployeeProfile userId={userId} />
    </div>
  );
}
