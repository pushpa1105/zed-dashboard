import { cn } from '@/shared/lib/cn';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';

import { InitialsAvatar } from './initials-avatar';

export type AvatarStackProps = {
  names: string[];
  /** Avatars shown before collapsing the rest into "+N". */
  max?: number;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
};

const OVERFLOW = { xs: 'size-6 text-[0.6rem]', sm: 'size-8 text-xs', md: 'size-10 text-sm' };

/** Overlapping avatars with name tooltips and a "+N" overflow chip. */
export function AvatarStack({ names, max = 4, size = 'sm', className }: AvatarStackProps) {
  const shown = names.slice(0, max);
  const rest = names.slice(max);

  return (
    <div className={cn('flex items-center -space-x-2', className)}>
      {shown.map((name) => (
        <Tooltip key={name}>
          <TooltipTrigger asChild>
            <span className="rounded-full ring-2 ring-card">
              <InitialsAvatar name={name} size={size} />
            </span>
          </TooltipTrigger>
          <TooltipContent>{name}</TooltipContent>
        </Tooltip>
      ))}
      {rest.length > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className={cn(
                'flex items-center justify-center rounded-full bg-muted font-medium text-muted-foreground ring-2 ring-card',
                OVERFLOW[size],
              )}
            >
              +{rest.length}
            </span>
          </TooltipTrigger>
          <TooltipContent>{rest.join(', ')}</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
