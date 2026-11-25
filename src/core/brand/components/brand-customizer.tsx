import { ImageUp, RotateCcw, X } from 'lucide-react';
import { useId } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { notify } from '@/core/notify/notify';
import { Section } from '@/core/theme/components/theme-customizer';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

import { BRAND, type Brand } from '../config';
import { useBrandStore } from '../store';

import { BrandLogo } from './brand-logo';

const MAX_BYTES = 500_000;
const IMAGE_FIELDS = ['logo', 'logoDark', 'mark'] as const;

function ImageField({ field }: { field: (typeof IMAGE_FIELDS)[number] }) {
  const { t } = useTranslation();
  const id = useId();
  const value = useBrandStore((s) => s.overrides[field]);
  const set = useBrandStore((s) => s.set);

  const upload = (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_BYTES) return notify.error(t('brand.tooLarge'));
    const reader = new FileReader();
    reader.onload = () => set({ [field]: reader.result as string } as Partial<Brand>);
    reader.readAsDataURL(file);
  };

  return (
    <Section label={t(`brand.${field}`)}>
      <div className="flex items-center gap-3 rounded-md border p-2">
        <span className="flex h-10 w-20 shrink-0 items-center justify-center rounded bg-muted">
          {value ? (
            <img src={value} alt="" className="max-h-8 max-w-16 object-contain" />
          ) : (
            <ImageUp className="size-4 text-muted-foreground" />
          )}
        </span>
        <Button asChild variant="outline" size="sm">
          <label htmlFor={id}>{t('brand.upload')}</label>
        </Button>
        <input
          id={id}
          type="file"
          accept="image/svg+xml,image/png,image/webp,image/jpeg"
          className="sr-only"
          onChange={(e) => upload(e.target.files?.[0])}
        />
        {value && (
          <Button
            variant="ghost"
            size="icon-sm"
            className="ml-auto"
            aria-label={t('brand.remove')}
            onClick={() => set({ [field]: null } as Partial<Brand>)}
          >
            <X />
          </Button>
        )}
      </div>
    </Section>
  );
}

/** Live brand editor: name, logos and icon, saved on this device. */
export function BrandCustomizer({ className }: { className?: string }) {
  const { t } = useTranslation();
  const name = useBrandStore((s) => s.overrides.name ?? '');
  const { set, reset } = useBrandStore.getState();

  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex h-16 items-center justify-center rounded-lg border bg-muted/40">
        <BrandLogo />
      </div>
      <Section label={t('brand.name')}>
        <Input
          value={name}
          placeholder={BRAND.name}
          aria-label={t('brand.name')}
          onChange={(e) => set({ name: e.target.value })}
        />
      </Section>
      {IMAGE_FIELDS.map((field) => (
        <ImageField key={field} field={field} />
      ))}
      <p className="text-xs text-muted-foreground">{t('brand.hint')}</p>
      <Button variant="outline" className="w-full" onClick={reset}>
        <RotateCcw /> {t('brand.reset')}
      </Button>
    </div>
  );
}
