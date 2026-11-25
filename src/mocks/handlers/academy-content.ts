/** Static copy for the academy mocks: quiz questions, forum threads and grading feedback. */

export const FEEDBACK = [
  'Clear structure and a convincing argument. Tighten the summary and this is excellent.',
  'Good work. The second section needs evidence from the data, not just opinion.',
  'You covered the requirements, but the trade-offs are missing. See lesson 3 again.',
  'Strong submission. The before/after comparison was the highlight.',
];

type QuizSeed = [prompt: string, options: string[], answer: number, explanation: string];

export const QUIZ_BANK = {
  data: [
    [
      'Which clause filters rows after aggregation?',
      ['WHERE', 'HAVING', 'GROUP BY', 'ORDER BY'],
      1,
      'HAVING filters groups. WHERE runs before rows are aggregated.',
    ],
    [
      'A weekly retention cohort groups users by…',
      ['The week they signed up', 'The week they were last seen', 'Their plan', 'Their country'],
      0,
      'A cohort is fixed by the first event and tracked forward from there.',
    ],
    [
      'Which window function numbers rows with no gaps or ties?',
      ['RANK()', 'DENSE_RANK()', 'ROW_NUMBER()', 'NTILE()'],
      2,
      'ROW_NUMBER() always returns 1, 2, 3… even when values tie.',
    ],
    [
      'Why define a metric once in a metrics layer?',
      [
        'Queries run faster',
        'Every tool reports the same number',
        'Tests are no longer needed',
        'It replaces the warehouse',
      ],
      1,
      'One definition prevents three different versions of revenue.',
    ],
    [
      'Step conversion in a funnel is computed over…',
      [
        'All users',
        'Users who reached the previous step',
        'Users who reached the last step',
        'Daily active users',
      ],
      1,
      'Each step is relative to the one before it.',
    ],
  ],
  design: [
    [
      'Which chart best shows one metric changing over time?',
      ['Pie chart', 'Line chart', 'Treemap', 'Scatter plot'],
      1,
      'Lines make trend and slope easy to read.',
    ],
    [
      'The “one hero metric” rule means…',
      [
        'Show only one chart',
        'Give the most important number the most visual weight',
        'Use a single color',
        'Hide secondary metrics',
      ],
      1,
      'Secondary metrics stay, but the eye should land on the hero first.',
    ],
    [
      'Minimum WCAG AA contrast for body text is…',
      ['3:1', '4.5:1', '7:1', '2:1'],
      1,
      '4.5:1 for body text; 3:1 for large text and UI components.',
    ],
    [
      'Why avoid encoding meaning with color alone?',
      [
        'Colors print badly',
        'Color-blind readers may miss it',
        'It slows rendering',
        'Browsers render colors differently',
      ],
      1,
      'Pair color with a label, shape or position.',
    ],
    [
      'When does a single number beat a chart?',
      [
        'When readers need the current value, not the trend',
        'Always',
        'With many categories',
        'Never',
      ],
      0,
      'If the decision depends on “where are we now”, show the number.',
    ],
  ],
  engineering: [
    [
      'What does React.memo skip?',
      ['Effects', 'Re-rendering when props are shallowly equal', 'State updates', 'Mounting'],
      1,
      'memo compares props and skips the render when nothing changed.',
    ],
    [
      'Interaction to Next Paint measures…',
      [
        'Time to first byte',
        'Delay from an input to the next frame',
        'Bundle size',
        'Layout shift',
      ],
      1,
      'INP captures how quickly the page responds to user input.',
    ],
    [
      'Virtualizing a 100k-row list means…',
      [
        'Rendering rows on the server',
        'Rendering only the rows in view',
        'Paginating the API',
        'Drawing rows on a canvas',
      ],
      1,
      'Only visible rows (plus a small buffer) are in the DOM.',
    ],
    [
      'A Postgres row-level security policy is evaluated…',
      ['Once per session', 'For each row a query touches', 'Only on INSERT', 'Only for superusers'],
      1,
      'Policies act as an implicit WHERE clause on every row.',
    ],
    [
      'What usually renders 50k chart points fastest?',
      ['SVG', 'Canvas', 'DOM elements', 'An HTML table'],
      1,
      'Canvas draws pixels without creating a node per point.',
    ],
  ],
  product: [
    [
      'A good experiment hypothesis…',
      [
        'Can be proven wrong',
        'Has no metric',
        'Targets a vanity metric',
        'Is written after launch',
      ],
      0,
      'If no result could disprove it, it is not a hypothesis.',
    ],
    [
      'Stopping a test the first day it looks significant…',
      ['Inflates false positives', 'Is best practice', 'Reduces bias', 'Has no effect'],
      0,
      'Repeated peeking raises the chance of a fluke win.',
    ],
    [
      'Sample size depends mostly on…',
      ['Baseline rate and minimum detectable effect', 'Team size', 'The test name', 'The weekday'],
      0,
      'Smaller effects and rarer events need more users.',
    ],
    [
      'A flat result means…',
      [
        'The change does nothing',
        'No effect of the size you powered for was detected',
        'Ship it anyway',
        'Rerun until positive',
      ],
      1,
      'Absence of evidence is not evidence of absence.',
    ],
  ],
  leadership: [
    [
      'The main goal of a listening tour is to…',
      [
        'Announce your roadmap',
        'Understand stakeholders’ decisions and pain',
        'Start hiring',
        'Audit the code',
      ],
      1,
      'Listen first; the roadmap comes from what you hear.',
    ],
    [
      'A good first win is…',
      [
        'Large and risky',
        'Small, visible and valuable to a stakeholder',
        'Internal tooling nobody sees',
        'A rewrite',
      ],
      1,
      'Early trust comes from delivering something people notice.',
    ],
    [
      'Career ladders help by…',
      [
        'Making expectations explicit per level',
        'Setting salaries automatically',
        'Replacing one-on-ones',
        'Ranking people',
      ],
      0,
      'People grow faster when they know what “next level” looks like.',
    ],
    [
      'An intake process exists to…',
      [
        'Say no to everything',
        'Make priorities and trade-offs visible',
        'Slow requests down',
        'Track hours',
      ],
      1,
      'Visible trade-offs make prioritization a shared decision.',
    ],
  ],
} satisfies Record<string, QuizSeed[]>;

