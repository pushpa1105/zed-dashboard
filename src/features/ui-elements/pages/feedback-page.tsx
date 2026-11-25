import {
  Bell,
  CheckCircle2,
  CircleAlert,
  Info,
  Inbox,
  Loader,
  MessageSquare,
  Rocket,
  SearchX,
  Sparkles,
  TriangleAlert,
  Upload,
  X,
} from 'lucide-react';
import { useState } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { notify, type NotifyOptions } from '@/core/notify/notify';
import { ProgressRing } from '@/shared/components/charts/progress-ring';
import { MeterList } from '@/shared/components/dashboard/meter-list';
import { Banner } from '@/shared/components/display/banner';
import { Callout } from '@/shared/components/display/callout';
import { EmptyState } from '@/shared/components/display/empty-state';
import { ErrorState } from '@/shared/components/display/error-state';
import { InitialsAvatar } from '@/shared/components/display/initials-avatar';
import { ProgressSteps } from '@/shared/components/display/progress-steps';
import {
  CardSkeleton,
  ChartSkeleton,
  ListSkeleton,
  TableSkeleton,
} from '@/shared/components/display/skeletons';
import { Stepper } from '@/shared/components/display/stepper';
import { Button } from '@/shared/ui/button';
import { Progress } from '@/shared/ui/progress';
import { Spinner } from '@/shared/ui/spinner';

import { ElementsPage } from '../components/elements-page';
import { Demo, ShowcaseGrid } from '../components/showcase';

const POSITIONS: NonNullable<NotifyOptions['position']>[] = [
  'top-left',
  'top-center',
  'top-right',
  'bottom-left',
  'bottom-center',
  'bottom-right',
];

const wait = (ms: number, fail = false) =>
  new Promise<void>((resolve, reject) =>
    window.setTimeout(() => (fail ? reject(new Error('timeout')) : resolve()), ms),
  );

