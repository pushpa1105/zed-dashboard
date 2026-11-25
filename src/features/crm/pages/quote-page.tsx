import { ArrowLeft } from 'lucide-react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { Link, useParams } from '@/core/router/router';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';

import { productsQuery, quoteQuery, useQuote } from '../api/quotes-api';
import { WidgetError } from '../components/crm-parts';
import { QuoteBuilder } from '../components/quote-builder';
import { crmRoutes } from '../routes';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async ({ params }) => {
    await Promise.all([
      queryClient.prefetchQuery(quoteQuery(params.quoteId!)),
      queryClient.prefetchQuery(productsQuery()),
    ]);
    return null;
  };

export default function QuotePage() {
  const { t } = useTranslation('crm');
  const { quoteId = '' } = useParams();
  const quote = useQuote(quoteId);
  const data = quote.data;

  if (quote.isError) {
    return (
      <Page width="full" title={t('common.notFound')}>
        <WidgetError onRetry={() => void quote.refetch()} />
      </Page>
    );
  }

  return (
    <Page
      width="full"
      title={data ? `${data.number} · ${data.title}` : '…'}
      description={data ? `${data.company} · ${data.contact}` : undefined}
      actions={
        <Button variant="outline" asChild>
          <Link to={crmRoutes.quotes.href()}>
            <ArrowLeft /> {t('nav.quotes')}
          </Link>
        </Button>
      }
    >
      {data ? (
        <QuoteBuilder key={data.id} quote={data} />
      ) : (
        <div className="grid gap-4 md:gap-6 lg:grid-cols-12">
          <Skeleton className="h-80 rounded-xl lg:col-span-8" />
          <Skeleton className="h-80 rounded-xl lg:col-span-4" />
        </div>
      )}
    </Page>
  );
}
