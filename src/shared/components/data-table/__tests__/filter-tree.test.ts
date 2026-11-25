import {
  applyFilterTree,
  countActiveRules,
  pruneFilterTree,
  type FilterField,
  type FilterGroup,
} from '../filter-tree';

type Order = { name: string; total: number; status: string; date: string };

const rows: Order[] = [
  { name: 'Ada Lovelace', total: 120, status: 'paid', date: '2026-01-10T09:00:00Z' },
  { name: 'Alan Turing', total: 40, status: 'pending', date: '2026-02-01T12:00:00Z' },
  { name: 'Grace Hopper', total: 300, status: 'refunded', date: '2026-03-15T08:30:00Z' },
  { name: 'Linus T', total: 75, status: 'paid', date: '2026-03-20T10:00:00Z' },
];

const fields: FilterField[] = [
  { id: 'name', label: 'Name', type: 'text' },
  { id: 'total', label: 'Total', type: 'number' },
  { id: 'status', label: 'Status', type: 'enum' },
  { id: 'date', label: 'Date', type: 'date' },
];

const group = (combinator: 'and' | 'or', rules: FilterGroup['rules']): FilterGroup => ({
  kind: 'group',
  id: `g-${combinator}`,
  combinator,
  rules,
});

describe('applyFilterTree', () => {
  it('returns the input untouched when no rule is complete', () => {
    const tree = group('and', [
      { kind: 'rule', id: 'r1', field: 'name', operator: 'contains', value: '' },
    ]);
    expect(applyFilterTree(rows, tree, fields)).toBe(rows);
    expect(countActiveRules(tree, fields)).toBe(0);
  });

  it('combines text, number and enum rules with AND', () => {
    const tree = group('and', [
      { kind: 'rule', id: 'r1', field: 'name', operator: 'startsWith', value: 'a' },
      { kind: 'rule', id: 'r2', field: 'total', operator: 'gt', value: 50 },
      { kind: 'rule', id: 'r3', field: 'status', operator: 'isAnyOf', value: ['paid'] },
    ]);
    expect(applyFilterTree(rows, tree, fields).map((r) => r.name)).toEqual(['Ada Lovelace']);
  });

  it('supports OR, ranges, dates and a nested group', () => {
    const tree = group('or', [
      { kind: 'rule', id: 'r1', field: 'total', operator: 'between', value: [70, 80] },
      group('and', [
        { kind: 'rule', id: 'r2', field: 'date', operator: 'after', value: '2026-03-01' },
        { kind: 'rule', id: 'r3', field: 'status', operator: 'isNoneOf', value: ['paid'] },
      ]),
    ]);
    expect(applyFilterTree(rows, tree, fields).map((r) => r.name)).toEqual([
      'Grace Hopper',
      'Linus T',
    ]);
    expect(countActiveRules(tree, fields)).toBe(3);
  });

  it('prunes incomplete rules and empty groups', () => {
    const tree = group('and', [
      { kind: 'rule', id: 'r1', field: 'name', operator: 'isEmpty', value: null },
      { kind: 'rule', id: 'r2', field: 'total', operator: 'eq', value: null },
      group('or', [{ kind: 'rule', id: 'r3', field: 'date', operator: 'before', value: '' }]),
    ]);
    expect(pruneFilterTree(tree, fields).rules.map((r) => r.id)).toEqual(['r1']);
  });
});
