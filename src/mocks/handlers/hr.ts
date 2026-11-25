import { http, HttpResponse, type HttpHandler } from 'msw';

import { uid } from '../db';
import { errorResponse } from '../utils';

import { hrDocumentHandlers } from './hr-documents';
import { hrEngagementHandlers } from './hr-engagement';
import { DAY, DEPARTMENTS, guard, isoDate, rng, startOfToday, url } from './hr-shared';
import { hrTrainingHandlers } from './hr-training';

/**
 * Mock API for the HR workspace. Seeded deterministically, kept in memory:
 * candidate moves, time-off decisions, approved pay runs and new jobs
 * persist until the page reloads.
 */

/* -------------------------------------------------------------------------- */
/*  Overview (ported from the original HR dashboard)                           */
/* -------------------------------------------------------------------------- */

const RANGE_DAYS = { '7d': 7, '14d': 14, '30d': 30, '90d': 90 } as const;
type Range = keyof typeof RANGE_DAYS;
const TODAY = Date.UTC(2026, 10, 24);
const isoDay = (daysAgo: number) => isoDate(TODAY - daysAgo * DAY);

type Opening = {
  id: string;
  title: string;
  department: string;
  location: string;
  publishedAt: string;
  candidates: string[];
  total: number;
  status: 'open' | 'paused';
};

let openings: Opening[] = [
  {
    id: 'job-1',
    title: 'Senior .NET Developer',
    department: 'Engineering',
    location: 'Remote (EU)',
    publishedAt: '2026-11-20',
    candidates: ['Olivia Park', 'Sam Okafor', 'Lea Brandt'],
    total: 7,
    status: 'open',
  },
  {
    id: 'job-2',
    title: 'Senior Java Developer',
    department: 'Engineering',
    location: 'Berlin',
    publishedAt: '2026-11-19',
    candidates: ['Tom Becker', 'Ana Lima', 'Raj Patel'],
    total: 13,
    status: 'open',
  },
  {
    id: 'job-3',
    title: 'UI/UX Designer',
    department: 'Design',
    location: 'Lisbon',
    publishedAt: '2026-11-18',
    candidates: ['Mia Chen', 'Noah Weiss', 'Zoe Martin'],
    total: 10,
    status: 'open',
  },
  {
    id: 'job-4',
    title: 'Customer Success Lead',
    department: 'Support',
    location: 'Toronto',
    publishedAt: '2026-11-15',
    candidates: ['Eli Novak', 'Ines Costa'],
    total: 2,
    status: 'paused',
  },
];

function overview(range: Range, compare: 'previous' | 'lastYear') {
  const days = RANGE_DAYS[range];
  const rand = rng(days * 13 + (compare === 'lastYear' ? 5 : 1));
  const step = days > 30 ? 3 : 1;
  const series = Array.from({ length: Math.ceil(days / step) }, (_, i) => {
    const daysAgo = days - 1 - i * step;
    const base = 26 + Math.sin(i / 1.7) * 11 + Math.cos(i / 4.3) * 7;
    return {
      date: isoDay(daysAgo),
      current: Math.max(2, Math.round(base + rand() * 10)),
      previous: Math.max(2, Math.round(base * (compare === 'lastYear' ? 0.7 : 0.85) + rand() * 8)),
    };
  });
  const scale = days / 7;
  return {
    stats: {
      newCandidates: { value: Math.round(35 * scale), change: 4 },
      applications: { value: Math.round(49 * scale), change: 7 },
      totalCandidates: { value: 587, change: 25 },
      employees: { value: 214, change: 3 },
    },
    series,
    interviews: [
      {
        id: 'i1',
        date: '2026-11-24',
        candidate: 'Ivan Serhin',
        start: '10:30',
        end: '12:00',
        role: 'Product Designer',
        stage: 'Phone screening',
      },
      {
        id: 'i2',
        date: '2026-11-25',
        candidate: 'Olivia Park',
        start: '13:00',
        end: '14:00',
        role: 'Senior .NET Developer',
        stage: 'Technical interview',
      },
      {
        id: 'i3',
        date: '2026-11-26',
        candidate: 'Mia Chen',
        start: '09:00',
        end: '09:45',
        role: 'UI/UX Designer',
        stage: 'Portfolio review',
      },
      {
        id: 'i4',
        date: '2026-11-27',
        candidate: 'Raj Patel',
        start: '15:30',
        end: '16:30',
        role: 'Senior Java Developer',
        stage: 'Culture fit',
      },
    ],
    openings: openings.map(({ location: _l, status: _s, ...o }) => o),
    headcount: [
      { department: 'Engineering', count: 86 },
      { department: 'Sales', count: 41 },
      { department: 'Support', count: 29 },
      { department: 'Design', count: 18 },
      { department: 'Marketing', count: 22 },
      { department: 'Finance', count: 11 },
      { department: 'People', count: 7 },
    ],
    pipeline: [
      { stage: 'Applied', count: 312 },
      { stage: 'Screening', count: 128 },
      { stage: 'Interview', count: 54 },
      { stage: 'Offer', count: 14 },
      { stage: 'Hired', count: 9 },
    ],
    onboarding: [
      {
        id: 'o1',
        name: 'Daniel Kim',
        role: 'Backend Engineer',
        startDate: '2026-11-17',
        progress: 80,
      },
      {
        id: 'o2',
        name: 'Sara Lind',
        role: 'Account Executive',
        startDate: '2026-11-17',
        progress: 55,
      },
      {
        id: 'o3',
        name: 'Marco Bianchi',
        role: 'Support Specialist',
        startDate: '2026-11-24',
        progress: 20,
      },
      {
        id: 'o4',
        name: 'Hana Sato',
        role: 'Product Designer',
        startDate: '2026-12-01',
        progress: 5,
      },
    ],
    activity: [
      {
        id: 'h1',
        actor: 'Ana Lima',
        action: 'applied for',
        target: 'Senior Java Developer',
        at: '2026-11-24T08:55:00Z',
      },
      {
        id: 'h2',
        actor: 'Ivan Serhin',
        action: 'was moved to',
        target: 'Phone screening',
        at: '2026-11-23T17:10:00Z',
      },
      {
        id: 'h3',
        actor: 'Daniel Kim',
        action: 'completed',
        target: 'Security training',
        at: '2026-11-23T12:00:00Z',
      },
      {
        id: 'h4',
        actor: 'Zoe Martin',
        action: 'accepted the offer for',
        target: 'UI/UX Designer',
        at: '2026-11-22T15:45:00Z',
      },
    ],
  };
}

