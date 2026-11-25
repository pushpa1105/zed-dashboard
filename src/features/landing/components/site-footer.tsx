import { BrandLogo } from '@/core/brand/components/brand-logo';
import { useTranslation } from '@/core/i18n/use-translation';

const COLUMNS = {
  product: ['dashboards', 'alerts', 'embed', 'pricing'],
  company: ['about', 'careers', 'blog', 'contact'],
  resources: ['docs', 'changelog', 'status', 'templates'],
  legal: ['privacy', 'terms', 'security', 'dpa'],
} as const;

/** Multi-column marketing footer. Links are placeholders (`#`): point them at your pages. */
export function SiteFooter() {
  const { t } = useTranslation('landing');

  return (
    <footer className="border-t">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[1.4fr_repeat(4,1fr)]">
        <div className="space-y-3">
          <BrandLogo />
          <p className="max-w-60 text-sm text-muted-foreground">{t('saas.footer.tagline')}</p>
        </div>
        {(Object.keys(COLUMNS) as Array<keyof typeof COLUMNS>).map((column) => (
          <div key={column} className="space-y-3">
            <p className="text-sm font-medium">{t(`saas.footer.${column}`)}</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {COLUMNS[column].map((link) => (
                <li key={link}>
                  <a href="#" className="transition-colors hover:text-foreground">
                    {t(`saas.footer.links.${link}`)}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t">
        <p className="mx-auto max-w-6xl px-5 py-5 text-xs text-muted-foreground">
          © {new Date().getFullYear()} {t('brand')}. {t('common.rights')}
        </p>
      </div>
    </footer>
  );
}
