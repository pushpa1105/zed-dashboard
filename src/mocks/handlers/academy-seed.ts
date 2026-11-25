import { networkDelay, requireAuth } from '../utils';

/* -------------------------------------------------------------------------- */
/*  Seed data: an online academy for data, design and engineering courses     */
/* -------------------------------------------------------------------------- */

export function seeded(seed: string) {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Level = 'beginner' | 'intermediate' | 'advanced';
type Category = 'data' | 'design' | 'engineering' | 'product' | 'leadership';
export type LessonType = 'video' | 'reading' | 'quiz' | 'lab';

type Instructor = {
  id: string;
  name: string;
  title: string;
  bio: string;
  topics: string[];
  rating: number;
  students: number;
};

export const INSTRUCTORS: Instructor[] = [
  {
    id: 'i-amara',
    name: 'Amara Okafor',
    title: 'Head of Data, Parcelpoint',
    bio: 'Built the analytics platform behind 40 million monthly shipments. Teaches metric design and warehouse modelling.',
    topics: ['Metrics', 'SQL', 'dbt'],
    rating: 4.9,
    students: 18_420,
  },
  {
    id: 'i-kenji',
    name: 'Kenji Watanabe',
    title: 'Staff Engineer, Lumen Health',
    bio: 'Fifteen years on frontend performance and design systems. Maintainer of two open-source chart libraries.',
    topics: ['React', 'Performance', 'Charts'],
    rating: 4.8,
    students: 22_105,
  },
  {
    id: 'i-ines',
    name: 'Inês Duarte',
    title: 'Principal Product Designer',
    bio: 'Designs data-heavy products for finance teams. Previously led design systems at two fintechs.',
    topics: ['Dashboards', 'Design systems', 'Accessibility'],
    rating: 4.9,
    students: 15_870,
  },
  {
    id: 'i-samuel',
    name: 'Samuel Adeyemi',
    title: 'Director of Analytics Engineering',
    bio: 'Runs a 30-person data team. Writes about data contracts and ownership.',
    topics: ['Data contracts', 'Leadership', 'Python'],
    rating: 4.7,
    students: 9_340,
  },
  {
    id: 'i-hannah',
    name: 'Hannah Morgan',
    title: 'VP Product, Fieldwork',
    bio: 'Product leader who has shipped self-serve analytics to 3,000 B2B customers.',
    topics: ['Product strategy', 'Experimentation'],
    rating: 4.8,
    students: 11_210,
  },
  {
    id: 'i-tomas',
    name: 'Tomás Reyes',
    title: 'Security Engineer',
    bio: 'Focuses on row-level security and multi-tenant data platforms.',
    topics: ['Security', 'Postgres'],
    rating: 4.6,
    students: 6_045,
  },
];

export type CourseSeed = {
  id: string;
  title: string;
  subtitle: string;
  category: Category;
  level: Level;
  instructorId: string;
  price: number;
  color: string;
  tags: string[];
  modules: Array<[string, Array<[string, LessonType, number]>]>;
};

export const COURSES: CourseSeed[] = [
  {
    id: 'data-intensive-dashboards',
    title: 'Designing Data-Intensive Dashboards',
    subtitle:
      'From a question to a dashboard people trust: metrics, layout, charts and performance.',
    category: 'design',
    level: 'intermediate',
    instructorId: 'i-ines',
    price: 149,
    color: 'var(--chart-1)',
    tags: ['Dashboards', 'Data viz', 'UX'],
    modules: [
      [
        'Start with the decision',
        [
          ['Why most dashboards go unused', 'video', 9],
          ['Interview template: the five questions', 'reading', 12],
          ['Mapping decisions to metrics', 'video', 14],
          ['Checkpoint: write your brief', 'quiz', 8],
        ],
      ],
      [
        'Choosing the right chart',
        [
          ['Magnitude, change, part-to-whole', 'video', 16],
          ['When a number beats a chart', 'video', 8],
          ['Color that survives color blindness', 'reading', 10],
          ['Lab: redesign a cluttered report', 'lab', 35],
        ],
      ],
      [
        'Layout and hierarchy',
        [
          ['The one-hero-metric rule', 'video', 11],
          ['Grids, rhythm and density', 'video', 13],
          ['Filters that do not confuse', 'reading', 9],
          ['Quiz: layout critique', 'quiz', 10],
        ],
      ],
      [
        'Shipping and adoption',
        [
          ['Performance budgets for charts', 'video', 15],
          ['Alerts that explain themselves', 'video', 12],
          ['Measuring dashboard usage', 'lab', 30],
        ],
      ],
    ],
  },
  {
    id: 'sql-for-product-analytics',
    title: 'SQL for Product Analytics',
    subtitle: 'Window functions, funnels and retention cohorts on a real product event dataset.',
    category: 'data',
    level: 'beginner',
    instructorId: 'i-amara',
    price: 0,
    color: 'var(--chart-2)',
    tags: ['SQL', 'Cohorts', 'Funnels'],
    modules: [
      [
        'Querying events',
        [
          ['Tables, rows and the events model', 'video', 10],
          ['SELECT, WHERE and GROUP BY', 'video', 18],
          ['Lab: your first 10 queries', 'lab', 25],
        ],
      ],
      [
        'Funnels and conversion',
        [
          ['Ordered steps with window functions', 'video', 21],
          ['Time-boxed conversion', 'reading', 12],
          ['Quiz: funnel edge cases', 'quiz', 10],
        ],
      ],
      [
        'Retention',
        [
          ['Weekly cohorts', 'video', 19],
          ['Rolling vs bounded retention', 'reading', 9],
          ['Lab: build a retention triangle', 'lab', 40],
        ],
      ],
    ],
  },
  {
    id: 'react-performance',
    title: 'React Performance in Practice',
    subtitle:
      'Profile, fix and keep fast: rendering, virtualization, code splitting and charts at scale.',
    category: 'engineering',
    level: 'advanced',
    instructorId: 'i-kenji',
    price: 189,
    color: 'var(--chart-4)',
    tags: ['React', 'Profiling', 'Virtualization'],
    modules: [
      [
        'Measure first',
        [
          ['Reading the React Profiler', 'video', 17],
          ['Interaction to Next Paint', 'video', 14],
          ['Lab: find the slow render', 'lab', 30],
        ],
      ],
      [
        'Rendering less',
        [
          ['Memoization that actually helps', 'video', 19],
          ['State colocation', 'reading', 11],
          ['The React Compiler', 'video', 15],
        ],
      ],
      [
        'Big data on screen',
        [
          ['Virtualizing 100k rows', 'video', 22],
          ['Canvas vs SVG charts', 'video', 16],
          ['Quiz: choose the strategy', 'quiz', 12],
        ],
      ],
    ],
  },
  {
    id: 'metrics-layer',
    title: 'Building a Metrics Layer with dbt',
    subtitle:
      'Define revenue, active users and churn once, version them, and serve every tool from one place.',
    category: 'data',
    level: 'intermediate',
    instructorId: 'i-samuel',
    price: 129,
    color: 'var(--chart-3)',
    tags: ['dbt', 'Semantic layer'],
    modules: [
      [
        'Why a metrics layer',
        [
          ['Three numbers for revenue', 'video', 12],
          ['Ownership and contracts', 'reading', 14],
        ],
      ],
      [
        'Modelling',
        [
          ['Staging, marts and metrics', 'video', 20],
          ['Testing definitions', 'video', 16],
          ['Lab: model MRR', 'lab', 45],
        ],
      ],
      [
        'Serving',
        [
          ['APIs and caching', 'video', 15],
          ['Quiz: metric governance', 'quiz', 10],
        ],
      ],
    ],
  },
  {
    id: 'accessible-data-viz',
    title: 'Accessible Data Visualization',
    subtitle:
      'Charts that work for screen readers, keyboards and color-blind readers without losing clarity.',
    category: 'design',
    level: 'beginner',
    instructorId: 'i-ines',
    price: 79,
    color: 'var(--chart-5)',
    tags: ['Accessibility', 'Charts'],
    modules: [
      [
        'Foundations',
        [
          ['Who we are designing for', 'video', 9],
          ['Contrast and color', 'video', 13],
        ],
      ],
      [
        'Techniques',
        [
          ['Text alternatives and tables', 'reading', 11],
          ['Keyboard and focus in charts', 'video', 14],
          ['Lab: audit a dashboard', 'lab', 30],
        ],
      ],
    ],
  },
  {
    id: 'experimentation',
    title: 'Running Product Experiments',
    subtitle: 'Design A/B tests, size them correctly and make the call without fooling yourself.',
    category: 'product',
    level: 'intermediate',
    instructorId: 'i-hannah',
    price: 119,
    color: 'var(--chart-1)',
    tags: ['A/B testing', 'Statistics'],
    modules: [
      [
        'Designing a test',
        [
          ['Hypotheses that can fail', 'video', 12],
          ['Choosing a primary metric', 'video', 10],
        ],
      ],
      [
        'Statistics without fear',
        [
          ['Sample size and power', 'video', 18],
          ['Peeking and false positives', 'reading', 12],
          ['Quiz: read the results', 'quiz', 12],
        ],
      ],
      [
        'Deciding',
        [
          ['When the result is flat', 'video', 9],
          ['Lab: write the decision memo', 'lab', 25],
        ],
      ],
    ],
  },
  {
    id: 'postgres-rls',
    title: 'Row-Level Security in Postgres',
    subtitle:
      'Multi-tenant data isolation with policies, roles and tests you can trust in production.',
    category: 'engineering',
    level: 'advanced',
    instructorId: 'i-tomas',
    price: 159,
    color: 'var(--chart-2)',
    tags: ['Postgres', 'Security'],
    modules: [
      [
        'Policies',
        [
          ['Roles and policies', 'video', 16],
          ['Tenant isolation patterns', 'video', 18],
        ],
      ],
      [
        'Testing',
        [
          ['Policy test suites', 'lab', 35],
          ['Quiz: spot the leak', 'quiz', 10],
        ],
      ],
    ],
  },
  {
    id: 'leading-data-teams',
    title: 'Leading Data Teams',
    subtitle:
      'Hiring, roadmaps and stakeholder management for new analytics and data engineering leads.',
    category: 'leadership',
    level: 'intermediate',
    instructorId: 'i-samuel',
    price: 99,
    color: 'var(--chart-4)',
    tags: ['Management', 'Roadmaps'],
    modules: [
      [
        'The first 90 days',
        [
          ['Listening tour', 'video', 11],
          ['Picking the first win', 'reading', 9],
        ],
      ],
      [
        'Operating the team',
        [
          ['Intake and prioritization', 'video', 14],
          ['Career ladders', 'reading', 13],
          ['Lab: draft your roadmap', 'lab', 30],
        ],
      ],
    ],
  },
  {
    id: 'python-for-analysts',
    title: 'Python for Analysts',
    subtitle: 'pandas, notebooks and reproducible analysis for people who already know SQL.',
    category: 'data',
    level: 'beginner',
    instructorId: 'i-amara',
    price: 89,
    color: 'var(--chart-3)',
    tags: ['Python', 'pandas'],
    modules: [
      [
        'Getting started',
        [
          ['Notebooks without the mess', 'video', 12],
          ['DataFrames for SQL people', 'video', 19],
        ],
      ],
      [
        'Analysis',
        [
          ['Grouping and reshaping', 'video', 17],
          ['Plotting quickly', 'reading', 10],
          ['Lab: churn analysis', 'lab', 40],
        ],
      ],
    ],
  },
  {
    id: 'design-systems-for-data',
    title: 'Design Systems for Data Products',
    subtitle: 'Tokens, chart components and documentation that keep twenty dashboards consistent.',
    category: 'design',
    level: 'advanced',
    instructorId: 'i-kenji',
    price: 169,
    color: 'var(--chart-5)',
    tags: ['Design systems', 'Tokens'],
    modules: [
      [
        'Tokens',
        [
          ['Color, type and spacing scales', 'video', 15],
          ['Theming and dark mode', 'video', 14],
        ],
      ],
      [
        'Components',
        [
          ['A chart component API', 'video', 20],
          ['Documentation people read', 'reading', 11],
          ['Lab: build a stat card', 'lab', 35],
        ],
      ],
    ],
  },
];

export const authed = async (request: Request) => {
  await networkDelay();
  const auth = requireAuth(request);
  return 'error' in auth ? auth.error : null;
};

export const DAY = 86_400_000;
export const daysFromNow = (days: number) => new Date(Date.now() + days * DAY).toISOString();
export const courseById = (id: string) => COURSES.find((c) => c.id === id)!;
export const pick = <T>(rand: () => number, items: T[]) =>
  items[Math.floor(rand() * items.length)]!;

export const FIRST_NAMES =
  'Ava Liam Mia Noah Zoe Ethan Aisha Mateo Hana Oliver Lucía Yusuf Chloe Arjun Freya Diego Nora Kai'.split(
    ' ',
  );
export const LAST_NAMES =
  'Patel Novak Kim Silva Haddad Larsen Rossi Tanaka Walsh Dubois Ortiz Meyer'.split(' ');
