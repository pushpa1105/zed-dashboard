import { useEffect, useState } from 'react';

import { cn } from '@/shared/lib/cn';

export type CountdownProps = {
  /** Target time (Date or epoch ms). */
  to: Date | number;
  labels?: { days: string; hours: string; minutes: string; seconds: string };
  onComplete?: () => void;
  className?: string;
};

const pad = (n: number) => String(n).padStart(2, '0');

/** Live countdown to a deadline (launches, trials, sales). */
export function Countdown({
  to,
  labels = { days: 'Days', hours: 'Hours', minutes: 'Min', seconds: 'Sec' },
  onComplete,
  className,
}: CountdownProps) {
  const target = typeof to === 'number' ? to : to.getTime();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const left = Math.max(0, target - now);
  useEffect(() => {
    if (left === 0) onComplete?.();
  }, [left, onComplete]);

  const parts = [
    { key: 'days', value: Math.floor(left / 86_400_000), label: labels.days },
    { key: 'hours', value: Math.floor(left / 3_600_000) % 24, label: labels.hours },
    { key: 'minutes', value: Math.floor(left / 60_000) % 60, label: labels.minutes },
    { key: 'seconds', value: Math.floor(left / 1000) % 60, label: labels.seconds },
  ];

  return (
    <div className={cn('flex gap-2', className)} role="timer" aria-live="off">
      {parts.map((p) => (
        <div key={p.key} className="flex w-16 flex-col items-center rounded-lg border bg-card py-2">
          <span className="text-2xl font-semibold tabular-nums">{pad(p.value)}</span>
          <span className="text-[0.65rem] tracking-wide text-muted-foreground uppercase">
            {p.label}
          </span>
        </div>
      ))}
    </div>
  );
}
