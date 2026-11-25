import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

import type { PageTemplateKey } from '../routes';

const bar = (w: string, extra = '') => (
  <span
    className={cn('block h-1.5 rounded-full bg-muted-foreground/25', extra)}
    style={{ width: w }}
  />
);
const field = (extra = '') => (
  <span className={cn('block h-3 rounded-[3px] border bg-background', extra)} />
);
const btn = (extra = '') => <span className={cn('block h-3 rounded-[3px] bg-primary', extra)} />;

function Form({ className }: { className?: string }) {
  return (
    <span className={cn('flex w-full flex-col gap-1.5', className)}>
      {bar('55%', 'h-2 bg-foreground/60')}
      {bar('80%')}
      <span className="mt-1 grid gap-1">
        {field()}
        {field()}
      </span>
      {btn('mt-1')}
    </span>
  );
}

function Frame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn('relative flex size-full overflow-hidden', className)}>{children}</span>
  );
}

/** Miniature drawing of a page template (no screenshots needed). */
export function PageThumb({ kind }: { kind: PageTemplateKey }) {
  const body = (() => {
    switch (kind) {
      case 'authSplit':
        return (
          <Frame>
            <span className="flex w-1/2 flex-col justify-end gap-1 bg-primary p-3">
              <span className="h-1.5 w-3/4 rounded-full bg-primary-foreground/60" />
              <span className="h-1.5 w-1/2 rounded-full bg-primary-foreground/40" />
            </span>
            <span className="flex flex-1 items-center px-4">
              <Form />
            </span>
          </Frame>
        );
      case 'authIllustrated':
        return (
          <Frame className="items-center justify-center bg-primary/10">
            <span className="flex w-1/2 flex-col gap-2 rounded-md border bg-card p-2.5">
              <span className="h-5 rounded bg-primary/15" />
              <Form />
            </span>
          </Frame>
        );
      case 'authMinimal':
        return (
          <Frame className="items-center justify-center">
            <span className="w-2/5">
              <Form />
            </span>
          </Frame>
        );
      case 'authOtp':
        return (
          <Frame className="items-center justify-center bg-muted/60">
            <span className="flex w-1/2 flex-col items-center gap-2 rounded-md border bg-card p-3">
              <span className="size-4 rounded-full bg-primary/20" />
              <span className="flex gap-1">
                {Array.from({ length: 6 }, (_, i) => (
                  <span key={i} className="size-3 rounded-[3px] border bg-background" />
                ))}
              </span>
              {btn('w-full')}
            </span>
          </Frame>
        );
      case 'authForgot':
        return (
          <Frame className="flex-col">
            <span className="flex h-4 items-center justify-between px-2">
              {bar('20%')}
              {bar('15%')}
            </span>
            <span className="flex flex-1 items-center justify-center">
              <span className="w-2/5">
                <span className="mb-2 block size-4 rounded border bg-card" />
                <Form />
              </span>
            </span>
          </Frame>
        );
      case 'authLock':
        return (
          <Frame className="flex-col items-center justify-center gap-2 bg-foreground">
            <span className="h-3 w-12 rounded-full bg-background/70" />
            <span className="mt-2 size-6 rounded-full bg-primary" />
            <span className="h-3 w-24 rounded-[3px] bg-background/15" />
          </Frame>
        );
      case 'notFound':
      case 'notFoundAlt':
      case 'serverError':
        return (
          <Frame
            className={cn(
              'items-center gap-4 px-6',
              kind === 'serverError' && 'justify-center bg-muted/60',
            )}
          >
            <span
              className={cn(
                'flex flex-col gap-1.5',
                kind === 'serverError' ? 'w-1/2 rounded-md border bg-card p-3' : 'w-1/2',
              )}
            >
              <span
                className={cn(
                  'font-mono text-[0.7rem] font-semibold',
                  kind === 'serverError' ? 'text-destructive' : 'text-primary',
                )}
              >
                {kind === 'serverError' ? '500' : '404'}
              </span>
              {bar('90%', 'h-2 bg-foreground/60')}
              {bar('70%')}
              {btn('mt-1 w-1/2')}
            </span>
            {kind === 'notFoundAlt' && (
              <span className="grid flex-1 grid-cols-3 gap-1">
                {Array.from({ length: 9 }, (_, i) => (
                  <span
                    key={i}
                    className={cn(
                      'aspect-square rounded-[3px]',
                      i === 4 ? 'border border-dashed border-primary' : 'bg-muted',
                    )}
                  />
                ))}
              </span>
            )}
          </Frame>
        );
      case 'maintenance':
        return (
          <Frame className="items-center gap-3 px-4">
            <span className="flex w-1/2 flex-col gap-1.5">
              <span className="h-2 w-10 rounded-full bg-warning/50" />
              {bar('90%', 'h-2 bg-foreground/60')}
              {bar('70%')}
            </span>
            <span className="flex flex-1 flex-col gap-1.5 rounded-md border bg-card p-2">
              <span className="h-1.5 rounded-full bg-primary" style={{ width: '62%' }} />
              {bar('80%')}
              {bar('60%')}
              {bar('70%')}
            </span>
          </Frame>
        );
      case 'comingSoon':
        return (
          <Frame className="flex-col items-center justify-center gap-2 bg-gradient-to-b from-primary/15 to-transparent">
            {bar('50%', 'h-2 bg-foreground/60')}
            <span className="flex gap-1">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className="size-5 rounded border bg-card" />
              ))}
            </span>
            <span className="flex w-1/2 gap-1">
              {field('flex-1')}
              {btn('w-8')}
            </span>
          </Frame>
        );
      case 'pricing':
        return (
          <Frame className="items-end gap-1.5 px-3 pb-3">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={cn(
                  'flex h-4/5 flex-1 flex-col gap-1 rounded-md border bg-card p-1.5',
                  i === 2 && 'border-primary ring-1 ring-primary',
                )}
              >
                {bar('60%')}
                <span className="h-2 w-1/2 rounded-full bg-foreground/60" />
                {btn(cn('mt-auto', i !== 2 && 'bg-muted-foreground/30'))}
              </span>
            ))}
          </Frame>
        );
      case 'profile':
        return (
          <Frame className="flex-col">
            <span className="h-1/3 bg-gradient-to-r from-primary to-chart-4/70" />
            <span className="-mt-3 ml-3 size-6 rounded-full border-2 border-card bg-primary/40" />
            <span className="mt-2 grid flex-1 grid-cols-3 gap-1.5 px-3 pb-3">
              <span className="rounded-md border bg-card" />
              <span className="col-span-2 rounded-md border bg-card" />
            </span>
          </Frame>
        );
      case 'account':
        return (
          <Frame className="gap-2 p-3">
            <span className="flex w-1/4 flex-col gap-1.5">
              <span className="h-2.5 rounded bg-accent" />
              {bar('80%')}
              {bar('70%')}
              {bar('75%')}
            </span>
            <span className="flex flex-1 flex-col gap-1.5 rounded-md border bg-card p-2">
              {field()}
              {field()}
              {field('h-6')}
              {btn('ml-auto w-1/4')}
            </span>
          </Frame>
        );
      case 'help':
        return (
          <Frame className="flex-col">
            <span className="flex h-2/5 flex-col items-center justify-center gap-1.5 bg-primary/10">
              {bar('35%', 'h-2 bg-foreground/60')}
              {field('w-1/2')}
            </span>
            <span className="grid flex-1 grid-cols-3 gap-1.5 p-3">
              {Array.from({ length: 6 }, (_, i) => (
                <span key={i} className="rounded-md border bg-card" />
              ))}
            </span>
          </Frame>
        );
      case 'onboarding':
        return (
          <Frame className="gap-2 p-3">
            <span className="flex flex-[1.5] flex-col gap-1.5 rounded-md border bg-card p-2">
              {[1, 1, 0, 0, 0].map((d, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      'size-2.5 rounded-full border',
                      d && 'border-transparent bg-success',
                    )}
                  />
                  {bar(d ? '50%' : '70%')}
                </span>
              ))}
            </span>
            <span className="flex flex-1 flex-col gap-2">
              <span className="flex-1 rounded-md bg-gradient-to-br from-primary/20 to-chart-2/20" />
              <span className="h-1/3 rounded-md border bg-card" />
            </span>
          </Frame>
        );
    }
  })();

  return (
    <span className="block aspect-[16/10] overflow-hidden rounded-lg border bg-background">
      {body}
    </span>
  );
}
