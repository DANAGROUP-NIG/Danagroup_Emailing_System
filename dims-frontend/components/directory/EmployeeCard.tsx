'use client';

import { useRouter } from 'next/navigation';
import { User } from '@/types/user.types';
import { Avatar, getInitials } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Mail, ArrowRight, MessageSquare } from 'lucide-react';
import { useMailStore } from '@/store/mailStore';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

interface EmployeeCardProps {
  user: User;
  onSendMail?: (user: User) => void;
}

export default function EmployeeCard({ user, onSendMail }: EmployeeCardProps) {
  const router = useRouter();
  const openCompose = useMailStore((state) => state.openCompose);
  const currentUser = useAuthStore((s) => s.user);

  const handleSendMail = () => {
    if (onSendMail) {
      onSendMail(user);
    } else {
      openCompose(undefined, {
        to: [
          {
            id: user.id,
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
          },
        ],
      });
    }
  };

  const handleMessage = () => {
    router.push(`/chat?with=${user.id}`);
  };

  const handleClick = () => {
    router.push(`/directory/${user.id}`);
  };

  const initials = getInitials(user.firstName, user.lastName);
  const fullName = `${user.firstName} ${user.lastName}`;
  const deptSubsidiary = [user.department?.name, user.subsidiary?.name]
    .filter(Boolean)
    .join(' • ');

  return (
    <article
      className={cn(
        'dims-card group relative flex flex-col rounded-lg border border-border bg-card p-4',
        'shadow-dana transition-all duration-200',
        'hover:shadow-dana-md hover:-translate-y-1'
      )}
    >
      {/* Avatar + Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <Avatar
          name={fullName}
          initials={initials}
          avatarUrl={user.avatarUrl}
          size="md"
        />
        <button
          type="button"
          onClick={handleClick}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full hover:bg-primary/10 text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`View ${fullName}'s profile`}
        >
          <ArrowRight size={18} aria-hidden="true" />
        </button>
      </div>

      {/* Content */}
      <button
        type="button"
        onClick={handleClick}
        className="flex-1 min-w-0 mb-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
        aria-label={`Open ${fullName}'s profile`}
      >
        <h3 className="text-sm font-semibold text-foreground truncate">
          {fullName}
        </h3>
        <p className="text-xs text-muted-foreground truncate">
          {user.jobTitle || 'Employee'}
        </p>
        {deptSubsidiary && (
          <p className="text-xs text-muted-foreground truncate mt-1">
            {deptSubsidiary}
          </p>
        )}
        <p className="text-xs text-muted-foreground truncate mt-1">
          {user.email}
        </p>
      </button>

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t border-border">
        <Button
          onClick={handleSendMail}
          size="sm"
          variant="primary"
          className="flex-1"
        >
          <Mail size={16} className="mr-1" aria-hidden="true" />
          <span className="hidden sm:inline">Mail</span>
          <span className="sm:hidden">Mail</span>
        </Button>
        {currentUser?.id !== user.id && (
          <Button
            onClick={handleMessage}
            size="sm"
            variant="outline"
            className="flex-1"
          >
            <MessageSquare size={16} className="mr-1" aria-hidden="true" />
            <span className="hidden sm:inline">Message</span>
            <span className="sm:hidden">Msg</span>
          </Button>
        )}
        {/* <Button
          onClick={handleClick}
          size="sm"
          variant="outline"
          className="flex-1"
        >
          Profile
        </Button> */}
      </div>
    </article>
  );
}
