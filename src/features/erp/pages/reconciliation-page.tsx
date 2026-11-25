import { Banknote, BookCheck, Link2, Scale, Unlink } from 'lucide-react';
import { useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { StatCard } from '@/shared/components/dashboard/stat-card';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Progress } from '@/shared/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

import { ErrorPanel } from '../components/error-panel';
import { money, shortDate } from '../lib/money';
import {
  reconciliationQuery,
  useMatch,
  useReconciliation,
  useUnmatch,
} from '../operations/api/operations-api';
import { ReconciliationList } from '../operations/components/reconciliation-list';
import type { Reconciliation } from '../operations/model/operations';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(reconciliationQuery());
    return null;
  };

const sum = (lines: Array<{ amount: number }>) => lines.reduce((s, l) => s + l.amount, 0);
const cents = (n: number) => Math.round(n * 100);

function summarize(data: Reconciliation) {
  const matched = data.statement.filter((l) => l.matchId);
  const statementBalance = data.openingBalance + sum(data.statement);
  const reconciledBalance = data.openingBalance + sum(matched);
  return {
    statementBalance,
    bookBalance: data.openingBalance + sum(data.ledger),
    reconciledBalance,
    difference: statementBalance - reconciledBalance,
    progress: data.statement.length ? (matched.length / data.statement.length) * 100 : 0,
    pairs: matched.map((line) => ({
      line,
      entry: data.ledger.find((e) => e.id === line.matchId)!,
    })),
  };
}

const KPIS = [
  { key: 'statement', field: 'statementBalance', icon: Banknote, color: 'var(--chart-4)' },
  { key: 'books', field: 'bookBalance', icon: BookCheck, color: 'var(--chart-1)' },
  { key: 'reconciled', field: 'reconciledBalance', icon: Link2, color: 'var(--success)' },
  { key: 'difference', field: 'difference', icon: Scale, color: 'var(--warning)' },
] as const;

/** Bank statement vs general ledger: pick one line on each side and match them. */
export default function ReconciliationPage() {
  const { t } = useTranslation('erp', { keyPrefix: 'reconciliation' });
  const recon = useReconciliation();
  const match = useMatch();
  const unmatch = useUnmatch();
  const [bankId, setBankId] = useState<string | null>(null);
  const [ledgerId, setLedgerId] = useState<string | null>(null);
  const data = recon.data;
  const summary = data && summarize(data);

  const bankLine = data?.statement.find((l) => l.id === bankId);
  const ledgerLine = data?.ledger.find((l) => l.id === ledgerId);
  const sameAmount =
    !!bankLine && !!ledgerLine && cents(bankLine.amount) === cents(ledgerLine.amount);
  const busy = match.isPending || unmatch.isPending;

  if (recon.isError) {
    return (
      <Page title={t('title')} width="full">
        <ErrorPanel onRetry={() => void recon.refetch()} />
      </Page>
    );
  }

  return (
    <Page
      title={t('title')}
      description={data ? t('description', { account: data.account }) : undefined}
      width="full"
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KPIS.map((kpi) => (
          <StatCard
            key={kpi.key}
            variant="tile"
            icon={kpi.icon}
            color={
              kpi.key === 'difference' && summary && !cents(summary.difference)
                ? 'var(--success)'
                : kpi.color
            }
            label={t(`kpis.${kpi.key}`)}
            value={summary ? money(summary[kpi.field]) : '—'}
            loading={!summary}
          />
        ))}
      </div>

      {summary && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t('progress')}</span>
            <span className="font-medium tabular-nums">{Math.round(summary.progress)}%</span>
          </div>
          <Progress value={summary.progress} aria-label={t('progress')} />
        </div>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <ReconciliationList
          title={t('bank.title')}
          description={t('bank.description')}
          items={data?.statement
            .filter((l) => !l.matchId)
            .map((l) => ({ ...l, title: l.description, subtitle: l.id }))}
          selectedId={bankId}
          onSelect={setBankId}
          emptyText={t('bank.empty')}
        />
        <ReconciliationList
          title={t('ledger.title')}
          description={t('ledger.description')}
          items={data?.ledger
            .filter((l) => !l.matchId)
            .map((l) => ({
              ...l,
              title: l.memo,
              subtitle: l.reference,
              suggested: !!bankLine && cents(bankLine.amount) === cents(l.amount),
            }))
            .sort((a, b) => Number(b.suggested) - Number(a.suggested))}
          selectedId={ledgerId}
          onSelect={setLedgerId}
          emptyText={t('ledger.empty')}
          suggestedText={t('ledger.suggested')}
        />
      </div>

      <div
        className={cn(
          'flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between',
          (bankLine || ledgerLine) && 'border-primary/40',
        )}
      >
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {!bankLine || !ledgerLine
            ? t('matchBar.hint')
            : sameAmount
              ? t('matchBar.ready', { amount: money(bankLine.amount) })
              : t('matchBar.mismatch', { amount: money(bankLine.amount - ledgerLine.amount) })}
        </p>
        <Button
          disabled={!sameAmount || busy}
          onClick={() =>
            match.mutate(
              { statementId: bankId!, ledgerId: ledgerId! },
              {
                onSuccess: () => {
                  setBankId(null);
                  setLedgerId(null);
                },
              },
            )
          }
        >
          <Link2 /> {t('matchBar.match')}
        </Button>
      </div>

      <SectionCard flush title={t('matched.title', { count: summary?.pairs.length ?? 0 })}>
        <div className="border-t">
          <Table aria-label={t('matched.label')}>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">{t('matched.date')}</TableHead>
                <TableHead>{t('matched.bank')}</TableHead>
                <TableHead className="hidden md:table-cell">{t('matched.books')}</TableHead>
                <TableHead className="text-right">{t('matched.amount')}</TableHead>
                <TableHead className="w-28 pr-6" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary?.pairs.map(({ line, entry }) => (
                <TableRow key={line.id}>
                  <TableCell className="pl-6 text-muted-foreground">
                    {shortDate(line.date)}
                  </TableCell>
                  <TableCell className="font-medium">{line.description}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="font-mono text-xs">{entry.reference}</span>
                    <span className="text-muted-foreground"> · {entry.memo}</span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{money(line.amount)}</TableCell>
                  <TableCell className="pr-6 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={busy}
                      aria-label={t('matched.unmatchOne', { id: line.id })}
                      onClick={() => unmatch.mutate(line.id)}
                    >
                      <Unlink /> {t('matched.unmatch')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {summary?.pairs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    {t('matched.empty')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </SectionCard>
    </Page>
  );
}
