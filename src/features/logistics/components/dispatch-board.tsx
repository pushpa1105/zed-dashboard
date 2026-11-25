import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { Clock, GripVertical, Inbox, MoreHorizontal, Package, Zap } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { notify } from '@/core/notify/notify';
import { Link } from '@/core/router/router';
import { InitialsAvatar } from '@/shared/components/display/initials-avatar';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';

import { useAssignOrder } from '../api/logistics-api';
import { fmtKg } from '../lib/format';
import {
  totalWeight,
  type DispatchBoard as Board,
  type DispatchDriver,
  type DispatchOrder,
} from '../model/dispatch';
import { logisticsRoutes } from '../routes';

const UNASSIGNED = 'unassigned';

const byUrgency = (a: DispatchOrder, b: DispatchOrder) =>
  Number(b.priority) - Number(a.priority) || a.windowStart.localeCompare(b.windowStart);

type Assign = (order: DispatchOrder, driverId: string | null) => void;

function AssignMenu({
  order,
  drivers,
  onAssign,
}: {
  order: DispatchOrder;
  drivers: DispatchDriver[];
  onAssign: Assign;
}) {
  const { t } = useTranslation('logistics');
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          aria-label={t('dispatch.assignTo', { id: order.id })}
        >
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-80 w-56 overflow-y-auto">
        <DropdownMenuLabel>{t('dispatch.assign')}</DropdownMenuLabel>
        {drivers
          .filter((d) => d.id !== order.driverId)
          .map((d) => (
            <DropdownMenuItem key={d.id} onSelect={() => onAssign(order, d.id)}>
              {d.name}
            </DropdownMenuItem>
          ))}
        {order.driverId && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onAssign(order, null)}>
              {t('dispatch.unassign')}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function OrderFace({
  order,
  handle,
  menu,
  className,
}: {
  order: DispatchOrder;
  handle?: ReactNode;
  menu?: ReactNode;
  className?: string;
}) {
  const { t, i18n } = useTranslation('logistics');
  return (
    <article className={cn('rounded-lg border bg-card p-3 shadow-xs', className)}>
      <header className="flex items-center gap-1.5">
        {handle}
        <span className="font-mono text-xs font-semibold">{order.id}</span>
        {order.priority && (
          <Zap
            className="size-3.5 fill-warning text-warning"
            aria-label={t('shipments.priority')}
          />
        )}
        <span className="ml-auto">{menu}</span>
      </header>
      <p className="mt-1.5 truncate text-sm font-medium">{order.customer}</p>
      <p className="text-xs text-muted-foreground">{order.city}</p>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground tabular-nums">
        <span className="inline-flex items-center gap-1">
          <Clock className="size-3" /> {order.windowStart}–{order.windowEnd}
        </span>
        <span className="inline-flex items-center gap-1">
          <Package className="size-3" /> {order.parcels} · {fmtKg(order.weightKg, i18n.language)}
        </span>
      </div>
    </article>
  );
}

function DraggableOrder({
  order,
  drivers,
  onAssign,
}: {
  order: DispatchOrder;
  drivers: DispatchDriver[];
  onAssign: Assign;
}) {
  const { t } = useTranslation('logistics');
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: order.id });
  return (
    <li ref={setNodeRef} className={cn(isDragging && 'opacity-40')}>
      <OrderFace
        order={order}
        handle={
          <button
            type="button"
            className="-ml-1 cursor-grab rounded text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
            aria-label={t('dispatch.drag', { id: order.id })}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-4" />
          </button>
        }
        menu={<AssignMenu order={order} drivers={drivers} onAssign={onAssign} />}
      />
    </li>
  );
}

function Lane({
  id,
  header,
  count,
  children,
}: {
  id: string;
  header: ReactNode;
  count: number;
  children: ReactNode;
}) {
  const { t } = useTranslation('logistics');
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <section
      ref={setNodeRef}
      className={cn(
        'flex w-72 shrink-0 flex-col rounded-xl border bg-muted/40 transition-colors',
        isOver && 'border-primary bg-primary/5',
      )}
    >
      <div className="border-b p-3">{header}</div>
      {count ? (
        <ul className="flex flex-1 flex-col gap-2 p-2">{children}</ul>
      ) : (
        <p className="flex flex-1 items-center justify-center p-6 text-center text-xs text-muted-foreground">
          {t('dispatch.dropHere')}
        </p>
      )}
    </section>
  );
}

