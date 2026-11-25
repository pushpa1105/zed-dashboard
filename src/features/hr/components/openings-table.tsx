import { useTranslation } from '@/core/i18n/use-translation';
import { getInitials } from '@/shared/lib/format';
import { Avatar, AvatarFallback, AvatarGroup } from '@/shared/ui/avatar';
import { Skeleton } from '@/shared/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

import { shortDate } from '../lib/format';
import type { HrOverview } from '../model/overview';

import { SectionTitle } from './interviews-list';

/** Stable tint per person so the same candidate keeps the same avatar color. */
const TINTS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];
const tintFor = (name: string) =>
  TINTS[[...name].reduce((sum, c) => sum + c.charCodeAt(0), 0) % TINTS.length]!;

export function OpeningsTable({ openings }: { openings?: HrOverview['openings'] }) {
  const { t } = useTranslation('hr');

  return (
    <section className="space-y-3">
      <SectionTitle>{t('openings.title')}</SectionTitle>
      <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
        {openings ? (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-11 pl-5">{t('openings.columns.name')}</TableHead>
                <TableHead className="hidden sm:table-cell">
                  {t('openings.columns.published')}
                </TableHead>
                <TableHead className="pr-5">{t('openings.columns.candidates')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {openings.map((opening) => {
                const extra = opening.total - opening.candidates.length;
                return (
                  <TableRow key={opening.id}>
                    <TableCell className="py-4 pl-5">
                      <p className="font-semibold">{opening.title}</p>
                      <p className="text-xs text-muted-foreground">{opening.department}</p>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground tabular-nums sm:table-cell">
                      {shortDate(opening.publishedAt)}
                    </TableCell>
                    <TableCell className="pr-5">
                      {opening.total === 0 ? (
                        <span className="text-xs text-muted-foreground">{t('openings.none')}</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <AvatarGroup className="-space-x-1 *:data-[slot=avatar]:ring-card">
                            {opening.candidates.map((name) => (
                              <Avatar key={name} className="size-7" title={name}>
                                <AvatarFallback
                                  className="text-[0.6rem] font-medium text-overlay-foreground"
                                  style={{ background: tintFor(name) }}
                                >
                                  {getInitials(...name.split(' '))}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                          </AvatarGroup>
                          {extra > 0 && (
                            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums">
                              +{extra}
                            </span>
                          )}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="space-y-2 p-5">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
