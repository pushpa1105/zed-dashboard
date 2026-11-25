import type { ReactNode } from 'react';

import { SearchInput } from '@/shared/components/forms/search-input';

/** Search box plus the list's own filter control, stacked on phones. */
export function ListFilters({
  search,
  onSearch,
  label,
  children,
}: {
  search: string;
  onSearch: (value: string) => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <SearchInput
        value={search}
        onChange={onSearch}
        placeholder={label}
        aria-label={label}
        containerClassName="sm:w-56"
      />
      {children}
    </div>
  );
}
