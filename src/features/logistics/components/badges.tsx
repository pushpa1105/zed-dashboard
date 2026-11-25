import {
  AlertOctagon,
  AlertTriangle,
  ArrowDown,
  CircleAlert,
  Plane,
  Ship,
  TrainFront,
  Truck,
} from 'lucide-react';

import { useTranslation } from '@/core/i18n/use-translation';
import { StatusBadge } from '@/shared/components/display/status-badge';
import { TONES, type Tone } from '@/shared/components/display/tone';
import { cn } from '@/shared/lib/cn';

import { daysUntil } from '../lib/format';
import type { InvoiceStatus } from '../model/billing';
import type { CarrierStatus, Grade } from '../model/carriers';
import type {
  DriverStatus,
  Severity,
  ShipmentStatus,
  TransportMode,
  VehicleStatus,
} from '../model/logistics';
import type { SlaHealth } from '../model/slas';

const SHIPMENT_TONES: Record<ShipmentStatus, Tone> = {
  booked: 'neutral',
  picked_up: 'info',
  in_transit: 'primary',
  at_hub: 'violet',
  out_for_delivery: 'aqua',
  delivered: 'success',
  exception: 'danger',
};

export function ShipmentStatusBadge({
  status,
  variant,
}: {
  status: ShipmentStatus;
  variant?: 'badge' | 'dot';
}) {
  const { t } = useTranslation('logistics');
  return (
    <StatusBadge
      status={status}
      tone={SHIPMENT_TONES[status]}
      label={t(`status.${status}`)}
      variant={variant}
    />
  );
}

const SEVERITY_STYLE: Record<Severity, { tone: Tone; icon: typeof AlertOctagon }> = {
  critical: { tone: 'danger', icon: AlertOctagon },
  high: { tone: 'orange', icon: AlertTriangle },
  medium: { tone: 'warning', icon: CircleAlert },
  low: { tone: 'neutral', icon: ArrowDown },
};

/** Severity with an icon, so it never relies on color alone. */
export function SeverityBadge({ severity, className }: { severity: Severity; className?: string }) {
  const { t } = useTranslation('logistics');
  const { tone, icon: Icon } = SEVERITY_STYLE[severity];
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center gap-1 rounded-md px-1.5 text-xs font-medium',
        className,
      )}
      style={{
        background: `color-mix(in srgb, ${TONES[tone]} 12%, transparent)`,
        color: `color-mix(in srgb, ${TONES[tone]} 80%, var(--foreground))`,
      }}
    >
      <Icon className="size-3.5" aria-hidden />
      {t(`severity.${severity}`)}
    </span>
  );
}

const VEHICLE_TONES: Record<VehicleStatus, Tone> = {
  on_route: 'primary',
  idle: 'neutral',
  charging: 'aqua',
  maintenance: 'warning',
};

export function VehicleStatusBadge({ status }: { status: VehicleStatus }) {
  const { t } = useTranslation('logistics');
  return (
    <StatusBadge
      status={status}
      tone={VEHICLE_TONES[status]}
      label={t(`vehicleStatus.${status}`)}
    />
  );
}

const DRIVER_TONES: Record<DriverStatus, Tone> = {
  driving: 'primary',
  on_break: 'warning',
  available: 'success',
  off_duty: 'neutral',
};

export function DriverStatusBadge({ status }: { status: DriverStatus }) {
  const { t } = useTranslation('logistics');
  return (
    <StatusBadge
      status={status}
      tone={DRIVER_TONES[status]}
      label={t(`driverStatus.${status}`)}
      variant="dot"
    />
  );
}

const INVOICE_TONES: Record<InvoiceStatus, Tone> = {
  pending: 'warning',
  approved: 'success',
  disputed: 'danger',
};

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const { t } = useTranslation('logistics');
  return (
    <StatusBadge
      status={status}
      tone={INVOICE_TONES[status]}
      label={t(`billing.status.${status}`)}
      variant="dot"
    />
  );
}

const EXPIRY_TONES = { expired: 'danger', expiring: 'warning', valid: 'success' } as const;

/** Expired, expiring within 30 days, or valid. */
export function ExpiryBadge({ expiresAt }: { expiresAt: string }) {
  const { t } = useTranslation('logistics');
  const days = daysUntil(expiresAt);
  const state = days < 0 ? 'expired' : days <= 30 ? 'expiring' : 'valid';
  return <StatusBadge status={state} tone={EXPIRY_TONES[state]} label={t(`expiry.${state}`)} />;
}

const MODE_ICONS: Record<TransportMode, typeof Truck> = {
  road: Truck,
  rail: TrainFront,
  air: Plane,
  sea: Ship,
};

export function ModeLabel({ mode }: { mode: TransportMode }) {
  const { t } = useTranslation('logistics');
  const Icon = MODE_ICONS[mode];
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-muted-foreground">
      <Icon className="size-3.5" aria-hidden />
      {t(`mode.${mode}`)}
    </span>
  );
}

const CARRIER_TONES: Record<CarrierStatus, Tone> = { active: 'success', suspended: 'danger' };

export function CarrierStatusBadge({ status }: { status: CarrierStatus }) {
  const { t } = useTranslation('logistics');
  return (
    <StatusBadge
      status={status}
      tone={CARRIER_TONES[status]}
      label={t(`carriers.status.${status}`)}
      variant="dot"
    />
  );
}

const GRADE_TONES: Record<Grade, Tone> = { A: 'success', B: 'info', C: 'warning', D: 'danger' };

/** Scorecard grade with its score, e.g. "B · 78". */
export function GradeBadge({ grade, score }: { grade: Grade; score: number }) {
  return (
    <StatusBadge
      status={grade}
      tone={GRADE_TONES[grade]}
      label={`${grade} · ${score}`}
      className="tabular-nums"
    />
  );
}

const SLA_TONES: Record<SlaHealth, Tone> = {
  met: 'success',
  at_risk: 'warning',
  breached: 'danger',
};

export function SlaHealthBadge({ health }: { health: SlaHealth }) {
  const { t } = useTranslation('logistics');
  return (
    <StatusBadge status={health} tone={SLA_TONES[health]} label={t(`slas.health.${health}`)} />
  );
}