function DriverHeader({ driver, orders }: { driver: DispatchDriver; orders: DispatchOrder[] }) {
  const { t, i18n } = useTranslation('logistics');
  const load = totalWeight(orders);
  const pct = Math.min(100, (load / driver.capacityKg) * 100);
  const over = load > driver.capacityKg;
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2.5">
        <InitialsAvatar name={driver.name} size="sm" />
        <div className="min-w-0 leading-tight">
          <Link
            to={logisticsRoutes.driver.href({ driverId: driver.id })}
            className="block truncate text-sm font-medium hover:underline"
          >
            {driver.name}
          </Link>
          <p className="truncate text-xs text-muted-foreground">
            {driver.vehicle ?? t('dispatch.poolVan')} ·{' '}
            {t('dispatch.hoursLeft', { value: driver.hoursLeft })}
          </p>
        </div>
      </div>
      <div className="space-y-1">
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className={cn('h-full rounded-full', over ? 'bg-destructive' : 'bg-primary')}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p
          className={cn(
            'text-xs tabular-nums',
            over ? 'font-medium text-destructive' : 'text-muted-foreground',
          )}
        >
          {t('dispatch.load', {
            load: fmtKg(load, i18n.language),
            capacity: fmtKg(driver.capacityKg, i18n.language),
          })}
        </p>
      </div>
    </div>
  );
}

/**
 * Unassigned orders on the left, one lane per driver on shift. Orders move by
 * dragging the grip (mouse, touch or keyboard) or through the card's menu.
 */
export function DispatchBoard({ board }: { board: Board }) {
  const { t } = useTranslation('logistics');
  const assign = useAssignOrder();
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor),
  );

  const ordersOf = (driverId: string | null) =>
    board.orders.filter((o) => o.driverId === driverId).sort(byUrgency);
  const unassigned = ordersOf(null);
  const active = board.orders.find((o) => o.id === activeId);

  const move: Assign = (order, driverId) => {
    if (order.driverId === driverId) return;
    const driver = board.drivers.find((d) => d.id === driverId);
    assign.mutate(
      { orderId: order.id, driverId },
      {
        onSuccess: () =>
          notify.success(
            driver
              ? t('dispatch.assigned', { id: order.id, name: driver.name })
              : t('dispatch.unassigned', { id: order.id }),
          ),
      },
    );
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    const order = board.orders.find((o) => o.id === active.id);
    if (!order || !over) return;
    move(order, over.id === UNASSIGNED ? null : String(over.id));
  };

  const renderOrders = (orders: DispatchOrder[]) =>
    orders.map((o) => (
      <DraggableOrder key={o.id} order={o} drivers={board.drivers} onAssign={move} />
    ));

  return (
    <DndContext
      sensors={sensors}
      onDragStart={({ active }) => setActiveId(String(active.id))}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div
        className="-mx-4 flex items-stretch gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0"
        role="region"
        aria-label={t('dispatch.board')}
      >
        <Lane
          id={UNASSIGNED}
          count={unassigned.length}
          header={
            <p className="flex items-center gap-2 text-sm font-medium">
              <Inbox className="size-4 text-muted-foreground" /> {t('dispatch.unassignedColumn')}
              <span className="ml-auto rounded-full bg-warning/15 px-2 text-xs tabular-nums">
                {unassigned.length}
              </span>
            </p>
          }
        >
          {renderOrders(unassigned)}
        </Lane>
        {board.drivers.map((driver) => {
          const orders = ordersOf(driver.id);
          return (
            <Lane
              key={driver.id}
              id={driver.id}
              count={orders.length}
              header={<DriverHeader driver={driver} orders={orders} />}
            >
              {renderOrders(orders)}
            </Lane>
          );
        })}
      </div>
      <DragOverlay>
        {active && <OrderFace order={active} className="rotate-2 shadow-lg" />}
      </DragOverlay>
    </DndContext>
  );
}
