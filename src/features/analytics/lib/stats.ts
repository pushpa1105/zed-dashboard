import type { Retention, Variant } from '../model/analytics';

/** Error function, Abramowitz & Stegun 7.1.26 (max error 1.5e-7). */
function erf(x: number) {
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-x * x);
  return Math.sign(x) * y;
}

export const conversionRate = (v: Pick<Variant, 'visitors' | 'conversions'>) =>
  v.visitors ? (v.conversions / v.visitors) * 100 : 0;

/** Conversion rate of a traffic segment, in percent of its sessions. */
export const sessionRate = ({ sessions, conversions }: { sessions: number; conversions: number }) =>
  conversionRate({ visitors: sessions, conversions });

/** Significance level at which an experiment is called. */
export const SIGNIFICANCE = 95;

/**
 * Relative lift of a variant over the control and the confidence that the
 * difference is real (two-sided, two-proportion z-test), both in percent.
 */
export function compareToControl(variant: Variant, control: Variant) {
  const rc = conversionRate(control);
  const rv = conversionRate(variant);
  const pooled =
    (control.conversions + variant.conversions) / (control.visitors + variant.visitors || 1);
  const se = Math.sqrt(pooled * (1 - pooled) * (1 / control.visitors + 1 / variant.visitors));
  const z = se ? (rv - rc) / 100 / se : 0;
  return {
    lift: rc ? ((rv - rc) / rc) * 100 : 0,
    confidence: erf(Math.abs(z) / Math.SQRT2) * 100,
  };
}

/** The challenger with the highest lift, with its comparison to the control. */
export function bestVariant(variants: Variant[]) {
  const control = variants.find((v) => v.control) ?? variants[0]!;
  return variants
    .filter((v) => v !== control)
    .map((variant) => ({ variant, ...compareToControl(variant, control) }))
    .sort((a, b) => b.lift - a.lift)[0];
}

/** Average share (%) of users retained N weeks after signup, over cohorts old enough to have that week. */
export function averageRetention(cohorts: Retention['cohorts']) {
  const weeks = Math.max(0, ...cohorts.map((c) => c.retained.length));
  return Array.from({ length: weeks }, (_, w) => {
    const eligible = cohorts.filter((c) => c.retained.length > w);
    const size = eligible.reduce((sum, c) => sum + c.size, 0);
    const kept = eligible.reduce((sum, c) => sum + c.retained[w]!, 0);
    return size ? (kept / size) * 100 : 0;
  });
}
