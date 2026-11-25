import { LayoutGrid, MapPin, Rows3, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { Link, useNavigate } from '@/core/router/router';
import { useEnumParam, useSearchParam } from '@/core/router/search-params';
import { InitialsAvatar } from '@/shared/components/display/initials-avatar';
import { UserCell } from '@/shared/components/display/user-cell';
import { SegmentedControl } from '@/shared/components/forms/segmented-control';
import { cn } from '@/shared/lib/cn';
import { Input } from '@/shared/ui/input';
import { Skeleton } from '@/shared/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

import { peopleQuery, useEmployees } from '../api/hr-api';
import { DepartmentLabel, EmployeeStatus } from '../components/hr-parts';
import { WidgetError } from '../components/widget-error';
import { longDate } from '../lib/format';
import { groupBy } from '../lib/group-by';
import { departmentColor } from '../model/hr';
import { hrRoutes } from '../routes';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(peopleQuery());
    return null;
  };

const VIEWS = ['cards', 'table'] as const;
type View = (typeof VIEWS)[number];

export default function DirectoryPage() {
  const { t } = useTranslation('hr');
  const navigate = useNavigate();
  const people = useEmployees();
  const [view, setView] = useEnumParam('view', VIEWS, 'cards');
  const [department, setDepartment] = useSearchParam('department', 'all');
  const [query, setQuery] = useState('');

  const all = useMemo(() => people.data ?? [], [people.data]);
  const managers = useMemo(() => new Map(all.map((p) => [p.id, p.name])), [all]);
  const departments = useMemo(
    () =>
      [...groupBy(all, (p) => p.department)]
        .map(([name, members]) => [name, members.length] as const)
        .sort((a, b) => b[1] - a[1]),
    [all],
  );
  const needle = query.trim().toLowerCase();
  const list = all.filter(
    (p) =>
      (department === 'all' || p.department === department) &&
      `${p.name} ${p.title} ${p.email}`.toLowerCase().includes(needle),
  );

  return (
    <Page
      width="full"
      title={t('directory.title')}
      description={t('directory.description')}
      actions={
        <span className="text-sm text-muted-foreground">
          {t('directory.count', { count: list.length })}
        </span>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('directory.search')}
              aria-label={t('directory.search')}
              className="pl-9"
            />
          </div>
          <SegmentedControl<View>
            className="ml-auto"
            value={view}
            onChange={setView}
            aria-label={t('common.view.cards')}
            options={[
              {
                value: 'cards',
                label: t('common.view.cards'),
                icon: <LayoutGrid className="size-4" />,
              },
              { value: 'table', label: t('common.view.table'), icon: <Rows3 className="size-4" /> },
            ]}
          />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label={t('common.department')}>
          {[['all', all.length] as const, ...departments].map(([name, count]) => {
            const active = department === name;
            return (
              <button
                key={name}
                type="button"
                aria-pressed={active}
                onClick={() => setDepartment(name)}
                className={cn(
                  'inline-flex h-8 items-center gap-2 rounded-full border px-3 text-sm transition-colors hover:bg-accent',
                  active && 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/15',
                )}
              >
                {name === 'all' ? (
                  t('common.allDepartments')
                ) : (
                  <DepartmentLabel department={name} />
                )}
                <span className="text-xs text-muted-foreground tabular-nums">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {people.isError ? (
        <WidgetError onRetry={() => void people.refetch()} />
      ) : !people.data ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-52 rounded-xl" />
          ))}
        </div>
      ) : view === 'cards' ? (
        <ul className="grid gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
          {list.map((p) => (
            <li key={p.id}>
              <Link
                to={hrRoutes.person.href({ personId: p.id })}
                className="group flex h-full flex-col overflow-hidden rounded-xl border bg-card shadow-xs transition-shadow hover:shadow-md"
              >
                <span
                  className="h-1.5"
                  style={{ background: departmentColor(p.department) }}
                  aria-hidden
                />
                <div className="flex flex-1 flex-col items-center gap-3 px-5 pt-6 pb-5 text-center">
                  <InitialsAvatar name={p.name} size="lg" />
                  <div className="min-w-0">
                    <p className="truncate font-semibold group-hover:underline">{p.name}</p>
                    <p className="truncate text-sm text-muted-foreground">{p.title}</p>
                  </div>
                  <EmployeeStatus status={p.status} />
                </div>
                <div className="grid grid-cols-2 divide-x border-t text-xs text-muted-foreground">
                  <span className="flex items-center justify-center gap-1.5 truncate px-2 py-3">
                    <MapPin className="size-3.5 shrink-0" aria-hidden /> {p.location}
                  </span>
                  <span className="flex items-center justify-center px-2 py-3">
                    <DepartmentLabel department={p.department} />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">{t('directory.columns.name')}</TableHead>
                <TableHead>{t('directory.columns.department')}</TableHead>
                <TableHead className="hidden md:table-cell">
                  {t('directory.columns.location')}
                </TableHead>
                <TableHead className="hidden lg:table-cell">
                  {t('directory.columns.type')}
                </TableHead>
                <TableHead className="hidden lg:table-cell">
                  {t('directory.columns.startDate')}
                </TableHead>
                <TableHead className="pr-6">{t('directory.columns.status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((p) => (
                <TableRow
                  key={p.id}
                  className="cursor-pointer"
                  onClick={() => void navigate(hrRoutes.person.href({ personId: p.id }))}
                >
                  <TableCell className="pl-6">
                    <UserCell
                      name={p.name}
                      secondary={
                        <span className="flex items-center gap-1">
                          {p.title}
                          {p.managerId && (
                            <span className="hidden xl:inline">
                              · {t('directory.reportsTo', { name: managers.get(p.managerId) })}
                            </span>
                          )}
                        </span>
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <DepartmentLabel department={p.department} />
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {p.location}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">
                    {t(`employment.${p.employmentType}`)}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground tabular-nums lg:table-cell">
                    {longDate(p.startDate)}
                  </TableCell>
                  <TableCell className="pr-6">
                    <EmployeeStatus status={p.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Page>
  );
}
