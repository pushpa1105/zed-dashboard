import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { notify } from '@/core/notify/notify';
import { Link, useNavigate } from '@/core/router/router';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';

import { customersQuery, useCreateInvoice, useCustomers, useNextNumber } from '../api/invoices-api';
import { InvoiceEditor } from '../components/invoice-editor';
import { appInvoicesRoutes } from '../routes';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(customersQuery());
    return null;
  };

export default function NewInvoicePage() {
  const { t } = useTranslation('app-invoices');
  const navigate = useNavigate();
  const customers = useCustomers();
  const next = useNextNumber();
  const create = useCreateInvoice();
  const [pending, setPending] = useState<'draft' | 'send' | null>(null);

  return (
    <Page
      title={t('editor.title')}
      description={t('editor.subtitle')}
      width="full"
      actions={
        <Button variant="ghost" asChild>
          <Link to={appInvoicesRoutes.index.href()}>
            <ArrowLeft /> {t('detail.back')}
          </Link>
        </Button>
      }
    >
      {customers.isPending ? (
        <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
          <Skeleton className="h-96" />
          <Skeleton className="h-80" />
        </div>
      ) : (
        <InvoiceEditor
          customers={customers.data ?? []}
          number={next.data?.number}
          pending={pending}
          error={create.error}
          onCancel={() => void navigate(appInvoicesRoutes.index.href())}
          onSubmit={(payload) => {
            setPending(payload.send ? 'send' : 'draft');
            create.mutate(payload, {
              onSuccess: (invoice) => {
                notify.success(
                  payload.send
                    ? t('toast.sent', { number: invoice.number })
                    : t('toast.draft', { number: invoice.number }),
                );
                void navigate(appInvoicesRoutes.detail.href({ invoiceId: invoice.id }));
              },
              onSettled: () => setPending(null),
            });
          }}
        />
      )}
    </Page>
  );
}
