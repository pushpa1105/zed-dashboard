import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowDownRight, ArrowUpRight, Mail, MapPin } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { LanguageSwitcher } from '@/core/i18n/components/language-switcher';
import { useTranslation } from '@/core/i18n/use-translation';
import { Head } from '@/core/layout/head';
import { notify } from '@/core/notify/notify';
import { ModeToggle } from '@/core/theme/components/mode-toggle';
import { SegmentedControl } from '@/shared/components/forms/segmented-control';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';

import { TemplateSwitcher } from '../components/template-switcher';

const WORK = [
  { key: 'ledger', span: 'md:col-span-7', tone: 'from-chart-1/80 to-chart-4/70', shape: 'rings' },
  { key: 'harbor', span: 'md:col-span-5', tone: 'from-chart-2/80 to-chart-2/40', shape: 'bars' },
  { key: 'mosaic', span: 'md:col-span-5', tone: 'from-chart-3/80 to-chart-5/60', shape: 'grid' },
  {
    key: 'tandem',
    span: 'md:col-span-7',
    tone: 'from-foreground/85 to-foreground/60',
    shape: 'lines',
  },
] as const;

const SERVICES = ['product', 'design', 'engineering', 'growth'] as const;
const PROCESS = ['discover', 'shape', 'build', 'launch'] as const;
const BUDGETS = ['small', 'medium', 'large'] as const;

