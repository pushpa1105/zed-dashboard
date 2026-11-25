import { CalendarX2, FileCheck2, FileText, PenLine } from 'lucide-react';
import { useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { BarChart } from '@/shared/components/charts/bar-chart';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { StatCard } from '@/shared/components/dashboard/stat-card';
import { Skeleton } from '@/shared/ui/skeleton';

import { documentsQuery, useDocuments } from '../api/people-ops-api';
import { DocumentSheet } from '../components/document-sheet';
import { DocumentsTable } from '../components/documents-table';
import { WidgetError } from '../components/widget-error';
import { daysUntil, percent } from '../lib/format';
import { groupBy } from '../lib/group-by';
import { pendingOf } from '../model/documents';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(documentsQuery());
    return null;
  };

export default function DocumentsPage() {
  const { t } = useTranslation('hr');
  const documents = useDocuments();
  const [openId, setOpenId] = useState<string>();

  const docs = documents.data ?? [];
  const acks = docs.flatMap((d) => d.acknowledgements);
  const pending = acks.filter((a) => !a.signedAt).length;
  const bySignature = [...groupBy(acks, (a) => a.department)].map(([department, list]) => ({
    department,
    signed: list.filter((a) => a.signedAt).length,
    pending: list.filter((a) => !a.signedAt).length,
  }));

  const stats = [
    { key: 'documents', icon: FileText, color: 'var(--primary)', value: docs.length },
    {
      key: 'signedRate',
      icon: FileCheck2,
      color: 'var(--success)',
      value: `${percent(acks.length - pending, acks.length)}%`,
    },
    { key: 'pending', icon: PenLine, color: 'var(--warning)', value: pending },
    {
      key: 'pastDue',
      icon: CalendarX2,
      color: 'var(--destructive)',
      value: docs.filter((d) => pendingOf(d).length && daysUntil(d.dueDate) < 0).length,
    },
  ] as const;

  return (
    <Page width="full" title={t('documents.title')} description={t('documents.description')}>
      <div className="grid grid-cols-2 gap-4 md:gap-6 xl:grid-cols-4">
        {stats.map(({ key, ...stat }) => (
          <StatCard
            key={key}
            {...stat}
            label={t(`documents.stats.${key}`)}
            loading={!documents.data}
          />
        ))}
      </div>

      {documents.isError ? (
        <WidgetError onRetry={() => void documents.refetch()} />
      ) : !documents.data ? (
        <Skeleton className="h-96 rounded-xl" />
      ) : (
        <div className="grid items-start gap-4 md:gap-6 2xl:grid-cols-[minmax(0,1fr)_24rem]">
          <DocumentsTable documents={docs} onOpen={setOpenId} />
          <SectionCard
            title={t('documents.byDepartment')}
            description={t('documents.byDepartmentHint')}
          >
            <BarChart
              data={bySignature}
              xKey="department"
              mode="stacked"
              horizontal
              className="h-80"
              series={[
                { key: 'signed', label: t('documents.chart.signed'), color: 'var(--success)' },
                { key: 'pending', label: t('documents.chart.pending'), color: 'var(--warning)' },
              ]}
            />
          </SectionCard>
        </div>
      )}

      <DocumentSheet
        doc={docs.find((d) => d.id === openId)}
        onOpenChange={(open) => !open && setOpenId(undefined)}
      />
    </Page>
  );
}
