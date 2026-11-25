import type { ReactNode } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';

import {
  ForgotPasswordCard,
  LockScreenCard,
  OtpCard,
  ResetPasswordCard,
  SignInCard,
  SignUpCard,
  TwoFactorSetupCard,
} from '../components/auth/auth-forms';
import { UiFormsTabs } from '../components/ui-forms-tabs';

/** A labelled stage that shows one auth form on a tinted backdrop. */
function Stage({ label, hint, children }: { label: string; hint: string; children: ReactNode }) {
  return (
    <figure className="flex flex-col overflow-hidden rounded-xl border bg-card">
      <div className="flex flex-1 items-center justify-center bg-muted/40 bg-[radial-gradient(circle_at_top,color-mix(in_srgb,var(--primary)_8%,transparent),transparent_70%)] px-4 py-10">
        {children}
      </div>
      <figcaption className="border-t px-5 py-3.5">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </figcaption>
    </figure>
  );
}

export default function AuthFormsPage() {
  const { t } = useTranslation('ui-forms');
  const stages = [
    ['signIn', <SignInCard key="a" />],
    ['signUp', <SignUpCard key="b" />],
    ['forgot', <ForgotPasswordCard key="c" />],
    ['reset', <ResetPasswordCard key="d" />],
    ['otp', <OtpCard key="e" />],
    ['twoFactor', <TwoFactorSetupCard key="f" />],
    ['lock', <LockScreenCard key="g" />],
  ] as const;

  return (
    <Page title={t('auth.title')} description={t('auth.description')} width="full">
      <UiFormsTabs />
      <div className="grid gap-6 lg:grid-cols-2 2xl:grid-cols-3">
        {stages.map(([key, node]) => (
          <Stage
            key={key}
            label={t(`auth.stages.${key}.label`)}
            hint={t(`auth.stages.${key}.hint`)}
          >
            {node}
          </Stage>
        ))}
      </div>
    </Page>
  );
}
