import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

import {
  VariantTabs,
  VariantTabsContent,
  VariantTabsList,
  VariantTabsTrigger,
} from './variant-tabs';

export type PageTab = {
  value: string;
  label: ReactNode;
  icon?: ReactNode;
  count?: ReactNode;
  content: ReactNode;
  disabled?: boolean;
};

export type PageTabsProps = {
  tabs: PageTab[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Rendered at the right end of the tab row (filters, actions). */
  actions?: ReactNode;
  className?: string;
};

/**
 * Page-level sections as underline tabs, with counts and a right-side
 * action slot. Pass `value`/`onValueChange` to sync it with the URL.
 */
export function PageTabs({
  tabs,
  value,
  defaultValue = tabs[0]?.value,
  onValueChange,
  actions,
  className,
}: PageTabsProps) {
  return (
    <VariantTabs
      variant="underline"
      value={value}
      defaultValue={value ? undefined : defaultValue}
      onValueChange={onValueChange}
      className={cn('gap-6', className)}
    >
      <div className="flex items-end gap-4 border-b">
        <VariantTabsList className="border-b-0">
          {tabs.map((tab) => (
            <VariantTabsTrigger
              key={tab.value}
              value={tab.value}
              count={tab.count}
              disabled={tab.disabled}
            >
              {tab.icon}
              {tab.label}
            </VariantTabsTrigger>
          ))}
        </VariantTabsList>
        {actions && <div className="ml-auto flex items-center gap-2 pb-2">{actions}</div>}
      </div>
      {tabs.map((tab) => (
        <VariantTabsContent key={tab.value} value={tab.value}>
          {tab.content}
        </VariantTabsContent>
      ))}
    </VariantTabs>
  );
}