/* -------------------------------------------------------------------------- */
/*  People & org structure                                                     */
/* -------------------------------------------------------------------------- */

const LOCATIONS = ['Berlin', 'Lisbon', 'Toronto', 'Remote (EU)', 'Austin', 'Singapore'];
const FIRST = [
  'Amara',
  'Ben',
  'Chloe',
  'Diego',
  'Elif',
  'Farid',
  'Greta',
  'Hugo',
  'Ines',
  'Jonas',
  'Keiko',
  'Liam',
  'Maya',
  'Nils',
  'Omar',
  'Paula',
  'Quinn',
  'Rosa',
  'Sven',
  'Tara',
  'Umar',
  'Vera',
  'Wen',
  'Yara',
  'Zane',
  'Aiko',
  'Bruno',
  'Camila',
  'Dario',
  'Ella',
  'Felix',
  'Hana',
];
const LAST = [
  'Okafor',
  'Lindqvist',
  'Moreau',
  'Alvarez',
  'Yilmaz',
  'Haddad',
  'Schulz',
  'Laurent',
  'Costa',
  'Weber',
  'Tanaka',
  'Brennan',
  'Chen',
  'Berg',
  'Nasser',
  'Ruiz',
  'Hughes',
  'Ferreira',
  'Holm',
  'Singh',
  'Rahman',
  'Novak',
  'Li',
  'Haddou',
  'Fischer',
  'Mori',
  'Santos',
  'Reyes',
  'Conti',
  'Ward',
  'Kraus',
  'Sato',
];
const DEPT_TITLES: Record<(typeof DEPARTMENTS)[number], [string, string, string]> = {
  Engineering: ['VP Engineering', 'Engineering Manager', 'Software Engineer'],
  Design: ['Head of Design', 'Design Lead', 'Product Designer'],
  Sales: ['VP Sales', 'Sales Manager', 'Account Executive'],
  Marketing: ['Head of Marketing', 'Marketing Lead', 'Marketing Specialist'],
  Support: ['Head of Support', 'Support Lead', 'Support Specialist'],
  Finance: ['Finance Director', 'Controller', 'Financial Analyst'],
  People: ['Head of People', 'People Partner', 'Recruiter'],
};
const LEVEL_SALARY = [240_000, 168_000, 128_000, 92_000];

type Person = {
  id: string;
  name: string;
  title: string;
  department: string;
  location: string;
  email: string;
  phone: string;
  managerId: string | null;
  startDate: string;
  status: 'active' | 'onLeave' | 'onboarding';
  employmentType: 'fullTime' | 'partTime' | 'contract';
  level: number;
  salary: number;
  rating: number;
};

const people: Person[] = [];
{
  const r = rng(2026);
  let n = 0;
  const make = (
    title: string,
    department: string,
    managerId: string | null,
    level: number,
  ): Person => {
    const first = FIRST[n % FIRST.length]!;
    const last = LAST[(n * 5 + 3) % LAST.length]!;
    n += 1;
    const id = `e-${100 + n}`;
    return {
      id,
      name: `${first} ${last}`,
      title,
      department,
      location: LOCATIONS[Math.floor(r() * LOCATIONS.length)]!,
      email: `${first.toLowerCase()}.${last.toLowerCase()}@orbitly.io`,
      phone: `+49 30 ${Math.floor(1000 + r() * 8999)} ${Math.floor(100 + r() * 899)}`,
      managerId,
      startDate: isoDate(Date.UTC(2018, 0, 8) + Math.floor(r() * 2700) * DAY),
      status: r() > 0.92 ? 'onLeave' : r() > 0.95 ? 'onboarding' : 'active',
      employmentType: level === 3 && r() > 0.85 ? 'contract' : r() > 0.95 ? 'partTime' : 'fullTime',
      level,
      salary: Math.round((LEVEL_SALARY[level]! * (0.88 + r() * 0.24)) / 500) * 500,
      rating: Math.round((2.8 + r() * 2.2) * 10) / 10,
    };
  };
  const ceo = make('Chief Executive Officer', 'People', null, 0);
  ceo.department = 'Executive';
  people.push(ceo);
  for (const dept of DEPARTMENTS) {
    const [headTitle, leadTitle, icTitle] = DEPT_TITLES[dept];
    const head = make(headTitle, dept, ceo.id, 1);
    people.push(head);
    for (let l = 0; l < 2; l++) {
      const lead = make(leadTitle, dept, head.id, 2);
      people.push(lead);
      for (let i = 0; i < 3; i++) people.push(make(icTitle, dept, lead.id, 3));
    }
  }
}

