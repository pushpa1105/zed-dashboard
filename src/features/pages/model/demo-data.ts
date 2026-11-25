/**
 * Sample content for the in-app page templates (profile, account, help,
 * onboarding). Replace with your API data; the shapes are what the pages read.
 */

export const PROFILE = {
  name: 'Hannah Morgan',
  role: 'Head of Product Operations',
  company: 'Northwind Labs',
  location: 'Lisbon, Portugal',
  timezone: 'WET (UTC+0)',
  email: 'hannah.morgan@northwind.io',
  joined: '2021-03-14',
  bio: 'I run the systems that let 140 people plan, ship and measure work without a weekly status meeting. Previously ops at two logistics startups.',
  skills: ['Roadmapping', 'SQL', 'Process design', 'OKRs', 'Vendor management', 'Hiring'],
  stats: { projects: 24, reviews: 186, response: '2h' },
};

export const PROJECTS = [
  {
    id: 'p1',
    name: 'Q1 planning cycle',
    team: 'Operations',
    progress: 82,
    due: 'Dec 12',
    status: 'onTrack',
  },
  {
    id: 'p2',
    name: 'Vendor consolidation',
    team: 'Finance',
    progress: 46,
    due: 'Jan 30',
    status: 'atRisk',
  },
  {
    id: 'p3',
    name: 'Hiring scorecards v2',
    team: 'People',
    progress: 64,
    due: 'Dec 20',
    status: 'onTrack',
  },
  {
    id: 'p4',
    name: 'Support SLA dashboard',
    team: 'Support',
    progress: 100,
    due: 'Nov 18',
    status: 'done',
  },
  {
    id: 'p5',
    name: 'Warehouse SOP rewrite',
    team: 'Logistics',
    progress: 28,
    due: 'Feb 14',
    status: 'onTrack',
  },
  {
    id: 'p6',
    name: 'Quarterly business review',
    team: 'Leadership',
    progress: 12,
    due: 'Jan 08',
    status: 'atRisk',
  },
] as const;

export const TEAM = [
  { name: 'Ivan Serhin', role: 'Operations Analyst', status: 'online' },
  { name: 'Priya Natarajan', role: 'Program Manager', status: 'away' },
  { name: 'Lucas Meyer', role: 'Finance Partner', status: 'online' },
  { name: 'Sofia Alvarez', role: 'People Ops Lead', status: 'offline' },
  { name: 'Tom Becker', role: 'Data Engineer', status: 'online' },
  { name: 'Aiko Tanaka', role: 'Support Lead', status: 'away' },
] as const;

export const ACTIVITY = [
  {
    key: 'a1',
    kind: 'review',
    text: 'Approved the Q1 headcount plan',
    meta: 'Planning · 2 hours ago',
  },
  {
    key: 'a2',
    kind: 'comment',
    text: 'Commented on “Vendor consolidation”',
    meta: 'Finance · yesterday',
  },
  {
    key: 'a3',
    kind: 'upload',
    text: 'Uploaded warehouse-sop-draft.pdf',
    meta: 'Logistics · 2 days ago',
  },
  { key: 'a4', kind: 'done', text: 'Closed “Support SLA dashboard”', meta: 'Support · Nov 18' },
  { key: 'a5', kind: 'review', text: 'Reviewed 12 hiring scorecards', meta: 'People · Nov 15' },
] as const;

export const SESSIONS = [
  {
    id: 's1',
    device: 'MacBook Pro · Chrome 131',
    location: 'Lisbon, PT',
    active: 'Active now',
    current: true,
  },
  {
    id: 's2',
    device: 'iPhone 15 · Orbitly app',
    location: 'Lisbon, PT',
    active: '2 hours ago',
    current: false,
  },
  {
    id: 's3',
    device: 'Windows · Edge 130',
    location: 'Porto, PT',
    active: '6 days ago',
    current: false,
  },
] as const;

export const INVOICES = [
  { id: 'INV-2041', date: 'Nov 01, 2026', amount: '$790.00', status: 'paid' },
  { id: 'INV-1987', date: 'Oct 01, 2026', amount: '$790.00', status: 'paid' },
  { id: 'INV-1932', date: 'Sep 01, 2026', amount: '$632.00', status: 'paid' },
  { id: 'INV-1880', date: 'Aug 01, 2026', amount: '$632.00', status: 'refunded' },
] as const;

export const INTEGRATIONS = [
  { key: 'slack', name: 'Slack', connected: true },
  { key: 'github', name: 'GitHub', connected: true },
  { key: 'stripe', name: 'Stripe', connected: false },
  { key: 'gdrive', name: 'Google Drive', connected: false },
  { key: 'jira', name: 'Jira', connected: true },
  { key: 'hubspot', name: 'HubSpot', connected: false },
] as const;

export const HELP_CATEGORIES = [
  { key: 'start', articles: 12 },
  { key: 'dashboards', articles: 28 },
  { key: 'data', articles: 19 },
  { key: 'billing', articles: 9 },
  { key: 'security', articles: 14 },
  { key: 'api', articles: 22 },
] as const;

export const HELP_ARTICLES = [
  { id: 'h1', category: 'start', title: 'Invite your team and set roles', minutes: 3 },
  { id: 'h2', category: 'dashboards', title: 'Build a dashboard from a template', minutes: 5 },
  { id: 'h3', category: 'data', title: 'Connect Postgres with a read-only user', minutes: 6 },
  { id: 'h4', category: 'billing', title: 'Change your plan or billing cycle', minutes: 2 },
  { id: 'h5', category: 'security', title: 'Turn on SSO with Okta or Entra ID', minutes: 7 },
  { id: 'h6', category: 'api', title: 'Authenticate API requests with tokens', minutes: 4 },
  {
    id: 'h7',
    category: 'dashboards',
    title: 'Schedule a dashboard to Slack every Monday',
    minutes: 3,
  },
  { id: 'h8', category: 'data', title: 'Why numbers differ between two dashboards', minutes: 6 },
] as const;

export const ONBOARDING_STEPS = [
  'profile',
  'connect',
  'dashboard',
  'invite',
  'alert',
  'mobile',
] as const;
