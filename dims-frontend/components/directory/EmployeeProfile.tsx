// TODO: Implement EmployeeProfile Component
// Props: userId: string
// - Full profile view fetched from GET /api/users/:id
// - Shows: large avatar, full name, job title, department, subsidiary, email, phone
// - "Send Mail" button opens ComposeModal pre-filled with this user
// - Back button to return to directory listing

'use client';

import { useParams } from 'next/navigation';
import { Mail, Phone, MapPin, Building2, Users, Calendar, Briefcase } from 'lucide-react';
import { useUser } from '@/hooks/useDirectory';
import { Avatar, getInitials } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { useMailStore } from '@/store/mailStore';

interface EmployeeProfileProps {
  userId?: string;
}

export function EmployeeProfile({ userId: userIdProp }: EmployeeProfileProps) {
  const params = useParams();
  const userId = userIdProp || (params?.userId as string);
  const { data: user, isLoading, error } = useUser(userId);
  const openCompose = useMailStore((state) => state.openCompose);

  if (!userId) {
    return (
      <Alert variant="destructive">
        <AlertDescription>No employee ID provided</AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full max-w-3xl mx-auto space-y-6">
        <div className="h-48 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 animate-pulse" />
        <Skeleton className="h-8 w-64 mx-auto" />
        <Skeleton className="h-4 w-48 mx-auto" />
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <Alert variant="destructive" className="max-w-3xl mx-auto">
        <AlertDescription>
          {error ? 'Failed to load employee profile' : 'Employee not found'}
        </AlertDescription>
      </Alert>
    );
  }

  const fullName = `${user.firstName} ${user.lastName}`;
  const initials = getInitials(user.firstName, user.lastName);
  const deptSubsidiary = [user.department?.name, user.subsidiary?.name]
    .filter(Boolean)
    .join(' • ');

  const handleSendMail = () => {
    openCompose(undefined, {
      to: [
        {
          id: user.id,
          name: fullName,
          email: user.email,
        },
      ],
    });
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Header Band */}
      <div className="relative bg-gradient-to-r from-primary to-primary-hover rounded-lg overflow-hidden">
        <div className="p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-end">
          <Avatar
            name={fullName}
            initials={initials}
            avatarUrl={user.avatarUrl}
            size="xl"
            className="flex-shrink-0 ring-4 ring-white"
          />
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-white">{fullName}</h1>
                <p className="text-white/90 mt-1">
                  {user.jobTitle || 'Employee'}
                </p>
                <div className="flex gap-2 mt-3">
                  {user.isActive && (
                    <Badge variant="success" size="sm">
                      Active
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
          <Button
            onClick={handleSendMail}
            variant="outline"
            className="self-start"
          >
            <Mail size={16} className="mr-2" />
            Send Mail
          </Button>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Overview Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Overview</h2>
          <div className="space-y-3">
            {deptSubsidiary && (
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">
                    Department & Subsidiary
                  </p>
                  <p className="text-sm text-foreground">{deptSubsidiary}</p>
                </div>
              </div>
            )}
            {user.jobTitle && (
              <div className="flex items-start gap-3">
                <Briefcase className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">
                    Job Title
                  </p>
                  <p className="text-sm text-foreground">{user.jobTitle}</p>
                </div>
              </div>
            )}
            {user.createdAt && (
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">
                    Joined
                  </p>
                  <p className="text-sm text-foreground">
                    {new Date(user.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Contact Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Contact</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase">
                  Email
                </p>
                <a
                  href={`mailto:${user.email}`}
                  className="text-sm text-primary hover:underline"
                >
                  {user.email}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metadata Footer */}
      <div className="pt-4 border-t border-border text-xs text-muted-foreground">
        <p>Employee ID: {user.id}</p>
        {user.lastLoginAt && (
          <p>
            Last Active:{' '}
            {new Date(user.lastLoginAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        )}
      </div>
    </div>
  );
}