/* -------------------------------------------------------------------------- */
/*  Recruiting                                                                  */
/* -------------------------------------------------------------------------- */

const CANDIDATE_STAGES = ['applied', 'screening', 'interview', 'offer', 'hired'] as const;
type CandidateStage = (typeof CANDIDATE_STAGES)[number];
type Candidate = {
  id: string;
  jobId: string;
  name: string;
  email: string;
  stage: CandidateStage;
  rating: number;
  source: string;
  appliedAt: string;
  location: string;
};
const CANDIDATE_NAMES = [
  'Olivia Park',
  'Sam Okafor',
  'Lea Brandt',
  'Tom Becker',
  'Ana Lima',
  'Raj Patel',
  'Mia Chen',
  'Noah Weiss',
  'Zoe Martin',
  'Eli Novak',
  'Ines Costa',
  'Ivan Serhin',
  'Kai Nakamura',
  'Lucia Ortega',
  'Mateo Rossi',
  'Nora Quinn',
  'Oskar Lund',
  'Priya Nair',
  'Ruth Abebe',
  'Sanjay Rao',
  'Theo Grant',
  'Uma Desai',
  'Victor Hale',
  'Wanda Kowal',
];
const candidates: Candidate[] = [];
{
  const r = rng(77);
  let c = 0;
  for (const job of openings) {
    const count = Math.min(job.total, 9);
    for (let i = 0; i < count; i++) {
      const name = CANDIDATE_NAMES[c % CANDIDATE_NAMES.length]!;
      c += 1;
      candidates.push({
        id: `c-${c}`,
        jobId: job.id,
        name,
        email: `${name.toLowerCase().replace(' ', '.')}@mail.com`,
        stage: CANDIDATE_STAGES[[0, 0, 1, 1, 2, 0, 1, 3, 2, 4][(c + i) % 10]!]!,
        rating: 2 + Math.floor(r() * 4),
        source: ['LinkedIn', 'Referral', 'Careers site', 'Agency'][Math.floor(r() * 4)]!,
        appliedAt: isoDate(Date.parse(job.publishedAt) + Math.floor(r() * 5) * DAY),
        location: LOCATIONS[Math.floor(r() * LOCATIONS.length)]!,
      });
    }
  }
}

/* -------------------------------------------------------------------------- */
/*  Time off                                                                    */
/* -------------------------------------------------------------------------- */

type LeaveType = 'vacation' | 'sick' | 'parental' | 'personal';
type TimeOff = {
  id: string;
  personId: string;
  name: string;
  department: string;
  type: LeaveType;
  start: string;
  end: string;
  days: number;
  status: 'pending' | 'approved' | 'declined';
  note: string;
};
const NOTES: Record<LeaveType, string> = {
  vacation: 'Family trip, back online the Monday after.',
  sick: 'Doctor’s note attached.',
  parental: 'Parental leave, part one.',
  personal: 'Moving apartments.',
};
const timeOff: TimeOff[] = [];
{
  const r = rng(314);
  const first = new Date(startOfToday());
  first.setUTCDate(1);
  const monthStart = first.getTime();
  for (let i = 0; i < 26; i++) {
    const person = people[(i * 7 + 3) % people.length]!;
    const type: LeaveType = (
      ['vacation', 'vacation', 'vacation', 'sick', 'personal', 'parental'] as const
    )[Math.floor(r() * 6)]!;
    const startOffset = Math.floor(r() * 50) - 12;
    const length =
      type === 'parental'
        ? 10
        : type === 'sick'
          ? 1 + Math.floor(r() * 2)
          : 1 + Math.floor(r() * 6);
    const start = monthStart + startOffset * DAY;
    const end = start + (length - 1) * DAY;
    timeOff.push({
      id: `to-${i + 1}`,
      personId: person.id,
      name: person.name,
      department: person.department,
      type,
      start: isoDate(start),
      end: isoDate(end),
      days: length,
      status:
        end < startOfToday()
          ? 'approved'
          : i % 4 === 0
            ? 'pending'
            : r() > 0.9
              ? 'declined'
              : 'approved',
      note: NOTES[type],
    });
  }
}

/* -------------------------------------------------------------------------- */
/*  Payroll                                                                     */
/* -------------------------------------------------------------------------- */

type PayRun = {
  id: string;
  period: string;
  payDate: string;
  employees: number;
  gross: number;
  taxes: number;
  deductions: number;
  net: number;
  status: 'draft' | 'pendingApproval' | 'paid';
};
const payRuns: PayRun[] = [];
{
  const r = rng(11);
  const now = new Date(startOfToday());
  for (let i = 0; i < 8; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i + 1, 0));
    const gross = Math.round((1_520_000 + i * -9_000 + r() * 40_000) / 10) * 10;
    const taxes = Math.round(gross * 0.24);
    const deductions = Math.round(gross * 0.07);
    payRuns.push({
      id: `pr-${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`,
      period: d.toISOString().slice(0, 7),
      payDate: isoDate(d.getTime()),
      employees: people.length - (i > 3 ? 2 : 0),
      gross,
      taxes,
      deductions,
      net: gross - taxes - deductions,
      status: i === 0 ? 'pendingApproval' : 'paid',
    });
  }
  payRuns.unshift({
    ...payRuns[0]!,
    id: `${payRuns[0]!.id}-draft`,
    status: 'draft',
    period: isoDate(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).slice(0, 7),
    payDate: isoDate(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 2, 0)),
  });
}

