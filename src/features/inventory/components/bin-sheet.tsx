import { ArrowRightLeft, PackageOpen } from 'lucide-react';
import { useState } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { Link } from '@/core/router/router';
import { StatStrip } from '@/shared/components/dashboard/stat-strip';
import { EmptyState } from '@/shared/components/display/empty-state';
import { NumberInput } from '@/shared/components/forms/number-input';
import { Button } from '@/shared/ui/button';
import { Label } from '@/shared/ui/label';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/sheet';
import { Skeleton } from '@/shared/ui/skeleton';

import { useBin, useMoveStock } from '../api/stock-api';
import { qty, usd } from '../lib/format';
import type { BinContent } from '../model/stock';
import { inventoryRoutes } from '../routes';

import { ErrorPanel } from './error-panel';
import { OptionSelect } from './option-select';

type MoveProps = { warehouse: string; from: string; targets: string[]; content: BinContent };

function MoveStockForm({
  warehouse,
  from,
  targets,
  content,
  onDone,
}: MoveProps & { onDone: () => void }) {
  const { t } = useTranslation('inventory', { keyPrefix: 'bins.move' });
  const move = useMoveStock();
  const available = content.onHand - content.reserved;
  const [to, setTo] = useState(targets[0] ?? '');
  const [quantity, setQuantity] = useState<number | null>(available);
  const id = `move-${content.sku}`;

  return (
    <div className="mt-3 grid gap-3 rounded-lg bg-muted/40 p-3 sm:grid-cols-[1fr_8rem_auto] sm:items-end">
      <div className="grid gap-1.5">
        <Label htmlFor={`${id}-to`}>{t('to')}</Label>
        <OptionSelect
          id={`${id}-to`}
          value={to}
          onChange={setTo}
          options={targets.map((code) => ({ value: code, label: code }))}
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor={`${id}-qty`}>{t('quantity')}</Label>
        <NumberInput
          id={`${id}-qty`}
          value={quantity}
          onChange={setQuantity}
          min={1}
          max={available}
        />
      </div>
      <Button
        disabled={!to || !quantity || move.isPending}
        onClick={() =>
          move.mutate(
            { warehouse, from, to, sku: content.sku, quantity: quantity ?? 0 },
            { onSuccess: onDone },
          )
        }
      >
        {t('submit')}
      </Button>
    </div>
  );
}

function ContentRow(props: MoveProps) {
  const { t } = useTranslation('inventory', { keyPrefix: 'bins.sheet' });
  const [moving, setMoving] = useState(false);
  const { content } = props;
  const movable = content.onHand > content.reserved && props.targets.length > 0;

  return (
    <li className="py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            to={inventoryRoutes.item.href({ sku: content.sku })}
            className="block truncate font-medium hover:underline"
          >
            {content.name}
          </Link>
          <p className="font-mono text-xs text-muted-foreground">{content.sku}</p>
          <p className="mt-1 text-xs text-muted-foreground tabular-nums">
            {t('stock', { onHand: qty(content.onHand), reserved: qty(content.reserved) })}
          </p>
        </div>
        <Button
          size="sm"
          variant={moving ? 'secondary' : 'outline'}
          disabled={!movable}
          aria-expanded={moving}
          onClick={() => setMoving(!moving)}
        >
          <ArrowRightLeft /> {t('move')}
        </Button>
      </div>
      {moving && <MoveStockForm {...props} onDone={() => setMoving(false)} />}
    </li>
  );
}

/** Contents of one bin, with a form per SKU to move unreserved stock to a bin with room. */
export function BinSheet({
  warehouse,
  code,
  targets,
  onClose,
}: {
  warehouse: string;
  code: string | null;
  targets: string[];
  onClose: () => void;
}) {
  const { t } = useTranslation('inventory', { keyPrefix: 'bins.sheet' });
  const bin = useBin(warehouse, code);
  const data = bin.data;
  const contents = data?.contents ?? [];

  return (
    <Sheet open={!!code} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{t('title', { code })}</SheetTitle>
          <SheetDescription>{t('description', { warehouse })}</SheetDescription>
        </SheetHeader>
        <div className="space-y-6 px-4 pb-6">
          {bin.isError ? (
            <ErrorPanel onRetry={() => void bin.refetch()} />
          ) : !data ? (
            <>
              <Skeleton className="h-16 rounded-lg" />
              <Skeleton className="h-48 rounded-lg" />
            </>
          ) : (
            <>
              <StatStrip
                items={[
                  { key: 'fill', label: t('fill'), value: `${data.fill}%` },
                  {
                    key: 'units',
                    label: t('units'),
                    value: qty(contents.reduce((s, c) => s + c.onHand, 0)),
                  },
                  {
                    key: 'value',
                    label: t('value'),
                    value: usd(contents.reduce((s, c) => s + c.onHand * c.unitCost, 0)),
                  },
                ]}
              />
              {contents.length ? (
                <ul className="divide-y border-t">
                  {contents.map((content) => (
                    <ContentRow
                      key={content.sku}
                      warehouse={warehouse}
                      from={data.code}
                      targets={targets.filter((target) => target !== data.code)}
                      content={content}
                    />
                  ))}
                </ul>
              ) : (
                <EmptyState
                  variant="inline"
                  icon={PackageOpen}
                  title={t('empty.title')}
                  description={t('empty.description')}
                />
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