/** Abstract cover art per case study: CSS only, so it themes with the palette. */
function Cover({ shape }: { shape: (typeof WORK)[number]['shape'] }) {
  if (shape === 'rings') {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        {[72, 52, 32].map((size) => (
          <span
            key={size}
            className="absolute rounded-full border-2 border-overlay-foreground/40"
            style={{ width: `${size}%`, aspectRatio: '1' }}
          />
        ))}
      </div>
    );
  }
  if (shape === 'bars') {
    return (
      <div className="absolute inset-x-8 bottom-0 flex h-3/4 items-end gap-3">
        {[40, 65, 50, 85, 70, 95].map((h, i) => (
          <span
            key={i}
            className="flex-1 rounded-t-md bg-overlay-foreground/45"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    );
  }
  if (shape === 'grid') {
    return (
      <div className="absolute inset-8 grid grid-cols-4 gap-2">
        {Array.from({ length: 12 }, (_, i) => (
          <span
            key={i}
            className={cn(
              'rounded-md',
              i % 3 === 0 ? 'bg-overlay-foreground/55' : 'bg-overlay-foreground/20',
            )}
          />
        ))}
      </div>
    );
  }
  return (
    <div className="absolute inset-0 flex flex-col justify-center gap-3 px-10">
      {[90, 70, 82, 55].map((w, i) => (
        <span
          key={i}
          className="h-2.5 rounded-full bg-overlay-foreground/40"
          style={{ width: `${w}%` }}
        />
      ))}
    </div>
  );
}

const contactSchema = z.object({
  name: z.string().min(2),
  email: z.email(),
  budget: z.enum(BUDGETS),
  message: z.string().min(10),
});
type ContactValues = z.infer<typeof contactSchema>;

function ContactForm() {
  const { t } = useTranslation('landing');
  const form = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: '', email: '', budget: 'medium', message: '' },
  });
  const errors = form.formState.errors;

  return (
    <form
      noValidate
      className="grid gap-5"
      onSubmit={form.handleSubmit(async () => {
        await new Promise((resolve) => setTimeout(resolve, 600));
        notify.success(t('agency.contact.sent'), { description: t('agency.contact.sentHint') });
        form.reset();
      })}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="agency-name">{t('agency.contact.name')}</Label>
          <Input id="agency-name" aria-invalid={!!errors.name} {...form.register('name')} />
          {errors.name && (
            <p className="text-xs text-destructive">{t('agency.contact.nameError')}</p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="agency-email">{t('common.email')}</Label>
          <Input
            id="agency-email"
            type="email"
            placeholder={t('common.emailPlaceholder')}
            aria-invalid={!!errors.email}
            {...form.register('email')}
          />
          {errors.email && <p className="text-xs text-destructive">{t('common.invalidEmail')}</p>}
        </div>
      </div>
      <div className="grid gap-2">
        <Label>{t('agency.contact.budget')}</Label>
        <Controller
          control={form.control}
          name="budget"
          render={({ field }) => (
            <SegmentedControl
              block
              value={field.value}
              onChange={field.onChange}
              options={BUDGETS.map((b) => ({ value: b, label: t(`agency.contact.budgets.${b}`) }))}
            />
          )}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="agency-message">{t('agency.contact.message')}</Label>
        <Textarea
          id="agency-message"
          rows={4}
          placeholder={t('agency.contact.messagePlaceholder')}
          aria-invalid={!!errors.message}
          {...form.register('message')}
        />
        {errors.message && (
          <p className="text-xs text-destructive">{t('agency.contact.messageError')}</p>
        )}
      </div>
      <Button
        type="submit"
        size="lg"
        disabled={form.formState.isSubmitting}
        className="justify-self-start"
      >
        {t('agency.contact.submit')} <ArrowUpRight />
      </Button>
    </form>
  );
}

/** Template 4: design & engineering studio — portfolio-first, editorial type. */
export default function AgencyLandingPage() {
  const { t } = useTranslation('landing');

  return (
    <div className="min-h-svh bg-background">
      <Head title={t('agency.meta')} />

      <header className="mx-auto flex h-20 max-w-7xl items-center gap-8 px-5 md:px-8">
        <a href="#top" className="text-lg font-semibold tracking-tight">
          {t('agency.brand')}
          <span className="text-primary">.</span>
        </a>
        <nav className="hidden gap-7 text-sm text-muted-foreground md:flex">
          {(['work', 'services', 'process', 'contact'] as const).map((anchor) => (
            <a key={anchor} href={`#${anchor}`} className="hover:text-foreground">
              {t(`agency.nav.${anchor}`)}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <LanguageSwitcher />
          <ModeToggle />
          <Button asChild className="ml-2 rounded-full">
            <a href="#contact">{t('agency.nav.cta')}</a>
          </Button>
        </div>
      </header>

      <main id="top">
        <section className="mx-auto max-w-7xl px-5 pt-12 pb-20 md:px-8 md:pt-20 md:pb-28">
          <p className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-muted-foreground">
            <span className="size-1.5 rounded-full bg-success" />
            {t('agency.hero.availability')}
          </p>
          <h1 className="mt-8 max-w-5xl text-5xl leading-[0.98] font-semibold tracking-[-0.035em] text-balance md:text-7xl lg:text-[5.5rem]">
            {t('agency.hero.title')}
          </h1>
          <div className="mt-12 grid gap-10 border-t pt-8 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <p className="max-w-md text-lg text-pretty text-muted-foreground">
              {t('agency.hero.subtitle')}
            </p>
            {(['years', 'products', 'retention'] as const).map((stat) => (
              <div key={stat}>
                <p className="text-4xl font-semibold tracking-tight tabular-nums">
                  {t(`agency.hero.stats.${stat}.value`)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t(`agency.hero.stats.${stat}.label`)}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section id="work" className="scroll-mt-8 bg-muted/40 py-20 md:py-28">
          <div className="mx-auto max-w-7xl px-5 md:px-8">
            <div className="flex items-end justify-between gap-6">
              <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">
                {t('agency.work.title')}
              </h2>
              <p className="hidden text-sm text-muted-foreground md:block">
                {t('agency.work.note')}
              </p>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-12">
              {WORK.map((item) => (
                <article key={item.key} className={cn('group', item.span)}>
                  <div
                    className={cn(
                      'relative h-64 overflow-hidden rounded-2xl bg-gradient-to-br transition-transform duration-500 group-hover:scale-[0.985] md:h-80',
                      item.tone,
                    )}
                  >
                    <Cover shape={item.shape} />
                    <span className="absolute top-4 left-4 rounded-full bg-overlay/25 px-3 py-1 text-xs text-overlay-foreground backdrop-blur">
                      {t(`agency.work.items.${item.key}.category`)}
                    </span>
                  </div>
                  <div className="mt-4 flex items-start justify-between gap-6">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {t(`agency.work.items.${item.key}.client`)}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {t(`agency.work.items.${item.key}.summary`)}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xl font-semibold tabular-nums">
                        {t(`agency.work.items.${item.key}.metric`)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t(`agency.work.items.${item.key}.metricLabel`)}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="services"
          className="mx-auto max-w-7xl scroll-mt-8 px-5 py-20 md:px-8 md:py-28"
        >
          <div className="grid gap-12 md:grid-cols-[1fr_2fr]">
            <div className="space-y-4">
              <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">
                {t('agency.services.title')}
              </h2>
              <p className="text-muted-foreground">{t('agency.services.subtitle')}</p>
            </div>
            <ol className="divide-y border-y">
              {SERVICES.map((service, i) => (
                <li key={service} className="grid gap-4 py-7 sm:grid-cols-[4rem_1fr_auto]">
                  <span className="font-mono text-sm text-muted-foreground">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">
                      {t(`agency.services.items.${service}.title`)}
                    </h3>
                    <p className="max-w-lg text-sm text-muted-foreground">
                      {t(`agency.services.items.${service}.body`)}
                    </p>
                    <p className="pt-1 text-xs text-muted-foreground">
                      {t(`agency.services.items.${service}.deliverables`)}
                    </p>
                  </div>
                  <ArrowDownRight className="hidden size-6 text-muted-foreground sm:block" />
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="process" className="scroll-mt-8 bg-foreground py-20 text-background md:py-28">
          <div className="mx-auto max-w-7xl px-5 md:px-8">
            <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-balance md:text-5xl">
              {t('agency.process.title')}
            </h2>
            <ol className="mt-14 grid gap-10 md:grid-cols-4">
              {PROCESS.map((step, i) => (
                <li key={step} className="relative border-t border-background/20 pt-6">
                  <span className="absolute -top-[5px] left-0 size-2.5 rounded-full bg-primary" />
                  <p className="text-xs tracking-wider text-background/60 uppercase">
                    {t(`agency.process.items.${step}.weeks`)}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold">
                    {i + 1}. {t(`agency.process.items.${step}.title`)}
                  </h3>
                  <p className="mt-2 text-sm text-background/70">
                    {t(`agency.process.items.${step}.body`)}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-5 py-20 md:px-8 md:py-28">
          <blockquote className="text-2xl leading-snug font-medium tracking-tight text-balance md:text-4xl">
            “{t('agency.quote.text')}”
          </blockquote>
          <p className="mt-6 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{t('agency.quote.author')}</span> ·{' '}
            {t('agency.quote.role')}
          </p>
        </section>

        <section id="contact" className="scroll-mt-8 border-t">
          <div className="mx-auto grid max-w-7xl gap-14 px-5 py-20 md:grid-cols-[1fr_1.3fr] md:px-8 md:py-28">
            <div className="space-y-6">
              <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">
                {t('agency.contact.title')}
              </h2>
              <p className="text-muted-foreground">{t('agency.contact.subtitle')}</p>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-3">
                  <Mail className="size-4 text-muted-foreground" /> hello@kiln.studio
                </li>
                <li className="flex items-center gap-3">
                  <MapPin className="size-4 text-muted-foreground" /> {t('agency.contact.address')}
                </li>
              </ul>
            </div>
            <ContactForm />
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-8 text-sm text-muted-foreground md:px-8">
          <p>
            © {new Date().getFullYear()} {t('agency.brand')}. {t('common.rights')}
          </p>
          <p>{t('agency.footer')}</p>
        </div>
      </footer>
      <TemplateSwitcher />
    </div>
  );
}