function payRunDetail(run: PayRun) {
  // Monthly salary per department, scaled so the parts add up to the run's gross.
  const raw = [...DEPARTMENTS].map((department) =>
    people.filter((p) => p.department === department).reduce((s, p) => s + p.salary / 12, 0),
  );
  const scale = run.gross / raw.reduce((s, v) => s + v, 0);
  const departments = [...DEPARTMENTS].map((department, i) => {
    const gross = Math.round(raw[i]! * scale);
    return {
      department,
      employees: people.filter((p) => p.department === department).length,
      gross,
      net: Math.round(gross * 0.69),
      color: i,
    };
  });
  const components = [
    { key: 'base', amount: Math.round(run.gross * 0.86) },
    { key: 'overtime', amount: Math.round(run.gross * 0.03) },
    { key: 'bonus', amount: Math.round(run.gross * 0.07) },
    {
      key: 'allowances',
      amount:
        run.gross -
        Math.round(run.gross * 0.86) -
        Math.round(run.gross * 0.03) -
        Math.round(run.gross * 0.07),
    },
  ];
  const lines = people.slice(1, 15).map((p) => {
    const gross = Math.round(p.salary / 12);
    return {
      id: p.id,
      name: p.name,
      title: p.title,
      gross,
      taxes: Math.round(gross * 0.24),
      net: Math.round(gross * 0.69),
    };
  });
  return { run, departments, components, lines };
}

/* -------------------------------------------------------------------------- */
/*  Performance                                                                 */
/* -------------------------------------------------------------------------- */

const cycles = [
  {
    id: 'cy-1',
    name: 'H2 2026 performance review',
    status: 'inProgress',
    due: '2026-12-12',
    completed: 41,
    total: 64,
    stage: 'Manager reviews',
  },
  {
    id: 'cy-2',
    name: 'Q4 engineering calibration',
    status: 'scheduled',
    due: '2027-01-15',
    completed: 0,
    total: 15,
    stage: 'Calibration',
  },
  {
    id: 'cy-3',
    name: 'H1 2026 performance review',
    status: 'closed',
    due: '2026-06-20',
    completed: 60,
    total: 61,
    stage: 'Done',
  },
];
const goals = [
  {
    id: 'g-1',
    title: 'Reduce time-to-hire to 30 days',
    owner: 'People',
    progress: 72,
    due: '2026-12-31',
    status: 'onTrack',
  },
  {
    id: 'g-2',
    title: 'Ship the self-serve analytics tier',
    owner: 'Engineering',
    progress: 58,
    due: '2026-12-15',
    status: 'atRisk',
  },
  {
    id: 'g-3',
    title: 'Lift NPS from 41 to 50',
    owner: 'Support',
    progress: 81,
    due: '2026-12-31',
    status: 'onTrack',
  },
  {
    id: 'g-4',
    title: 'Grow EMEA pipeline by 35%',
    owner: 'Sales',
    progress: 46,
    due: '2027-01-31',
    status: 'offTrack',
  },
  {
    id: 'g-5',
    title: 'Launch the partner marketing program',
    owner: 'Marketing',
    progress: 64,
    due: '2026-12-20',
    status: 'onTrack',
  },
];

/* -------------------------------------------------------------------------- */
/*  Candidate profiles                                                          */
/* -------------------------------------------------------------------------- */

const COMPANIES = ['Northwind', 'Contoso', 'Globex', 'Initech', 'Umbrella Labs', 'Vandelay'];
const SCHOOLS = [
  ['TU Munich', 'MSc Computer Science'],
  ['University of Lisbon', 'BA Communication Design'],
  ['University of Toronto', 'BCom Business'],
  ['ETH Zurich', 'BSc Software Engineering'],
] as const;
const SKILLS: Record<string, string[]> = {
  Engineering: ['C#', 'Java', 'Kubernetes', 'PostgreSQL', 'System design', 'AWS', 'Kafka', 'Go'],
  Design: ['Figma', 'Design systems', 'User research', 'Prototyping', 'Accessibility', 'Motion'],
  Support: ['Zendesk', 'Onboarding', 'Renewals', 'SQL', 'Coaching', 'Escalations'],
};
const SCORE_CRITERIA = ['technical', 'communication', 'problemSolving', 'cultureAdd'] as const;
const SCORE_NOTES = {
  strongYes: 'Exceptional depth; would raise the bar for the team.',
  yes: 'Solid across the board, with a couple of gaps we can coach.',
  no: 'Good communicator but missed key fundamentals for the level.',
  strongNo: 'Not a fit for this role right now.',
} as const;

