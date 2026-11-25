import { useEffect } from 'react';

import { useBrand } from '@/core/brand/store';
import { useLocation } from '@/core/router/router';

import { usePageTitle } from './page-title';

/**
 * Document metadata. React 19 hoists <title> and <meta> into <head>,
 * so no helmet library is needed. The title is also published for the
 * shell's breadcrumbs (see `usePageTitle`).
 */
export function Head({ title, description }: { title?: string; description?: string }) {
  const brand = useBrand();
  const { pathname } = useLocation();

  useEffect(() => {
    usePageTitle.setState({ pathname, title: title ?? null });
  }, [pathname, title]);

  return (
    <>
      <title>{title ? `${title} · ${brand.name}` : brand.name}</title>
      <meta name="description" content={description ?? brand.description} />
    </>
  );
}
