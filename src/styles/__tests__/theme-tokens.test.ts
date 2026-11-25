/**
 * Every color must come from a design token (docs/theming.md), so modes,
 * presets and a custom brand color reach the whole UI. A real exception
 * (third-party logo, print stylesheet) needs a `theme-exempt: <reason>`
 * comment; it covers its own line and the statement that follows.
 */
const sources = import.meta.glob<string>(
  ['/src/**/*.{ts,tsx}', '!**/__tests__/**', '!**/*.d.ts', '!/src/core/theme/**'],
  { query: '?raw', import: 'default', eager: true },
);

const PALETTE =
  'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black';
const UTILITY =
  'bg|text|border(?:-[trblxy])?|from|via|to|ring|fill|stroke|outline|shadow|divide|decoration|placeholder|caret|accent';

const FORBIDDEN = [
  new RegExp(`(?<![\\w-])(?:${UTILITY})-(?:${PALETTE})(?:-\\d{2,3})?(?:/[\\d.[\\]]+)?(?![\\w-])`),
  /#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3})\b(?!-)/i,
  /\b(?:oklch|rgba?|hsla?)\(\s*[\d.]/,
];

const count = (line: string, re: RegExp) => line.match(re)?.length ?? 0;

function exemptLines(lines: string[]) {
  const exempt = new Set<number>();
  lines.forEach((line, i) => {
    if (!line.includes('theme-exempt:')) return;
    exempt.add(i);
    for (let j = i + 1, depth = 0; j < lines.length; j++) {
      exempt.add(j);
      depth += count(lines[j]!, /[[{(]/g) - count(lines[j]!, /[\]})]/g);
      if (depth <= 0) break;
    }
  });
  return exempt;
}

it('uses design tokens for every color', () => {
  const problems = Object.entries(sources).flatMap(([file, source]) => {
    const lines = source.split(/\r?\n/);
    const exempt = exemptLines(lines);
    return lines.flatMap((line, i) => {
      if (exempt.has(i)) return [];
      const code = line.replace(/https?:\/\/\S+/g, '');
      const match = FORBIDDEN.map((re) => code.match(re)?.[0]).find(Boolean);
      return match ? [`${file}:${i + 1}  ${match}`] : [];
    });
  });

  expect(Object.keys(sources).length).toBeGreaterThan(100);
  expect(problems, problems.join('\n')).toEqual([]);
});
