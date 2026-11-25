import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

import { InitialsAvatar, type InitialsAvatarProps } from './initials-avatar';

export type UserCellProps = {
  name: string;
  /** Email, role or any secondary line. */
  secondary?: ReactNode;
  size?: InitialsAvatarProps['size'];
  status?: InitialsAvatarProps['status'];
  className?: string;
};

/** Avatar + name + secondary line: the standard "person" cell for tables and lists. */
export function UserCell({ name, secondary, size = 'sm', status, className }: UserCellProps) {
  return (
    <div className={cn('flex min-w-0 items-center gap-2.5', className)}>
      <InitialsAvatar name={name} size={size} status={status} />
      <div className="min-w-0 leading-tight">
        <p className="truncate text-sm font-medium">{name}</p>
        {secondary && <p className="truncate text-xs text-muted-foreground">{secondary}</p>}
      </div>
    </div>
  );
}