function candidateProfile(candidate: Candidate) {
  const job = openings.find((j) => j.id === candidate.jobId)!;
  const r = rng(Number(candidate.id.slice(2)) * 97);
  const role = DEPT_TITLES[job.department as keyof typeof DEPT_TITLES]?.[2] ?? job.title;
  const years = 3 + Math.floor(r() * 9);
  const span = Math.ceil(years / 3);
  const [school, degree] = SCHOOLS[Math.floor(r() * SCHOOLS.length)]!;
  const recruiter = people.find((p) => p.title === 'Recruiter')!;
  const panel = people.filter((p) => p.department === job.department && p.level >= 2);
  // One scorecard per stage already passed: screening, then up to two interviews.
  const scorecards = Math.min(3, CANDIDATE_STAGES.indexOf(candidate.stage));

  return {
    candidate: {
      ...candidate,
      phone: `+1 416 ${Math.floor(200 + r() * 799)} ${Math.floor(1000 + r() * 8999)}`,
      expectedSalary: Math.round((LEVEL_SALARY[2]! * (0.8 + r() * 0.3)) / 1000) * 1000,
    },
    job: { id: job.id, title: job.title, department: job.department },
    resume: {
      headline: `${role} · ${years} years of experience`,
      summary: `${role} with ${years} years shipping customer-facing work at product companies. Comfortable owning projects end to end and mentoring others; looking for a team with a strong ${job.department.toLowerCase()} culture.`,
      skills: (SKILLS[job.department] ?? SKILLS.Support!).filter(() => r() > 0.35).slice(0, 6),
      experience: Array.from({ length: 3 }, (_, i) => ({
        id: `x${i}`,
        company: COMPANIES[(Math.floor(r() * COMPANIES.length) + i) % COMPANIES.length]!,
        role: i === 0 ? `Senior ${role}` : role,
        from: String(2026 - (i + 1) * span),
        to: i === 0 ? null : String(2026 - i * span),
      })),
      education: [{ id: 'ed1', school, degree }],
    },
    scorecards: Array.from({ length: scorecards }, (_, i) => {
      const scores = SCORE_CRITERIA.map((criterion) => ({
        criterion,
        score: 2 + Math.floor(r() * 4),
      }));
      const mean = scores.reduce((s, x) => s + x.score, 0) / scores.length;
      const recommendation =
        mean >= 4.25 ? 'strongYes' : mean >= 3.5 ? 'yes' : mean >= 2.75 ? 'no' : 'strongNo';
      const interviewer = i === 0 ? recruiter : panel[i % panel.length]!;
      return {
        id: `sc-${candidate.id}-${i}`,
        interviewer: interviewer.name,
        interviewerTitle: interviewer.title,
        stage: i === 0 ? 'screening' : 'interview',
        date: isoDate(Date.parse(candidate.appliedAt) + (i + 1) * 4 * DAY),
        recommendation,
        notes: SCORE_NOTES[recommendation],
        scores,
      };
    }),
  };
}

/* -------------------------------------------------------------------------- */
/*  Attendance                                                                  */
/* -------------------------------------------------------------------------- */

type TimesheetStatus = 'draft' | 'submitted' | 'approved';
const approvedTimesheets = new Set<string>();
const attendanceStaff = people.filter((p) => p.level >= 2).slice(0, 16);
const quarterHour = (h: number) => Math.round(h * 4) / 4;
/** Roll thresholds for today's clock state; anything lower is absent. */
const CLOCK_ODDS = [
  [0.3, 'in'],
  [0.18, 'break'],
  [0.08, 'out'],
] as const;

/** `week` is an offset from the current week (0 or negative). */
function attendance(week: number) {
  const today = startOfToday();
  const weekStart = today - ((new Date(today).getUTCDay() + 6) % 7) * DAY + week * 7 * DAY;
  const todayIndex = week === 0 ? (today - weekStart) / DAY : 7;

  return {
    weekStart: isoDate(weekStart),
    timesheets: attendanceStaff.map((p, i) => {
      const r = rng(weekStart / DAY + i * 31);
      const away = p.status === 'onLeave';
      const roll = r();
      const clock = away
        ? 'absent'
        : todayIndex >= 5
          ? 'out'
          : (CLOCK_ODDS.find(([above]) => roll > above)?.[1] ?? 'absent');
      const hours = Array.from({ length: 7 }, (_, day) => {
        const h = r();
        if (away || day > todayIndex) return 0;
        if (day >= 5) return h > 0.9 ? 4 : 0;
        if (day === todayIndex) return clock === 'absent' ? 0 : quarterHour(2 + h * 4);
        return quarterHour(h > 0.88 ? 10.5 + r() : 7.5 + h * 2);
      });
      const id = `ts-${isoDate(weekStart)}-${p.id}`;
      const seeded: TimesheetStatus =
        week < -1
          ? 'approved'
          : week === -1
            ? i % 3
              ? 'submitted'
              : 'approved'
            : i % 4
              ? 'draft'
              : 'submitted';
      const clockedAt = clock === 'in' ? 8 * 60 + Math.floor(r() * 90) : 12 * 60 + 30;
      return {
        id,
        personId: p.id,
        name: p.name,
        title: p.title,
        department: p.department,
        hours,
        scheduled: 40,
        status: approvedTimesheets.has(id) ? 'approved' : seeded,
        clock:
          week === 0
            ? {
                status: clock,
                since:
                  clock === 'in' || clock === 'break'
                    ? new Date(today + clockedAt * 60_000).toISOString()
                    : null,
              }
            : null,
      };
    }),
  };
}

/* -------------------------------------------------------------------------- */
/*  Onboarding                                                                  */
/* -------------------------------------------------------------------------- */

