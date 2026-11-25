import { BellRing, Check } from 'lucide-react';
import type { ReactNode } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { Link } from '@/core/router/router';
import { InitialsAvatar } from '@/shared/components/display/initials-avatar';
import { StatusBadge } from '@/shared/components/display/status-badge';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';

import { departmentColor, type Employee } from '../model/hr';
import { hrRoutes } from '../routes';

/** Text with a leading colour dot (departments, benefit categories…). */
export function DotLabel({
  color,
  children,
  className,
}: {
  color: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap', className)}>
      <span className="size-2 shrink-0 rounded-full" style={{ background: color }} aria-hidden />
      {children}
    </span>
  );
}

export function DepartmentLabel({
  department,
  className,
}: {
  department: string;
  className?: string;
}) {
  return (
    <DotLabel color={departmentColor(department)} className={className}>
      {department}
    </DotLabel>
  );
}

const STATUS_TONE = { active: 'success', onLeave: 'warning', onboarding: 'info' } as const;

export function EmployeeStatus({ status }: { status: Employee['status'] }) {
  const { t } = useTranslation('hr');
  return <StatusBadge status={status} label={t(`status.${status}`)} tone={STATUS_TONE[status]} />;
}

/** Avatar and name linking to the employee profile. */
export function PersonLink({ personId, name }: { personId: string; name: string }) {
  return (
    <Link
      to={hrRoutes.person.href({ personId })}
      className="flex min-w-0 items-center gap-3 font-medium hover:underline"
    >
      <InitialsAvatar name={name} size="xs" />
      <span className="truncate">{name}</span>
    </Link>
  );
}

/** "Send reminder" that turns into a quiet confirmation once sent. */
export function RemindButton({
  reminded,
  disabled,
  onRemind,
}: {
  reminded: boolean;
  disabled?: boolean;
  onRemind: () => void;
}) {
  const { t } = useTranslation('hr');
  return (
    <Button variant="outline" size="sm" disabled={reminded || disabled} onClick={onRemind}>
      {reminded ? <Check /> : <BellRing />}
      {t(reminded ? 'common.reminded' : 'common.remind')}
    </Button>
  );
}

/** Two-column label/value grid used at the top of detail sheets. */
export function FactGrid({ items }: { items: Array<{ label: string; value: ReactNode }> }) {
  return (
    <dl className="grid grid-cols-2 gap-4 rounded-lg bg-muted/60 p-4 text-sm">
      {items.map(({ label, value }) => (
        <div key={label}>
          <dt className="text-xs text-muted-foreground">{label}</dt>
          <dd className="mt-1 font-medium tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
