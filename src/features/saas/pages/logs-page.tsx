import { ChevronRight, ScrollText, Search } from 'lucide-react';
import { Fragment, useState } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { CodeBlock } from '@/shared/components/display/code-block';
import { CopyButton } from '@/shared/components/display/copy-button';
import { EmptyState } from '@/shared/components/display/empty-state';
import { ErrorState } from '@/shared/components/display/error-state';
import { useDebounce } from '@/shared/hooks/use-debounce';
import { cn } from '@/shared/lib/cn';
import { formatDate } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Skeleton } from '@/shared/ui/skeleton';
import { Spinner } from '@/shared/ui/spinner';

import { useLogs } from '../api/platform-api';
import { MethodTag } from '../components/method-tag';
import { LOG_LEVELS, type LogEntry, type LogLevel } from '../model/platform';

const LEVEL_CLASS: Record<LogLevel, { text: string; dot: string; row?: string }> = {
  error: { text: 'text-destructive', dot: 'bg-destructive', row: 'bg-destructive/[0.04]' },
  warn: { text: 'text-[color:var(--chart-3)]', dot: 'bg-warning', row: 'bg-warning/[0.06]' },
  info: { text: 'text-[color:var(--chart-4)]', dot: 'bg-[color:var(--chart-4)]' },
  debug: { text: 'text-muted-foreground', dot: 'bg-muted-foreground/50' },
};