type TaskOwner = 'hr' | 'it' | 'manager' | 'newHire';
const ONBOARDING_TEMPLATE: Array<['beforeStart' | 'week1' | 'month1', TaskOwner, string, number]> =
  [
    ['beforeStart', 'hr', 'Send contract and welcome pack', -14],
    ['beforeStart', 'hr', 'Collect tax and bank details', -10],
    ['beforeStart', 'it', 'Ship laptop and accessories', -7],
    ['beforeStart', 'it', 'Create email and SSO accounts', -3],
    ['beforeStart', 'manager', 'Pick an onboarding buddy', -3],
    ['week1', 'manager', 'Welcome meeting and team intro', 0],
    ['week1', 'it', 'Grant access to team tools', 1],
    ['week1', 'newHire', 'Complete security training', 2],
    ['week1', 'hr', 'Benefits enrollment walkthrough', 3],
    ['week1', 'newHire', 'Read the employee handbook', 4],
    ['month1', 'manager', 'Agree 30-60-90 day goals', 10],
    ['month1', 'newHire', 'Shadow three customer calls', 14],
    ['month1', 'manager', 'First monthly check-in', 21],
    ['month1', 'hr', '30-day feedback survey', 30],
  ];
const NEW_HIRES: Array<[string, string, (typeof DEPARTMENTS)[number], number]> = [
  ['Daniel Kim', 'Backend Engineer', 'Engineering', -8],
  ['Sara Lind', 'Account Executive', 'Sales', -8],
  ['Marco Bianchi', 'Support Specialist', 'Support', -1],
  ['Hana Sato', 'Product Designer', 'Design', 6],
  ['Leo Varga', 'Financial Analyst', 'Finance', 13],
  ['Aisha Bello', 'Marketing Specialist', 'Marketing', -20],
];
const newHires = NEW_HIRES.map(([name, title, department, startOffset], h) => {
  const today = startOfToday();
  const start = today + startOffset * DAY;
  const r = rng(h + 41);
  const team = people.filter((p) => p.department === department);
  return {
    id: `nh-${h + 1}`,
    name,
    title,
    department,
    location: LOCATIONS[h % LOCATIONS.length]!,
    startDate: isoDate(start),
    manager: team.find((p) => p.level === 2)!.name,
    buddy: team.filter((p) => p.level === 3)[h % 3]!.name,
    tasks: ONBOARDING_TEMPLATE.map(([phase, owner, task, offset], i) => {
      const due = start + offset * DAY;
      const roll = r();
      return {
        id: `nh-${h + 1}-t${i + 1}`,
        phase,
        owner,
        title: task,
        due: isoDate(due),
        done: due < today ? roll > 0.12 : due < today + 3 * DAY && roll > 0.6,
      };
    }),
  };
});

/* -------------------------------------------------------------------------- */
/*  Benefits                                                                    */
/* -------------------------------------------------------------------------- */

const BENEFIT_PLANS = [
  {
    id: 'bp-health-basic',
    name: 'Essential PPO',
    category: 'health',
    provider: 'Bluepeak Health',
    description: 'Low-premium medical cover for routine and emergency care.',
    employerCost: 420,
    employeeCost: 45,
    coverage: ['$1,500 deductible', '80% in-network coinsurance', 'Telehealth included'],
  },
  {
    id: 'bp-health-plus',
    name: 'Premium PPO',
    category: 'health',
    provider: 'Bluepeak Health',
    description: 'Broader network and lower out-of-pocket costs for the whole family.',
    employerCost: 610,
    employeeCost: 120,
    coverage: [
      '$500 deductible',
      '90% in-network coinsurance',
      'Out-of-network care',
      '20 therapy sessions a year',
    ],
  },
  {
    id: 'bp-dental',
    name: 'Dental Plus',
    category: 'dental',
    provider: 'Smile Mutual',
    description: 'Preventive, basic and major dental work, including orthodontics.',
    employerCost: 38,
    employeeCost: 12,
    coverage: ['Two cleanings a year', 'Fillings at 80%', 'Orthodontics up to $2,000'],
  },
  {
    id: 'bp-vision',
    name: 'Vision Care',
    category: 'vision',
    provider: 'ClearView',
    description: 'Yearly eye exams plus an allowance for frames or contacts.',
    employerCost: 9,
    employeeCost: 4,
    coverage: ['Annual eye exam', '$200 frames or contacts allowance'],
  },
  {
    id: 'bp-401k',
    name: '401(k) with match',
    category: 'retirement',
    provider: 'Harbor Retirement',
    description: 'Pre-tax and Roth savings with an immediate-vesting company match.',
    employerCost: 380,
    employeeCost: 0,
    coverage: ['4% employer match', 'Immediate vesting', 'Roth option'],
  },
  {
    id: 'bp-life',
    name: 'Life & disability',
    category: 'life',
    provider: 'Evergreen Life',
    description: 'Company-paid life insurance and long-term disability for everyone.',
    employerCost: 22,
    employeeCost: 0,
    coverage: ['Life cover at 2× salary', 'Long-term disability at 60% of pay'],
  },
  {
    id: 'bp-wellness',
    name: 'Wellness stipend',
    category: 'wellness',
    provider: 'Kinetic',
    description: 'Monthly allowance for gyms, classes and wellbeing apps.',
    employerCost: 75,
    employeeCost: 0,
    coverage: ['Gym and studio access', 'Meditation and fitness apps'],
  },
].map((plan) => ({ ...plan, renewal: '2027-01-01' }));

