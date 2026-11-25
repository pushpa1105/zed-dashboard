/**
 * Advanced filter model: a serializable tree of rules combined with AND/OR.
 * The same JSON is evaluated on the client (`applyFilterTree`) or sent to a
 * server as a query parameter. Pure functions only: no React here.
 */

export type FilterFieldType = 'text' | 'number' | 'date' | 'enum';

export type FilterField = {
  id: string;
  label: string;
  type: FilterFieldType;
  /** Choices for `enum` fields. */
  options?: Array<{ label: string; value: string }>;
};

export type FilterOperator =
  | 'contains'
  | 'equals'
  | 'startsWith'
  | 'endsWith'
  | 'isEmpty'
  | 'isNotEmpty'
  | 'eq'
  | 'neq'
  | 'gt'
  | 'lt'
  | 'between'
  | 'before'
  | 'after'
  | 'isAnyOf'
  | 'isNoneOf';

/** How many values an operator takes: none, one, a [min, max] pair, or a list. */
export type OperatorArity = 'none' | 'single' | 'range' | 'multi';

export type FilterValue = string | number | Array<string | number> | null;

export type FilterRule = {
  kind: 'rule';
  id: string;
  field: string;
  operator: FilterOperator;
  value: FilterValue;
};

export type FilterGroup = {
  kind: 'group';
  id: string;
  combinator: 'and' | 'or';
  rules: Array<FilterRule | FilterGroup>;
};

export const OPERATORS: Record<
  FilterFieldType,
  Array<{ value: FilterOperator; label: string; arity: OperatorArity }>
> = {
  text: [
    { value: 'contains', label: 'contains', arity: 'single' },
    { value: 'equals', label: 'is', arity: 'single' },
    { value: 'startsWith', label: 'starts with', arity: 'single' },
    { value: 'endsWith', label: 'ends with', arity: 'single' },
    { value: 'isEmpty', label: 'is empty', arity: 'none' },
    { value: 'isNotEmpty', label: 'is not empty', arity: 'none' },
  ],
  number: [
    { value: 'eq', label: '=', arity: 'single' },
    { value: 'neq', label: '≠', arity: 'single' },
    { value: 'gt', label: '>', arity: 'single' },
    { value: 'lt', label: '<', arity: 'single' },
    { value: 'between', label: 'between', arity: 'range' },
  ],
  date: [
    { value: 'before', label: 'before', arity: 'single' },
    { value: 'after', label: 'after', arity: 'single' },
    { value: 'between', label: 'between', arity: 'range' },
  ],
  enum: [
    { value: 'isAnyOf', label: 'is any of', arity: 'multi' },
    { value: 'isNoneOf', label: 'is none of', arity: 'multi' },
  ],
};

