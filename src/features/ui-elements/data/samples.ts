/**
 * Demo data for the showcase pages. It is content (names, numbers), not UI
 * chrome, so it is not translated.
 */

export const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export const revenueByMonth = MONTHS.map((month, i) => ({
  month,
  revenue: Math.round(42_000 + Math.sin(i / 1.7) * 9_000 + i * 2_100),
  expenses: Math.round(28_000 + Math.cos(i / 2.1) * 5_000 + i * 900),
}));

export const trafficBySource = MONTHS.slice(0, 8).map((month, i) => ({
  month,
  organic: Math.round(8_200 + i * 640 + Math.sin(i) * 900),
  paid: Math.round(4_100 + i * 310 + Math.cos(i) * 600),
  referral: Math.round(2_300 + i * 140 + Math.sin(i * 1.3) * 400),
}));

export const forecast = MONTHS.map((month, i) => ({
  month,
  actual: i < 9 ? Math.round(120 + i * 11 + Math.sin(i) * 14) : null,
  forecast: i >= 8 ? Math.round(120 + i * 11 + 6) : null,
}));

export const ordersByChannel = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => ({
  day,
  online: [64, 82, 71, 90, 104, 58, 47][i]!,
  retail: [38, 41, 45, 40, 52, 61, 55][i]!,
  partners: [12, 18, 15, 22, 19, 9, 7][i]!,
}));

export const topProducts = [
  { product: 'Aurora desk lamp', units: 1_284 },
  { product: 'Nordic oak chair', units: 1_032 },
  { product: 'Linen throw blanket', units: 876 },
  { product: 'Ceramic pour-over set', units: 702 },
  { product: 'Walnut monitor stand', units: 548 },
];

export const weeklySignups = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'].map((week, i) => ({
  week,
  signups: [320, 410, 380, 460, 520, 490, 560, 642][i]!,
}));

export const trafficShare = [
  { key: 'organic', label: 'Organic search', value: 48_200 },
  { key: 'direct', label: 'Direct', value: 26_900 },
  { key: 'social', label: 'Social', value: 14_300 },
  { key: 'email', label: 'Email', value: 8_700 },
  { key: 'other', label: 'Other', value: 4_100 },
];

export const goals = [
  { key: 'design', label: 'Design', value: 86 },
  { key: 'build', label: 'Build', value: 64 },
  { key: 'qa', label: 'QA', value: 41 },
];

export const skills = ['Speed', 'Quality', 'Support', 'Price', 'Features', 'Reliability'].map(
  (axis, i) => ({
    axis,
    ours: [86, 78, 92, 64, 81, 88][i]!,
    market: [70, 74, 68, 72, 76, 71][i]!,
  }),
);

export const sparkRows = [
  { metric: 'Revenue', value: '$84.2k', data: [12, 14, 13, 17, 16, 19, 21, 20, 24, 26] },
  { metric: 'Active users', value: '12,480', data: [30, 28, 31, 33, 32, 36, 35, 38, 37, 41] },
  { metric: 'Churn', value: '2.1%', data: [9, 8, 8, 7, 7, 6, 6, 5, 5, 4] },
  { metric: 'Tickets', value: '318', data: [22, 26, 19, 24, 30, 27, 21, 25, 28, 23] },
];

export const HEAT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const HEAT_HOURS = ['6a', '8a', '10a', '12p', '2p', '4p', '6p', '8p', '10p'];
export const heatValues = HEAT_DAYS.map((_, d) =>
  HEAT_HOURS.map((_, h) => {
    const workday = d < 5 ? 1 : 0.45;
    const peak = Math.exp(-((h - 3.5) ** 2) / 6);
    return Math.round((40 + 260 * peak) * workday + ((d * 7 + h * 13) % 30));
  }),
);

export const people = [
  'Hannah Morgan',
  'Leo Park',
  'Amara Okafor',
  'Diego Ramírez',
  'Sofia Lindqvist',
  'Kenji Watanabe',
  'Priya Nair',
  'Tom Becker',
];
