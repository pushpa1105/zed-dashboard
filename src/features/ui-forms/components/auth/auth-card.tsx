import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';
import { Alert, AlertDescription } from '@/shared/ui/alert';

/** Frame shared by the auth forms: icon, title, description, error, body, footer. */
export function AuthCard({
  icon: Icon,
  title,
  description,
  error,
  footer,
  children,
  className,
}: {
  icon?: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  error?: string | null;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'mx-auto flex w-full max-w-sm flex-col gap-6 rounded-2xl border bg-card p-6 shadow-sm sm:p-8',
        className,
      )}
    >
      <div className="space-y-2 text-center">
        {Icon && (
          <span className="mx-auto mb-3 flex size-11 items-center justify-center rounded-xl border bg-muted/50 text-foreground">
            <Icon className="size-5" />
          </span>
        )}
        <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {children}
      {footer && <div className="text-center text-sm text-muted-foreground">{footer}</div>}
    </div>
  );
}

/** "or continue with" divider. */
export function AuthDivider({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <span className="h-px flex-1 bg-border" />
      {children}
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}
