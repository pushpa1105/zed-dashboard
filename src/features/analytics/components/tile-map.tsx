import { useTranslation } from '@/core/i18n/use-translation';
import { cn } from '@/shared/lib/cn';

import { useCountryName } from '../hooks/use-country-name';
import { integer } from '../lib/format';
import type { CountryRow, Region } from '../model/insights';

/** One tile per country, laid out roughly where it sits on a world map (column, row). */
const TILES: Record<string, [col: number, row: number]> = {
  CA: [1, 1],
  US: [1, 2],
  MX: [1, 3],
  CO: [2, 4],
  BR: [3, 5],
  AR: [3, 6],
  IE: [5, 1],
  GB: [6, 1],
  SE: [8, 1],
  RU: [11, 1],
  NL: [7, 2],
  DE: [8, 2],
  PL: [9, 2],
  ES: [6, 3],
  FR: [7, 3],
  IT: [8, 3],
  TR: [10, 3],
  CN: [12, 3],
  KR: [13, 3],
  JP: [14, 3],
  EG: [9, 4],
  IN: [11, 4],
  NG: [7, 5],
  SG: [12, 5],
  ID: [13, 5],
  ZA: [8, 6],
  AU: [13, 6],
  NZ: [14, 7],
};

const fill = (intensity: number) =>
  `color-mix(in oklab, var(--primary) ${intensity}%, var(--muted))`;

/**
 * Tile-grid world map. Tile color is the session volume (square-root scaled so
 * smaller markets stay visible), mixed from the brand color so it follows the theme.
 */
export function TileMap({
  countries,
  region,
  selected,
  onSelect,
}: {
  countries: CountryRow[];
  region: Region | 'all';
  selected: string | null;
  onSelect: (code: string) => void;
}) {
  const { t } = useTranslation('analytics');
  const countryName = useCountryName();
  const byCode = new Map(countries.map((c) => [c.code, c]));
  const max = Math.sqrt(Math.max(...countries.map((c) => c.sessions)));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[repeat(14,minmax(0,1fr))] gap-1 sm:gap-1.5">
        {Object.entries(TILES).map(([code, [col, row]]) => {
          const data = byCode.get(code);
          const intensity = data ? Math.round(15 + (Math.sqrt(data.sessions) / max) * 85) : 0;
          const name = countryName(code);
          const style = { gridColumn: col, gridRow: row, background: fill(intensity) };
          const tile =
            'flex aspect-square items-center justify-center rounded-md text-[0.55rem] font-semibold sm:text-xs';
          return data ? (
            <button
              key={code}
              type="button"
              style={style}
              title={`${name} · ${integer(data.sessions)}`}
              aria-label={t('geography.map.tile', { country: name })}
              onClick={() => onSelect(code)}
              className={cn(
                tile,
                'transition-opacity outline-none hover:ring-2 hover:ring-ring focus-visible:ring-2 focus-visible:ring-ring',
                intensity >= 55 ? 'text-primary-foreground' : 'text-foreground',
                region !== 'all' && data.region !== region && 'opacity-30',
                selected === code && 'ring-2 ring-ring ring-offset-2 ring-offset-card',
              )}
            >
              {code}
            </button>
          ) : (
            <span
              key={code}
              style={style}
              title={name}
              className={cn(tile, 'text-muted-foreground/60')}
            >
              {code}
            </span>
          );
        })}
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>{t('geography.map.fewer')}</span>
        <span
          className="h-2 w-32 rounded-full"
          style={{ background: `linear-gradient(to right, ${fill(15)}, ${fill(100)})` }}
        />
        <span>{t('geography.map.more')}</span>
        <span className="ml-auto flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-muted" />
          {t('geography.map.noData')}
        </span>
      </div>
    </div>
  );
}
