import { Tabs as TabsPrimitive } from 'radix-ui';
import { createContext, useContext, type ComponentProps, type ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

export type TabsVariant = 'underline' | 'pills' | 'segmented' | 'vertical';

const VariantContext = createContext<TabsVariant>('underline');

const LIST: Record<TabsVariant, string> = {
  underline: 'flex w-full gap-5 border-b',
  pills: 'inline-flex flex-wrap gap-1',
  segmented: 'inline-flex rounded-lg bg-muted p-1',
  vertical: 'flex w-full flex-col gap-0.5 sm:w-48',
};

const TRIGGER: Record<TabsVariant, string> = {
  underline:
    '-mb-px border-b-2 border-transparent pb-2.5 pt-1 text-muted-foreground hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-foreground',
  pills:
    'h-8 rounded-full px-3.5 text-muted-foreground hover:bg-muted hover:text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground',
  segmented:
    'h-7 flex-1 rounded-md px-3 text-muted-foreground hover:text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs',
  vertical:
    'h-9 w-full justify-start rounded-md px-3 text-muted-foreground hover:bg-muted hover:text-foreground data-[state=active]:bg-accent data-[state=active]:text-accent-foreground',
};

/**
 * Tabs with four looks, built on the Radix primitive:
 * `underline` (page sections), `pills` (filters), `segmented` (view switch),
 * `vertical` (settings side nav).
 */
export function VariantTabs({
  variant = 'underline',
  className,
  ...props
}: ComponentProps<typeof TabsPrimitive.Root> & { variant?: TabsVariant }) {
  return (
    <VariantContext.Provider value={variant}>
      <TabsPrimitive.Root
        orientation={variant === 'vertical' ? 'vertical' : 'horizontal'}
        className={cn(
          variant === 'vertical' ? 'flex flex-col gap-6 sm:flex-row' : 'flex flex-col gap-4',
          className,
        )}
        {...props}
      />
    </VariantContext.Provider>
  );
}

export function VariantTabsList({
  className,
  ...props
}: ComponentProps<typeof TabsPrimitive.List>) {
  const variant = useContext(VariantContext);
  return <TabsPrimitive.List className={cn(LIST[variant], className)} {...props} />;
}

export function VariantTabsTrigger({
  className,
  count,
  children,
  ...props
}: ComponentProps<typeof TabsPrimitive.Trigger> & {
  /** Small counter after the label. */
  count?: ReactNode;
}) {
  const variant = useContext(VariantContext);
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'group/trigger inline-flex items-center justify-center gap-1.5 text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
        TRIGGER[variant],
        className,
      )}
      {...props}
    >
      {children}
      {count !== undefined && (
        <span className="rounded-full bg-muted px-1.5 text-xs text-muted-foreground tabular-nums group-data-[state=active]/trigger:bg-primary/10 group-data-[state=active]/trigger:text-primary">
          {count}
        </span>
      )}
    </TabsPrimitive.Trigger>
  );
}

export function VariantTabsContent({
  className,
  ...props
}: ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content className={cn('min-w-0 flex-1 outline-none', className)} {...props} />
  );
}
