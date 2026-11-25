import { zodResolver } from '@hookform/resolvers/zod';
import { Link2 } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';

import { FormField } from '@/core/forms/form-field';
import { useTranslation } from '@/core/i18n/use-translation';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { CopyButton } from '@/shared/components/display/copy-button';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Spinner } from '@/shared/ui/spinner';

import { useCreateUtmLink } from '../api/analytics-api';
import { compact, shortDate } from '../lib/format';
import { UTM_MEDIUMS, utmInputSchema, type UtmInput, type UtmLink } from '../model/analytics';

/** Builds the tagged URL exactly like the server will, for the live preview. */
function preview(values: Partial<UtmInput>) {
  try {
    const url = new URL(values.url ?? '');
    const params: Record<string, string | undefined> = {
      utm_source: values.source,
      utm_medium: values.medium,
      utm_campaign: values.campaign,
      utm_term: values.term,
      utm_content: values.content,
    };
    for (const [key, value] of Object.entries(params)) if (value) url.searchParams.set(key, value);
    return url.toString();
  } catch {
    return null;
  }
}

/** Campaign URL builder with live preview and the most recent tagged links. */
export function UtmBuilder({ links }: { links: UtmLink[] }) {
  const { t } = useTranslation('analytics');
  const create = useCreateUtmLink();
  const form = useForm<UtmInput>({
    resolver: zodResolver(utmInputSchema),
    defaultValues: {
      url: 'https://orbitly.app/pricing',
      source: '',
      medium: 'email',
      campaign: '',
      term: '',
      content: '',
    },
  });
  const values = useWatch({ control: form.control });
  const built = preview(values);

  return (
    <SectionCard
      title={t('acquisition.utm.title')}
      description={t('acquisition.utm.description')}
      className="xl:col-span-2"
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <form
          noValidate
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={form.handleSubmit((input) =>
            create.mutate(input, {
              onSuccess: () => form.reset({ ...input, campaign: '', term: '', content: '' }),
            }),
          )}
        >
          <FormField
            control={form.control}
            name="url"
            label={t('acquisition.utm.url')}
            required
            className="sm:col-span-2"
            render={({ field, id, invalid }) => (
              <Input id={id} {...field} aria-invalid={invalid} inputMode="url" />
            )}
          />
          <FormField
            control={form.control}
            name="source"
            label={t('acquisition.utm.source')}
            description={t('acquisition.utm.sourceHint')}
            required
            render={({ field, id, invalid }) => (
              <Input id={id} {...field} aria-invalid={invalid} placeholder="newsletter" />
            )}
          />
          <FormField
            control={form.control}
            name="medium"
            label={t('acquisition.utm.medium')}
            required
            render={({ field, id }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id={id} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UTM_MEDIUMS.map((medium) => (
                    <SelectItem key={medium} value={medium}>
                      {medium}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FormField
            control={form.control}
            name="campaign"
            label={t('acquisition.utm.campaign')}
            description={t('acquisition.utm.campaignHint')}
            required
            render={({ field, id, invalid }) => (
              <Input id={id} {...field} aria-invalid={invalid} placeholder="black_friday_26" />
            )}
          />
          <FormField
            control={form.control}
            name="term"
            label={t('acquisition.utm.term')}
            render={({ field, id }) => <Input id={id} {...field} value={field.value ?? ''} />}
          />
          <div className="space-y-2 rounded-lg border border-dashed bg-muted/40 p-3 sm:col-span-2">
            <p className="text-xs font-medium text-muted-foreground">
              {t('acquisition.utm.preview')}
            </p>
            <div className="flex items-start gap-2">
              <code className="min-w-0 flex-1 text-xs leading-relaxed break-all">
                {built ?? t('acquisition.utm.invalid')}
              </code>
              {built && <CopyButton value={built} />}
            </div>
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? <Spinner /> : <Link2 />}
              {t('acquisition.utm.save')}
            </Button>
          </div>
        </form>
        <div className="space-y-3 lg:border-l lg:pl-8">
          <p className="text-sm font-medium">{t('acquisition.utm.recent')}</p>
          <ul className="space-y-3">
            {links.slice(0, 4).map((link) => (
              <li key={link.id} className="space-y-1 rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-mono text-xs font-medium">{link.campaign}</span>
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                    {t('acquisition.utm.clicks', { value: compact(link.clicks) })}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {link.source} / {link.medium} · {shortDate(link.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </SectionCard>
  );
}