const OPTIONAL_PLANS = [
  ['bp-dental', 0.85],
  ['bp-vision', 0.6],
  ['bp-401k', 0.75],
  ['bp-wellness', 0.5],
] as const;
const enrollments = people.map((p, i) => {
  const r = rng(i + 501);
  const roll = r();
  const status = roll > 0.93 ? 'waived' : roll > 0.85 ? 'pending' : 'enrolled';
  const planIds = ['bp-life'];
  if (status === 'enrolled') {
    planIds.push(r() > 0.45 ? 'bp-health-plus' : 'bp-health-basic');
    for (const [id, share] of OPTIONAL_PLANS) if (r() < share) planIds.push(id);
  }
  return { personId: p.id, name: p.name, department: p.department, planIds, status };
});

/* -------------------------------------------------------------------------- */
/*  Handlers                                                                    */
/* -------------------------------------------------------------------------- */

const summary = (p: Person) => ({
  id: p.id,
  name: p.name,
  title: p.title,
  department: p.department,
  location: p.location,
  email: p.email,
  managerId: p.managerId,
  startDate: p.startDate,
  status: p.status,
  employmentType: p.employmentType,
});

export const hrHandlers: HttpHandler[] = [
  http.get(url('/overview'), async ({ request }) => {
    const denied = await guard(request);
    if (denied) return denied;
    const params = new URL(request.url).searchParams;
    const rangeParam = params.get('range');
    const range: Range = rangeParam && rangeParam in RANGE_DAYS ? (rangeParam as Range) : '14d';
    const compare = params.get('compare') === 'lastYear' ? 'lastYear' : 'previous';
    return HttpResponse.json(overview(range, compare));
  }),

  http.post<never, { title: string; department: string; location?: string }>(
    url('/jobs'),
    async ({ request }) => {
      const denied = await guard(request);
      if (denied) return denied;
      const body = await request.json();
      const job: Opening = {
        id: `job-${uid()}`,
        title: body.title,
        department: body.department,
        location: body.location ?? 'Remote',
        publishedAt: new Date().toISOString().slice(0, 10),
        candidates: [],
        total: 0,
        status: 'open',
      };
      openings = [job, ...openings];
      const { location: _l, status: _s, ...rest } = job;
      return HttpResponse.json(rest, { status: 201 });
    },
  ),

  http.get(url('/people'), async ({ request }) => {
    const denied = await guard(request);
    if (denied) return denied;
    return HttpResponse.json(people.map(summary));
  }),

  http.get<{ id: string }>(url('/people/:id'), async ({ request, params }) => {
    const denied = await guard(request);
    if (denied) return denied;
    const person = people.find((p) => p.id === params.id);
    if (!person) return errorResponse('Employee not found', 404);
    const manager = people.find((p) => p.id === person.managerId);
    const r = rng(Number(person.id.slice(2)));
    return HttpResponse.json({
      person: {
        ...summary(person),
        phone: person.phone,
        level: person.level,
        salary: person.salary,
        rating: person.rating,
      },
      manager: manager ? summary(manager) : null,
      reports: people.filter((p) => p.managerId === person.id).map(summary),
      balances: [
        { type: 'vacation', used: 9 + Math.floor(r() * 8), total: 28 },
        { type: 'sick', used: Math.floor(r() * 5), total: 10 },
        { type: 'personal', used: Math.floor(r() * 3), total: 3 },
      ],
      timeOff: timeOff.filter((t) => t.personId === person.id),
      jobHistory: [
        {
          id: 'j1',
          title: person.title,
          from: isoDate(Date.parse(person.startDate) + 540 * DAY),
          to: null,
        },
        {
          id: 'j2',
          title:
            person.level >= 3
              ? `Junior ${person.title}`
              : (DEPT_TITLES[person.department as keyof typeof DEPT_TITLES]?.[2] ?? person.title),
          from: person.startDate,
          to: isoDate(Date.parse(person.startDate) + 539 * DAY),
        },
      ],
      documents: [
        { id: 'd1', name: 'Employment contract.pdf', size: 312_000, at: person.startDate },
        { id: 'd2', name: 'NDA signed.pdf', size: 88_000, at: person.startDate },
        { id: 'd3', name: 'H1 2026 review.pdf', size: 146_000, at: '2026-06-24' },
      ],
      reviews: [
        {
          id: 'r1',
          cycle: 'H1 2026',
          rating: person.rating,
          summary:
            'Consistently raises the bar on code reviews; owns cross-team rollouts end to end.',
        },
        {
          id: 'r2',
          cycle: 'H2 2025',
          rating: Math.max(2.5, Math.round((person.rating - 0.3) * 10) / 10),
          summary: 'Strong delivery; next step is mentoring newer teammates.',
        },
      ],
      goals: goals
        .slice(0, 3)
        .map((g, i) => ({ ...g, progress: Math.min(100, g.progress + i * 6) })),
    });
  }),

  http.get(url('/jobs'), async ({ request }) => {
    const denied = await guard(request);
    if (denied) return denied;
    return HttpResponse.json(
      openings.map((job) => ({
        id: job.id,
        title: job.title,
        department: job.department,
        location: job.location,
        publishedAt: job.publishedAt,
        status: job.status,
        applicants: candidates.filter((c) => c.jobId === job.id).length,
        inInterview: candidates.filter((c) => c.jobId === job.id && c.stage === 'interview').length,
      })),
    );
  }),

  http.get<{ id: string }>(url('/jobs/:id/candidates'), async ({ request, params }) => {
    const denied = await guard(request);
    if (denied) return denied;
    const job = openings.find((j) => j.id === params.id);
    if (!job) return errorResponse('Job not found', 404);
    return HttpResponse.json({
      job: {
        id: job.id,
        title: job.title,
        department: job.department,
        location: job.location,
        publishedAt: job.publishedAt,
        status: job.status,
        applicants: 0,
        inInterview: 0,
      },
      candidates: candidates.filter((c) => c.jobId === job.id),
    });
  }),

  http.patch<{ id: string }, { stage: CandidateStage }>(
    url('/candidates/:id'),
    async ({ request, params }) => {
      const denied = await guard(request);
      if (denied) return denied;
      const candidate = candidates.find((c) => c.id === params.id);
      if (!candidate) return errorResponse('Candidate not found', 404);
      candidate.stage = (await request.json()).stage;
      return HttpResponse.json(candidate);
    },
  ),

  http.get(url('/time-off'), async ({ request }) => {
    const denied = await guard(request);
    if (denied) return denied;
    return HttpResponse.json(timeOff);
  }),

  http.patch<{ id: string }, { status: 'approved' | 'declined' }>(
    url('/time-off/:id'),
    async ({ request, params }) => {
      const denied = await guard(request);
      if (denied) return denied;
      const entry = timeOff.find((t) => t.id === params.id);
      if (!entry) return errorResponse('Request not found', 404);
      entry.status = (await request.json()).status;
      return HttpResponse.json(entry);
    },
  ),

  http.get(url('/payroll'), async ({ request }) => {
    const denied = await guard(request);
    if (denied) return denied;
    return HttpResponse.json(payRuns);
  }),

  http.get<{ id: string }>(url('/payroll/:id'), async ({ request, params }) => {
    const denied = await guard(request);
    if (denied) return denied;
    const run = payRuns.find((p) => p.id === params.id);
    if (!run) return errorResponse('Pay run not found', 404);
    return HttpResponse.json(payRunDetail(run));
  }),

  http.post<{ id: string }>(url('/payroll/:id/approve'), async ({ request, params }) => {
    const denied = await guard(request);
    if (denied) return denied;
    const run = payRuns.find((p) => p.id === params.id);
    if (!run) return errorResponse('Pay run not found', 404);
    run.status = 'paid';
    return HttpResponse.json(run);
  }),

  http.get(url('/performance'), async ({ request }) => {
    const denied = await guard(request);
    if (denied) return denied;
    const distribution = [1, 2, 3, 4, 5].map((score) => ({
      score: String(score),
      people: people.filter((p) => Math.round(p.rating) === score).length,
    }));
    const pending = people
      .filter((p) => p.level === 3)
      .slice(0, 6)
      .map((p) => ({
        ...summary(p),
        reviewer: people.find((m) => m.id === p.managerId)?.name ?? '',
      }));
    return HttpResponse.json({ cycles, goals, distribution, pending });
  }),

  http.get<{ id: string }>(url('/candidates/:id'), async ({ request, params }) => {
    const denied = await guard(request);
    if (denied) return denied;
    const candidate = candidates.find((c) => c.id === params.id);
    if (!candidate) return errorResponse('Candidate not found', 404);
    return HttpResponse.json(candidateProfile(candidate));
  }),

  http.get(url('/attendance'), async ({ request }) => {
    const denied = await guard(request);
    if (denied) return denied;
    const week = Math.min(
      0,
      Math.trunc(Number(new URL(request.url).searchParams.get('week'))) || 0,
    );
    return HttpResponse.json(attendance(week));
  }),

  http.post<never, { ids: string[] }>(url('/timesheets/approve'), async ({ request }) => {
    const denied = await guard(request);
    if (denied) return denied;
    for (const id of (await request.json()).ids) approvedTimesheets.add(id);
    return new HttpResponse(null, { status: 204 });
  }),

  http.get(url('/onboarding'), async ({ request }) => {
    const denied = await guard(request);
    if (denied) return denied;
    return HttpResponse.json(newHires);
  }),

  http.patch<{ id: string }, { done: boolean }>(
    url('/onboarding/tasks/:id'),
    async ({ request, params }) => {
      const denied = await guard(request);
      if (denied) return denied;
      const hire = newHires.find((h) => h.tasks.some((t) => t.id === params.id));
      if (!hire) return errorResponse('Task not found', 404);
      const { done } = await request.json();
      hire.tasks = hire.tasks.map((t) => (t.id === params.id ? { ...t, done } : t));
      return HttpResponse.json(hire);
    },
  ),

  http.get(url('/benefits'), async ({ request }) => {
    const denied = await guard(request);
    if (denied) return denied;
    return HttpResponse.json({
      plans: BENEFIT_PLANS.map((plan) => ({
        ...plan,
        enrolled: enrollments.filter((e) => e.planIds.includes(plan.id)).length,
        eligible: people.length,
      })),
      enrollments,
    });
  }),

  ...hrTrainingHandlers(people),
  ...hrEngagementHandlers,
  ...hrDocumentHandlers(people),
];
