import { Award, Download, Eye, GraduationCap, Printer } from 'lucide-react';
import { useState } from 'react';

import { useCurrentUser } from '@/core/auth/session';
import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { CopyButton } from '@/shared/components/display/copy-button';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Skeleton } from '@/shared/ui/skeleton';

import { certificatesQuery, useCertificates } from '../api/academy-api';
import { QueryError } from '../components/query-error';
import { longDate } from '../lib/format';
import type { Certificate } from '../model/academy';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(certificatesQuery());
    return null;
  };

/** The certificate itself, drawn with type and borders (prints cleanly). */
function CertificateSheet({ cert }: { cert: Certificate }) {
  const { t } = useTranslation('academy');
  const user = useCurrentUser();
  return (
    <div className="relative overflow-hidden rounded-lg border-2 border-primary/30 bg-card p-8 text-center sm:p-12">
      <div className="pointer-events-none absolute inset-2 rounded-md border border-dashed border-primary/25" />
      <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <GraduationCap className="size-7" />
      </div>
      <p className="mt-6 text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
        {t('certificates.sheet.heading')}
      </p>
      <p className="mt-4 font-serif text-3xl italic">
        {user.firstName} {user.lastName}
      </p>
      <p className="mt-4 text-sm text-muted-foreground">{t('certificates.sheet.completed')}</p>
      <p className="mt-1 text-xl font-semibold text-balance">{cert.courseTitle}</p>
      <div className="mx-auto mt-8 grid max-w-md grid-cols-3 gap-4 text-xs">
        <div>
          <p className="text-muted-foreground">{t('certificates.issued')}</p>
          <p className="font-medium">{longDate(cert.issuedAt)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">{t('certificates.hours')}</p>
          <p className="font-medium tabular-nums">{cert.hours}</p>
        </div>
        <div>
          <p className="text-muted-foreground">{t('certificates.grade')}</p>
          <p className="font-medium tabular-nums">{cert.grade}%</p>
        </div>
      </div>
      <div className="mx-auto mt-10 flex max-w-sm items-end justify-between gap-6 text-xs">
        <div className="flex-1 border-t pt-2">
          <p className="font-medium">{cert.instructor}</p>
          <p className="text-muted-foreground">{t('certificates.sheet.instructor')}</p>
        </div>
        <div className="flex-1 border-t pt-2">
          <p className="font-mono font-medium">{cert.credentialId}</p>
          <p className="text-muted-foreground">{t('certificates.credential')}</p>
        </div>
      </div>
    </div>
  );
}

/** Earned certificates with a printable preview and a shareable credential ID. */
export default function CertificatesPage() {
  const { t } = useTranslation('academy');
  const query = useCertificates();
  const [preview, setPreview] = useState<Certificate | null>(null);
  const certs = query.data;

  return (
    <Page width="full" title={t('certificates.title')} description={t('certificates.description')}>
      {query.isError && !certs ? (
        <QueryError onRetry={() => void query.refetch()} />
      ) : !certs ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {certs.map((cert) => (
            <article
              key={cert.id}
              className="flex flex-col overflow-hidden rounded-xl border bg-card shadow-xs"
            >
              <div className="relative border-b bg-gradient-to-br from-primary/12 to-transparent p-6">
                <Award className="size-9 text-primary" />
                <p className="mt-4 text-xs font-medium tracking-wider text-muted-foreground uppercase">
                  {t('certificates.badge')}
                </p>
                <h3 className="mt-1 text-lg leading-snug font-semibold text-balance">
                  {cert.courseTitle}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">{cert.instructor}</p>
                <span className="absolute top-6 right-6 rounded-full bg-success/12 px-2 py-0.5 text-xs font-medium text-success tabular-nums">
                  {cert.grade}%
                </span>
              </div>
              <dl className="grid grid-cols-2 gap-4 p-6 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">{t('certificates.issued')}</dt>
                  <dd className="font-medium">{longDate(cert.issuedAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">{t('certificates.hours')}</dt>
                  <dd className="font-medium tabular-nums">{cert.hours}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-xs text-muted-foreground">{t('certificates.credential')}</dt>
                  <dd className="flex items-center gap-1 font-mono text-xs">
                    {cert.credentialId}
                    <CopyButton value={cert.credentialId} />
                  </dd>
                </div>
              </dl>
              <div className="mt-auto flex gap-2 border-t p-4">
                <Button variant="outline" className="flex-1" onClick={() => setPreview(cert)}>
                  <Eye /> {t('certificates.view')}
                </Button>
                <Button variant="ghost" size="icon" aria-label={t('certificates.download')}>
                  <Download />
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
      <Dialog open={!!preview} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t('certificates.preview')}</DialogTitle>
            <DialogDescription>{preview?.courseTitle}</DialogDescription>
          </DialogHeader>
          {preview && <CertificateSheet cert={preview} />}
          <DialogFooter>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer /> {t('certificates.print')}
            </Button>
            <Button onClick={() => setPreview(null)}>{t('certificates.close')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Page>
  );
}
