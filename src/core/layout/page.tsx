import type { ReactNode } from 'react';

import { PageHeader } from '@/shared/components/page-header';
import { cn } from '@/shared/lib/cn';

import { Head } from './head';

type PageProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  /** `narrow` for forms, `wide` (default) for lists, `full` for dashboards. */
  width?: 'narrow' | 'wide' | 'full';
  className?: string;
  children: ReactNode;
};

/** Standard page inside the app shell: document title + header + content. */
export function Page({
  title,
  description,
  actions,
  width = 'wide',
  className,
  children,
}: PageProps) {
  return (
    <>
      <Head title={title} description={description} />
      <div
        className={cn(
          'mx-auto w-full space-y-6 p-4 md:p-8',
          { narrow: 'max-w-3xl', wide: 'max-w-6xl', full: 'max-w-[1440px]' }[width],
          className,
        )}
      >
        <PageHeader title={title} description={description} actions={actions} />
        {children}
      </div>
    </>
  );
}
