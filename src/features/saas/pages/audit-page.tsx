import { Download, ShieldCheck } from 'lucide-react';
import { useMemo, useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { EmptyState } from '@/shared/components/display/empty-state';
import { ErrorState } from '@/shared/components/display/error-state';
import { SearchInput } from '@/shared/components/forms/search-input';
import { formatDate } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

import { auditQuery, useAudit } from '../api/admin-api';
import { AuditEventSheet } from '../components/audit-event-sheet';
import { ChipFilter } from '../components/chip-filter';
import { FilterSelect } from '../components/filter-select';
import { SeverityTag } from '../components/severity-tag';
import { downloadCsv } from '../lib/csv';
import { AUDIT_CATEGORIES, AUDIT_SEVERITIES, type AuditEvent } from '../model/admin';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(auditQuery());
    return null;
  };

const ALL = 'all' as const;
const PAGE = 50;

/** Security-relevant events with filters, a raw JSON detail sheet and CSV export. */
export default function AuditPage() {
  const { t } = useTranslation('saas');
  const audit = useAudit();
  const [q, setQ] = useState('');
  const [category, setCategory] = useState<string>(ALL);
  const [severity, setSeverity] = useState<string>(ALL);
  const [limit, setLimit] = useState(PAGE);
  const [selected, setSelected] = useState<AuditEvent | null>(null);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (audit.data ?? []).filter(
      (e) =>
        (category === ALL || e.category === category) &&
        (severity === ALL || e.severity === severity) &&
        (!needle ||
          `${e.action} ${e.actor.name} ${e.actor.email} ${e.target} ${e.ip}`
            .toLowerCase()
            .includes(needle)),
    );
  }, [audit.data, q, category, severity]);

  const exportCsv = () =>
    downloadCsv(
      `audit-log-${formatDate(Date.now(), 'YYYY-MM-DD')}.csv`,
      ['id', 'time', 'actor', 'email', 'action', 'target', 'ip', 'severity'],
      rows.map((e) => [
        e.id,
        new Date(e.at).toISOString(),
        e.actor.name,
        e.actor.email,
        e.action,
        e.target,
        e.ip,
        e.severity,
      ]),
    );

  return (
    <Page
      width="full"
      title={t('audit.title')}
      description={t('audit.description')}
      actions={
        <Button variant="outline" disabled={!rows.length} onClick={exportCsv}>
          <Download /> {t('audit.export')}
        </Button>
      }
    >
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <SearchInput
          value={q}
          onChange={setQ}
          placeholder={t('audit.search')}
          aria-label={t('audit.search')}
          containerClassName="lg:w-72"
        />
        <ChipFilter
          label={t('audit.categories')}
          value={category}
          onChange={setCategory}
          options={[ALL, ...AUDIT_CATEGORIES].map((c) => ({
            value: c,
            label: t(`audit.category.${c}`),
          }))}
        />
        <FilterSelect
          label={t('audit.col.severity')}
          value={severity}
          onChange={setSeverity}
          options={[ALL, ...AUDIT_SEVERITIES].map((s) => ({
            value: s,
            label: t(`audit.severity.${s}`),
          }))}
        />
      </div>

      {audit.isError ? (
        <ErrorState title={t('common.error')} onRetry={() => void audit.refetch()} />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
          <div className="overflow-x-auto">
            <Table aria-label={t('audit.title')}>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">{t('audit.col.time')}</TableHead>
                  <TableHead>{t('audit.col.actor')}</TableHead>
                  <TableHead>{t('audit.col.action')}</TableHead>
                  <TableHead className="hidden md:table-cell">{t('audit.col.target')}</TableHead>
                  <TableHead className="hidden lg:table-cell">{t('audit.col.ip')}</TableHead>
                  <TableHead className="pr-6">{t('audit.col.severity')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {audit.isPending
                  ? Array.from({ length: 10 }, (_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={6} className="px-6">
                          <Skeleton className="h-6" />
                        </TableCell>
                      </TableRow>
                    ))
                  : rows.slice(0, limit).map((e) => (
                      <TableRow
                        key={e.id}
                        tabIndex={0}
                        className="cursor-pointer"
                        aria-label={t('audit.open', { action: e.action })}
                        onClick={() => setSelected(e)}
                        onKeyDown={(k) => k.key === 'Enter' && setSelected(e)}
                      >
                        <TableCell className="pl-6 whitespace-nowrap text-muted-foreground tabular-nums">
                          {formatDate(e.at, 'MMM D HH:mm')}
                        </TableCell>
                        <TableCell className="font-medium whitespace-nowrap">
                          {e.actor.name}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{e.action}</TableCell>
                        <TableCell className="hidden max-w-56 truncate text-muted-foreground md:table-cell">
                          {e.target}
                        </TableCell>
                        <TableCell className="hidden font-mono text-xs text-muted-foreground lg:table-cell">
                          {e.ip}
                        </TableCell>
                        <TableCell className="pr-6">
                          <SeverityTag severity={e.severity} />
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </div>
          {!audit.isPending && rows.length === 0 && (
            <EmptyState
              variant="plain"
              icon={ShieldCheck}
              title={t('audit.empty')}
              className="py-12"
            />
          )}
          {rows.length > limit && (
            <div className="flex justify-center border-t p-3">
              <Button variant="ghost" size="sm" onClick={() => setLimit(limit + PAGE)}>
                {t('audit.more', { shown: limit, total: rows.length })}
              </Button>
            </div>
          )}
        </div>
      )}

      <AuditEventSheet event={selected} onClose={() => setSelected(null)} />
    </Page>
  );
}