export default function FeedbackPage() {
  const { t } = useTranslation('ui-elements');
  const [bannerKey, setBannerKey] = useState(0);
  const [calloutsOpen, setCalloutsOpen] = useState({ tip: true, warn: true });
  const [retrying, setRetrying] = useState(false);

  const showLoading = () => {
    const id = notify.loading(t('toasts.samples.loading'));
    window.setTimeout(() => notify.success(t('toasts.samples.loaded'), { id }), 1800);
  };

  const showCustom = () =>
    notify.custom(
      (id) => (
        <div className="flex w-[356px] gap-3 rounded-xl border bg-popover p-4 text-popover-foreground shadow-lg">
          <InitialsAvatar name="Leo Park" size="md" status="online" />
          <div className="min-w-0 flex-1 space-y-2">
            <div>
              <p className="text-sm font-medium">{t('toasts.samples.customTitle')}</p>
              <p className="text-sm text-muted-foreground">{t('toasts.samples.customBody')}</p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => {
                  notify.dismiss(id);
                  notify.success(t('toasts.samples.accepted'));
                }}
              >
                {t('toasts.samples.approve')}
              </Button>
              <Button size="sm" variant="outline" onClick={() => notify.dismiss(id)}>
                {t('toasts.samples.deny')}
              </Button>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close"
            className="h-fit rounded p-0.5 text-muted-foreground hover:text-foreground"
            onClick={() => notify.dismiss(id)}
          >
            <X className="size-4" />
          </button>
        </div>
      ),
      { duration: 10_000 },
    );

  return (
    <ElementsPage page="feedback">
      <ShowcaseGrid>
        <Demo id="toastTypes" contentClassName="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => notify.message(t('toasts.samples.message'))}>
            <MessageSquare /> {t('toasts.message')}
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              notify.success(t('toasts.samples.success'), {
                description: t('toasts.samples.successDesc'),
              })
            }
          >
            <CheckCircle2 className="text-success" /> {t('toasts.success')}
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              notify.error(t('toasts.samples.error'), {
                description: t('toasts.samples.errorDesc'),
              })
            }
          >
            <CircleAlert className="text-destructive" /> {t('toasts.error')}
          </Button>
          <Button variant="outline" onClick={() => notify.info(t('toasts.samples.info'))}>
            <Info className="text-info" /> {t('toasts.info')}
          </Button>
          <Button variant="outline" onClick={() => notify.warning(t('toasts.samples.warning'))}>
            <TriangleAlert className="text-warning" /> {t('toasts.warning')}
          </Button>
        </Demo>

        <Demo id="toastAdvanced" contentClassName="flex flex-wrap gap-2">
          <Button variant="outline" onClick={showLoading}>
            <Loader /> {t('toasts.loading')}
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              notify.promise(wait(1600), {
                loading: t('toasts.samples.promiseLoading'),
                success: t('toasts.samples.promiseSuccess'),
                error: t('toasts.samples.promiseError'),
              })
            }
          >
            {t('toasts.promise')}
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              notify.promise(wait(1600, true), {
                loading: t('toasts.samples.promiseLoading'),
                success: t('toasts.samples.promiseSuccess'),
                error: t('toasts.samples.promiseError'),
              })
            }
          >
            {t('toasts.promiseFail')}
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              notify.undoable(
                t('toasts.samples.deleted'),
                () => notify.success(t('toasts.samples.restored')),
                { undoLabel: t('toasts.undo') },
              )
            }
          >
            {t('toasts.undo')}
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              notify.message(t('toasts.samples.invite'), {
                action: {
                  label: t('toasts.samples.accept'),
                  onClick: () => notify.success(t('toasts.samples.accepted')),
                },
                cancel: { label: t('toasts.samples.decline') },
              })
            }
          >
            {t('toasts.action')}
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              notify.warning(t('toasts.samples.important'), {
                important: true,
                action: { label: t('toasts.samples.stay'), onClick: () => undefined },
              })
            }
          >
            {t('toasts.important')}
          </Button>
          <Button variant="outline" onClick={showCustom}>
            <Sparkles /> {t('toasts.custom')}
          </Button>
          <Button variant="ghost" onClick={() => notify.dismiss()}>
            {t('demo.dismissAll')}
          </Button>
        </Demo>

        <Demo id="toastPositions" className="lg:col-span-2">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {POSITIONS.map((position) => (
              <Button
                key={position}
                variant="outline"
                className="font-mono text-xs"
                onClick={() =>
                  notify.message(t('toasts.samples.position', { position }), { position })
                }
              >
                {position}
              </Button>
            ))}
          </div>
        </Demo>

        <Demo
          id="callouts"
          contentClassName="space-y-3"
          action={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCalloutsOpen({ tip: true, warn: true })}
            >
              {t('demo.restoreCallouts')}
            </Button>
          }
        >
          {calloutsOpen.tip && (
            <Callout
              kind="info"
              title="Tip: pin your most-used dashboard"
              onDismiss={() => setCalloutsOpen((v) => ({ ...v, tip: false }))}
            >
              Pinned dashboards open first after you sign in.
            </Callout>
          )}
          <Callout kind="success" title="Data source connected">
            Stripe will sync every 15 minutes.
          </Callout>
          {calloutsOpen.warn && (
            <Callout
              kind="warning"
              title="Approaching your plan limit"
              onDismiss={() => setCalloutsOpen((v) => ({ ...v, warn: false }))}
              actions={<Button size="sm">Upgrade plan</Button>}
            >
              You have used 9 of 10 dashboards on the Starter plan.
            </Callout>
          )}
          <Callout kind="danger" appearance="accent" title="Webhook delivery failing">
            The last 12 deliveries to api.acme.dev returned 503.
          </Callout>
        </Demo>

        <Demo
          id="banners"
          contentClassName="space-y-3"
          action={
            <Button variant="ghost" size="sm" onClick={() => setBannerKey((k) => k + 1)}>
              {t('demo.restoreBanners')}
            </Button>
          }
        >
          <div key={bannerKey} className="space-y-3 overflow-hidden rounded-lg">
            <Banner
              icon={Rocket}
              className="rounded-lg"
              action={
                <a href="#banners" className="font-medium underline underline-offset-4">
                  See what’s new
                </a>
              }
            >
              Scheduled reports are here.
            </Banner>
            <Banner icon={Bell} tone="muted" className="rounded-lg">
              Maintenance on Sunday 02:00–03:00 UTC. Exports will be paused.
            </Banner>
            <Banner icon={TriangleAlert} tone="warning" className="rounded-lg" dismissible={false}>
              Your trial ends in 3 days.
            </Banner>
          </div>
        </Demo>

        <Demo id="progress" contentClassName="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Uploading 18 files</span>
              <span className="text-muted-foreground tabular-nums">62%</span>
            </div>
            <Progress value={62} />
          </div>
          <MeterList
            size="sm"
            items={[
              { key: 'cpu', label: 'CPU', value: 38, max: 100, display: '38%' },
              { key: 'mem', label: 'Memory', value: 71, max: 100, display: '71%' },
            ]}
          />
          <ProgressSteps steps={5} value={3} label="Onboarding" />
          <div className="flex items-center gap-4">
            <ProgressRing value={33} size={48} strokeWidth={5} />
            <ProgressRing value={72} color="var(--chart-2)" />
            <ProgressRing value={100} color="var(--success)" size={64} />
          </div>
          <Stepper
            current={1}
            steps={[
              { key: 'a', title: 'Account' },
              { key: 'b', title: 'Workspace' },
              { key: 'c', title: 'Invite' },
            ]}
          />
        </Demo>

        <Demo id="loading" contentClassName="space-y-5">
          <div className="flex items-center gap-4">
            <Spinner className="size-4" />
            <Spinner className="size-6 text-primary" />
            <Button disabled>
              <Spinner /> Saving…
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <CardSkeleton />
            <ListSkeleton rows={3} />
          </div>
          <TableSkeleton rows={3} />
          <ChartSkeleton className="h-28" />
        </Demo>

        <Demo id="empty" contentClassName="grid gap-4 sm:grid-cols-2">
          <EmptyState
            icon={Inbox}
            title="No projects yet"
            description="Create a project to start tracking work, or import from another tool."
            actions={
              <>
                <Button size="sm">{t('demo.createProject')}</Button>
                <Button size="sm" variant="outline">
                  <Upload /> {t('demo.importData')}
                </Button>
              </>
            }
          />
          <div className="space-y-4">
            <EmptyState
              variant="plain"
              icon={SearchX}
              title="No results for “refund”"
              description="Try a different keyword or remove filters."
              actions={
                <Button size="sm" variant="ghost">
                  {t('demo.clearFilters')}
                </Button>
              }
            />
            <EmptyState
              variant="inline"
              icon={Bell}
              title="You’re all caught up"
              description="New notifications will show up here."
            />
          </div>
        </Demo>

        <Demo id="error">
          <ErrorState
            code="ERR_TIMEOUT · req_7f3a91"
            retryLabel={retrying ? '…' : t('demo.retry')}
            onRetry={() => {
              setRetrying(true);
              window.setTimeout(() => setRetrying(false), 1200);
            }}
          />
        </Demo>
      </ShowcaseGrid>
    </ElementsPage>
  );
}