export const THREAD_SEEDS: Array<[courseId: string, title: string, body: string]> = [
  [
    'data-intensive-dashboards',
    'How many KPIs belong above the fold?',
    'Our exec dashboard has eleven KPIs in the first row. The lesson suggests one hero metric, but leadership insists on seeing everything at once. How do you negotiate this?',
  ],
  [
    'sql-for-product-analytics',
    'Funnel counts differ from our analytics tool',
    'My window-function funnel shows 18% conversion from signup to activation, but our analytics tool says 24% for the same date range. Where should I look first?',
  ],
  [
    'react-performance',
    'useMemo made my table slower?',
    'After wrapping every column definition in useMemo, the profiler shows longer commits. Is the comparison itself the cost, or am I measuring wrong?',
  ],
  [
    'metrics-layer',
    'Where should the churn definition live?',
    'Finance and product define churn differently. Should the metrics layer hold both definitions under different names, or force one?',
  ],
  [
    'accessible-data-viz',
    'Screen reader order for a chart with a legend',
    'Should the legend be read before or after the data table alternative? VoiceOver reads the legend as a list, which feels noisy.',
  ],
  [
    'data-intensive-dashboards',
    'Lab 2: is a sparkline enough for a weekly trend?',
    'For the cluttered report lab I replaced three line charts with sparklines next to each number. Am I losing too much information?',
  ],
  [
    'sql-for-product-analytics',
    'Rolling or bounded retention for a weekly product?',
    'Our product is used weekly, not daily. Which retention definition fits better, and how do you explain the difference to stakeholders?',
  ],
  [
    'react-performance',
    'Virtualized rows lose keyboard focus',
    'Keyboard users lose focus when the focused row scrolls out of view and unmounts. What is the recommended pattern?',
  ],
  [
    'accessible-data-viz',
    'Textures or direct labels instead of color?',
    'For a stacked bar chart with five series, would you add textures, direct labels, or both? Textures look busy in our design system.',
  ],
  [
    'metrics-layer',
    'Testing metric definitions in CI',
    'What do you assert in tests for a metric like MRR? Row counts feel too weak and exact values change every day.',
  ],
];

export const STUDENT_REPLIES = [
  'Same question here, following this thread.',
  'We solved this by agreeing on one owner per metric and writing the decision down in the repo.',
  'Compare raw event counts per day first. It usually points to a timezone or deduplication difference.',
  'I hit this in the lab too. Splitting it into two smaller views helped a lot.',
  'The module 2 resources have an example that is very close to this.',
];
export const INSTRUCTOR_REPLIES = [
  'Good question. Start from the decision the reader has to make and keep only what changes it. Everything else can move to a drill-down.',
  'Check the definition first, then the data. Usually one side applies a filter or a time window that the other does not.',
  'There is no single rule: measure before and after with the same workload. If the change does not show up in the profiler, revert it.',
];