function LogRow({ log, open, onToggle }: { log: LogEntry; open: boolean; onToggle: () => void }) {
  const { t } = useTranslation('saas');
  const level = LEVEL_CLASS[log.level];
  return (
    <>
      <tr
        className={cn(
          'cursor-pointer border-b font-mono text-xs hover:bg-muted/60',
          level.row,
          open && 'bg-muted/60',
        )}
        onClick={onToggle}
        aria-expanded={open}
      >
        <td className="w-8 py-2.5 pl-4">
          <ChevronRight
            className={cn(
              'size-3.5 text-muted-foreground transition-transform',
              open && 'rotate-90',
            )}
          />
        </td>
        <td className="py-2.5 pr-4 whitespace-nowrap text-muted-foreground tabular-nums">
          {formatDate(log.at, 'MMM D HH:mm:ss.SSS')}
        </td>
        <td className="py-2.5 pr-4">
          <span
            className={cn('inline-flex items-center gap-1.5 font-semibold uppercase', level.text)}
          >
            <span className={cn('size-1.5 rounded-full', level.dot)} />
            {log.level}
          </span>
        </td>
        <td
          className={cn(
            'py-2.5 pr-4 tabular-nums',
            log.status >= 500
              ? 'text-destructive'
              : log.status >= 400
                ? 'text-[color:var(--chart-3)]'
                : 'text-muted-foreground',
          )}
        >
          {log.status}
        </td>
        <td className="hidden py-2.5 pr-4 md:table-cell">
          <MethodTag method={log.method} />
        </td>
        <td className="hidden max-w-56 truncate py-2.5 pr-4 lg:table-cell">{log.path}</td>
        <td className="py-2.5 pr-4 text-right whitespace-nowrap text-muted-foreground tabular-nums">
          {log.duration} ms
        </td>
        <td className="max-w-0 truncate py-2.5 pr-4 font-sans text-sm">{log.message}</td>
      </tr>
      {open && (
        <tr className="border-b bg-muted/30">
          <td colSpan={8} className="px-4 py-4">
            <div className="grid gap-4 lg:grid-cols-[16rem_1fr]">
              <dl className="space-y-3 text-xs">
                {[
                  [t('logs.detail.requestId'), log.requestId],
                  [t('logs.detail.region'), log.region],
                  [t('logs.detail.path'), log.path],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="flex items-center gap-1 font-mono">
                      <span className="truncate">{value}</span>
                      {label === t('logs.detail.requestId') && (
                        <CopyButton value={value!} label={t('logs.copy')} />
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
              <CodeBlock code={log.payload} title="payload.json" lineNumbers />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/** Request log viewer: level toggles, search, expandable JSON payloads, cursor paging. */
export default function LogsPage() {
  const { t } = useTranslation('saas');
  const [levels, setLevels] = useState<LogLevel[]>([]);
  const [q, setQ] = useState('');
  const query = useDebounce(q, 300);
  const logs = useLogs(levels, query);
  const [openId, setOpenId] = useState<string | null>(null);
  const pages = logs.data?.pages ?? [];
  const rows = pages.flatMap((p) => p.data);
  const counts = pages[0]?.counts ?? {};
  const total = pages[0]?.total ?? 0;

  const toggle = (level: LogLevel) =>
    setLevels((current) =>
      current.includes(level) ? current.filter((l) => l !== level) : [...current, level],
    );

  return (
    <Page width="full" title={t('logs.title')} description={t('logs.description')}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('logs.search')}
            aria-label={t('logs.search')}
            className="pl-9 font-mono text-xs"
          />
        </div>
        <div className="flex flex-wrap gap-1.5" role="toolbar" aria-label={t('logs.levels')}>
          {LOG_LEVELS.map((level) => {
            const active = levels.includes(level);
            return (
              <button
                key={level}
                type="button"
                aria-pressed={active}
                onClick={() => toggle(level)}
                className={cn(
                  'inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm transition-colors hover:bg-accent',
                  active && 'border-primary bg-primary/10 text-primary hover:bg-primary/15',
                )}
              >
                <span className={cn('size-2 rounded-full', LEVEL_CLASS[level].dot)} />
                {t(`logs.level.${level}`)}
                <span className="text-xs text-muted-foreground tabular-nums">
                  {counts[level] ?? 0}
                </span>
              </button>
            );
          })}
        </div>
        <p className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-success" />
          </span>
          {t('logs.matching', { count: total })}
        </p>
      </div>

      {logs.isError ? (
        <ErrorState title={t('common.error')} onRetry={() => void logs.refetch()} />
      ) : (
        <div
          className={cn(
            'overflow-hidden rounded-xl border bg-card shadow-xs',
            logs.isPlaceholderData && 'opacity-70',
          )}
        >
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-left" aria-label={t('logs.title')}>
              <colgroup>
                <col className="w-8" />
                <col className="w-44" />
                <col className="w-20" />
                <col className="w-14" />
                <col className="hidden w-20 md:table-column" />
                <col className="hidden w-60 lg:table-column" />
                <col className="w-20" />
                <col />
              </colgroup>
              <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="py-2.5 pl-4" />
                  <th className="py-2.5 pr-4 font-medium">{t('logs.col.time')}</th>
                  <th className="py-2.5 pr-4 font-medium">{t('logs.col.level')}</th>
                  <th className="py-2.5 pr-4 font-medium">{t('logs.col.status')}</th>
                  <th className="hidden py-2.5 pr-4 font-medium md:table-cell">
                    {t('logs.col.method')}
                  </th>
                  <th className="hidden py-2.5 pr-4 font-medium lg:table-cell">
                    {t('logs.col.path')}
                  </th>
                  <th className="py-2.5 pr-4 text-right font-medium">{t('logs.col.duration')}</th>
                  <th className="py-2.5 pr-4 font-medium">{t('logs.col.message')}</th>
                </tr>
              </thead>
              <tbody>
                {logs.isPending
                  ? Array.from({ length: 10 }, (_, i) => (
                      <tr key={i} className="border-b">
                        <td colSpan={8} className="px-4 py-2">
                          <Skeleton className="h-5" />
                        </td>
                      </tr>
                    ))
                  : rows.map((log) => (
                      <Fragment key={log.id}>
                        <LogRow
                          log={log}
                          open={openId === log.id}
                          onToggle={() => setOpenId(openId === log.id ? null : log.id)}
                        />
                      </Fragment>
                    ))}
              </tbody>
            </table>
          </div>
          {!logs.isPending && rows.length === 0 && (
            <EmptyState
              variant="plain"
              icon={ScrollText}
              title={t('logs.empty')}
              className="py-12"
            />
          )}
          {logs.hasNextPage && (
            <div className="flex justify-center border-t p-3">
              <Button
                variant="ghost"
                size="sm"
                disabled={logs.isFetchingNextPage}
                onClick={() => void logs.fetchNextPage()}
              >
                {logs.isFetchingNextPage && <Spinner />}{' '}
                {t('logs.loadMore', { shown: rows.length, total })}
              </Button>
            </div>
          )}
        </div>
      )}
    </Page>
  );
}
