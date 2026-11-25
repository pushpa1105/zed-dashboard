import { ExternalLink } from 'lucide-react';

import { useTranslation } from '@/core/i18n/use-translation';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { TrendBadge } from '@/shared/components/dashboard/trend-badge';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';

import { compact } from '../lib/format';
import type { MarketingOverview } from '../model/marketing';

/** Thumbnail stand-in: a tinted tile with the post's initials, colored by post type. */
const KIND_COLOR: Record<string, string> = {
  Company: 'var(--chart-1)',
  Blog: 'var(--chart-3)',
  Product: 'var(--chart-2)',
  Persona: 'var(--chart-5)',
};

const initials = (title: string) =>
  title
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');

export function PostsCard({ posts }: { posts?: MarketingOverview['posts'] }) {
  const { t } = useTranslation('analytics', { keyPrefix: 'campaigns' });

  return (
    <SectionCard
      title={t('posts.title')}
      description={t('posts.description')}
      className="lg:col-span-6"
      flush
      footer={
        <Button variant="link" size="sm" className="h-auto px-0">
          {t('posts.viewAll')}
        </Button>
      }
    >
      {posts ? (
        <ul className="divide-y">
          {posts.map((post) => {
            const color = KIND_COLOR[post.kind] ?? 'var(--chart-4)';
            return (
              <li key={post.id} className="flex items-center gap-3 px-5 py-3">
                <span
                  className="flex size-10 shrink-0 items-center justify-center rounded-lg text-xs font-semibold"
                  style={{ background: `color-mix(in srgb, ${color} 16%, transparent)`, color }}
                >
                  {initials(post.title)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                    <span className="truncate">{post.title}</span>
                    <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
                  </p>
                  <Badge variant="outline" className="mt-1 h-5 px-1.5 text-[0.7rem] font-normal">
                    {post.kind}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium tabular-nums">{compact(post.reach)}</p>
                  <p className="text-xs text-muted-foreground">{t('posts.reach')}</p>
                </div>
                <TrendBadge delta={post.delta} className="w-14 justify-center" />
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="space-y-3 px-5 pb-5">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      )}
    </SectionCard>
  );
}
