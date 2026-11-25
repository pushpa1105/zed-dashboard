import { cn } from '@/shared/lib/cn';

import { avatarTint, initialsOf } from './initials';

export type InitialsAvatarProps = {
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  shape?: 'circle' | 'square';
  /** Presence dot. */
  status?: 'online' | 'away' | 'offline';
  className?: string;
};

const SIZES = {
  xs: 'size-6 text-[0.6rem]',
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-12 text-base',
  xl: 'size-16 text-lg',
};

const STATUS = { online: 'bg-success', away: 'bg-warning', offline: 'bg-muted-foreground' };

/** Avatar rendered from a name: initials on a stable tint (no image needed). */
export function InitialsAvatar({
  name,
  size = 'sm',
  shape = 'circle',
  status,
  className,
}: InitialsAvatarProps) {
  return (
    <span className={cn('relative inline-flex shrink-0', className)}>
      <span
        className={cn(
          'flex items-center justify-center font-medium select-none',
          SIZES[size],
          shape === 'circle' ? 'rounded-full' : 'rounded-lg',
        )}
        style={avatarTint(name)}
        aria-label={name}
        role="img"
      >
        {initialsOf(name)}
      </span>
      {status && (
        <span
          className={cn(
            'absolute right-0 bottom-0 size-2.5 rounded-full ring-2 ring-card',
            STATUS[status],
          )}
          aria-label={status}
        />
      )}
    </span>
  );
}