let counter = 0;
const nextId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${(counter++).toString(36)}`;

export const createFilterGroup = (combinator: 'and' | 'or' = 'and'): FilterGroup => ({
  kind: 'group',
  id: nextId('g'),
  combinator,
  rules: [],
});

export function createFilterRule(field: FilterField): FilterRule {
  const [first] = OPERATORS[field.type];
  return { kind: 'rule', id: nextId('r'), field: field.id, operator: first!.value, value: null };
}

export const getArity = (type: FilterFieldType, operator: FilterOperator): OperatorArity =>
  OPERATORS[type].find((o) => o.value === operator)?.arity ?? 'single';

const isBlank = (v: unknown) => v === null || v === undefined || v === '';

/** A rule only filters once its value is filled in (or its operator needs none). */
export function isRuleComplete(rule: FilterRule, field: FilterField | undefined): boolean {
  if (!field) return false;
  const arity = getArity(field.type, rule.operator);
  if (arity === 'none') return true;
  if (arity === 'range')
    return (
      Array.isArray(rule.value) && rule.value.length === 2 && rule.value.every((v) => !isBlank(v))
    );
  if (arity === 'multi') return Array.isArray(rule.value) && rule.value.length > 0;
  return !isBlank(rule.value);
}

/** Number of complete rules in the tree (for a "Filters · 3" badge). */
export function countActiveRules(group: FilterGroup, fields: FilterField[]): number {
  return group.rules.reduce(
    (count, node) =>
      count +
      (node.kind === 'group'
        ? countActiveRules(node, fields)
        : isRuleComplete(
              node,
              fields.find((f) => f.id === node.field),
            )
          ? 1
          : 0),
    0,
  );
}

const day = (value: unknown) => String(value ?? '').slice(0, 10);

function matchRule(raw: unknown, rule: FilterRule, field: FilterField): boolean {
  const { operator, value } = rule;
  switch (field.type) {
    case 'text': {
      const text = String(raw ?? '').toLowerCase();
      const query = String(value ?? '').toLowerCase();
      if (operator === 'isEmpty') return text.trim() === '';
      if (operator === 'isNotEmpty') return text.trim() !== '';
      if (operator === 'equals') return text === query;
      if (operator === 'startsWith') return text.startsWith(query);
      if (operator === 'endsWith') return text.endsWith(query);
      return text.includes(query);
    }
    case 'number': {
      const n = Number(raw);
      if (operator === 'between') {
        const [min, max] = (value as Array<string | number>).map(Number) as [number, number];
        return n >= min && n <= max;
      }
      const target = Number(value);
      if (operator === 'neq') return n !== target;
      if (operator === 'gt') return n > target;
      if (operator === 'lt') return n < target;
      return n === target;
    }
    case 'date': {
      const d = day(raw);
      if (operator === 'between') {
        const [from, to] = (value as Array<string | number>).map(day) as [string, string];
        return d >= from && d <= to;
      }
      return operator === 'before' ? d < day(value) : d > day(value);
    }
    case 'enum': {
      const list = (value as Array<string | number>).map(String);
      const hit = list.includes(String(raw));
      return operator === 'isNoneOf' ? !hit : hit;
    }
  }
}

/** True when `row` satisfies `group`. Incomplete rules and empty groups match everything. */
export function matchesFilterTree<T>(
  row: T,
  group: FilterGroup,
  fields: FilterField[],
  getValue: (row: T, fieldId: string) => unknown = (r, id) => (r as Record<string, unknown>)[id],
): boolean {
  const results: boolean[] = [];
  for (const node of group.rules) {
    if (node.kind === 'group') {
      if (countActiveRules(node, fields) === 0) continue;
      results.push(matchesFilterTree(row, node, fields, getValue));
      continue;
    }
    const field = fields.find((f) => f.id === node.field);
    if (!field || !isRuleComplete(node, field)) continue;
    results.push(matchRule(getValue(row, field.id), node, field));
  }
  if (results.length === 0) return true;
  return group.combinator === 'and' ? results.every(Boolean) : results.some(Boolean);
}

/** Client-side filtering with a filter tree. Returns `rows` itself when nothing is active. */
export function applyFilterTree<T>(
  rows: T[],
  group: FilterGroup,
  fields: FilterField[],
  getValue?: (row: T, fieldId: string) => unknown,
): T[] {
  if (countActiveRules(group, fields) === 0) return rows;
  return rows.filter((row) => matchesFilterTree(row, group, fields, getValue));
}

/** Drops incomplete rules and empty groups: compact JSON for URLs and requests. */
export function pruneFilterTree(group: FilterGroup, fields: FilterField[]): FilterGroup {
  return {
    ...group,
    rules: group.rules.flatMap((node): Array<FilterRule | FilterGroup> => {
      if (node.kind === 'group') {
        const pruned = pruneFilterTree(node, fields);
        return pruned.rules.length ? [pruned] : [];
      }
      return isRuleComplete(
        node,
        fields.find((f) => f.id === node.field),
      )
        ? [node]
        : [];
    }),
  };
}
