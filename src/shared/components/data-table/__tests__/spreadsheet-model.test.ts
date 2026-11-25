import {
  applyPaste,
  clearRange,
  coerce,
  columnLetter,
  parseTsv,
  toTsv,
  type SheetColumn,
} from '../spreadsheet-model';
import { parentIds, rollUp, type TreeRow } from '../tree-data';

type Row = {
  id: string;
  item: string;
  qty: number | null;
  price: number | null;
  ok: boolean;
  kind: string;
};

const columns: SheetColumn<Row>[] = [
  { key: 'item', label: 'Item', type: 'text' },
  { key: 'qty', label: 'Qty', type: 'number' },
  { key: 'price', label: 'Price', type: 'number' },
  { key: 'id', label: 'Total', type: 'formula', compute: (r) => (r.qty ?? 0) * (r.price ?? 0) },
  { key: 'ok', label: 'OK', type: 'checkbox' },
  { key: 'kind', label: 'Kind', type: 'select', options: ['Hardware', 'Software'] },
];

const rows: Row[] = [
  { id: 'a', item: 'Laptop', qty: 2, price: 1200, ok: true, kind: 'Hardware' },
  { id: 'b', item: 'License', qty: 10, price: 49, ok: false, kind: 'Software' },
];

const range = (r1: number, c1: number, r2: number, c2: number) => ({
  anchor: { row: r1, col: c1 },
  focus: { row: r2, col: c2 },
});

describe('spreadsheet model', () => {
  it('copies a range as TSV, including computed and boolean cells', () => {
    expect(toTsv(rows, columns, range(0, 0, 1, 4))).toBe(
      'Laptop\t2\t1200\t2400\tTRUE\nLicense\t10\t49\t490\tFALSE',
    );
  });

  it('parses clipboard text with CRLF and a trailing newline', () => {
    expect(parseTsv('a\tb\r\nc\td\r\n')).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ]);
  });

  it('coerces typed text per column type', () => {
    expect(coerce('$1,250.50', columns[1]!)).toBe(1250.5);
    expect(coerce('(30)', columns[1]!)).toBe(-30);
    expect(coerce('abc', columns[1]!)).toBeUndefined();
    expect(coerce('yes', columns[4]!)).toBe(true);
    expect(coerce('software', columns[5]!)).toBe('Software');
    expect(coerce('Gadget', columns[5]!)).toBeUndefined();
  });

  it('pastes a grid, skipping formula columns and invalid values', () => {
    const { rows: next, written } = applyPaste(rows, columns, range(0, 1, 0, 1), [
      ['5', '99', '1', 'no'],
      ['x', '20'],
    ]);
    expect(next[0]).toMatchObject({ qty: 5, price: 99, ok: false });
    expect(next[1]).toMatchObject({ qty: 10, price: 20 });
    expect(written).toBe(4);
    expect(rows[0]!.qty).toBe(2); // input untouched
  });

  it('fills a whole selection when pasting a single value', () => {
    const { rows: next } = applyPaste(rows, columns, range(0, 1, 1, 2), [['7']]);
    expect(next.map((r) => [r.qty, r.price])).toEqual([
      [7, 7],
      [7, 7],
    ]);
  });

  it('clears editable cells only', () => {
    const next = clearRange(rows, columns, range(0, 0, 0, 5));
    expect(next[0]).toMatchObject({ item: '', qty: null, price: null, ok: false, kind: '' });
  });

  it('names columns like a spreadsheet', () => {
    expect([0, 25, 26, 27, 701].map(columnLetter)).toEqual(['A', 'Z', 'AA', 'AB', 'ZZ']);
  });
});

describe('tree helpers', () => {
  type Budget = { name: string; budget: number; actual: number };
  const tree: TreeRow<Budget>[] = [
    {
      id: 'eng',
      name: 'Engineering',
      budget: 0,
      actual: 0,
      children: [
        { id: 'web', name: 'Web', budget: 100, actual: 90 },
        {
          id: 'infra',
          name: 'Infra',
          budget: 0,
          actual: 0,
          children: [{ id: 'sre', name: 'SRE', budget: 50, actual: 70 }],
        },
      ],
    },
  ];

  it('rolls numeric fields up to every parent', () => {
    const [eng] = rollUp(tree, ['budget', 'actual']);
    expect(eng).toMatchObject({ budget: 150, actual: 160 });
    expect(eng!.children![1]).toMatchObject({ budget: 50, actual: 70 });
  });

  it('lists parent ids for expand-all', () => {
    expect(parentIds(tree)).toEqual(['eng', 'infra']);
  });
});
