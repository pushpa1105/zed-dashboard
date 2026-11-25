import { FolderPlus, ListFilter, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { cn } from '@/shared/lib/cn';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

import { DataTableFacetedFilter } from './data-table-faceted-filter';
import {
  OPERATORS,
  countActiveRules,
  createFilterGroup,
  createFilterRule,
  getArity,
  type FilterField,
  type FilterGroup,
  type FilterOperator,
  type FilterRule,
  type FilterValue,
} from './filter-tree';

export type FilterBuilderLabels = {
  trigger: string;
  where: string;
  and: string;
  or: string;
  addRule: string;
  addGroup: string;
  clear: string;
  empty: string;
  value: string;
  min: string;
  max: string;
  choose: string;
};

const DEFAULT_LABELS: FilterBuilderLabels = {
  trigger: 'Filters',
  where: 'Where',
  and: 'and',
  or: 'or',
  addRule: 'Add filter',
  addGroup: 'Add group',
  clear: 'Clear all',
  empty: 'No filters applied. Add one to narrow the results.',
  value: 'Value',
  min: 'Min',
  max: 'Max',
  choose: 'Choose…',
};

type Props = {
  fields: FilterField[];
  value: FilterGroup;
  onChange: (value: FilterGroup) => void;
  labels?: Partial<FilterBuilderLabels>;
};

function ValueInput({
  field,
  rule,
  onChange,
  labels,
}: {
  field: FilterField;
  rule: FilterRule;
  onChange: (value: FilterValue) => void;
  labels: FilterBuilderLabels;
}) {
  const arity = getArity(field.type, rule.operator);
  const inputType = field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text';
  const cast = (v: string) => (field.type === 'number' && v !== '' ? Number(v) : v);

  if (arity === 'none') return <div className="flex-1" />;
  if (arity === 'multi') {
    return (
      <div className="flex-1">
        <DataTableFacetedFilter
          title={labels.choose}
          options={field.options ?? []}
          value={Array.isArray(rule.value) ? rule.value.map(String) : []}
          onChange={(v) => onChange(v)}
        />
      </div>
    );
  }
  if (arity === 'range') {
    const [a = '', b = ''] = Array.isArray(rule.value) ? rule.value : [];
    return (
      <div className="flex flex-1 items-center gap-1.5">
        <Input
          type={inputType}
          aria-label={labels.min}
          placeholder={labels.min}
          className="h-9"
          value={a}
          onChange={(e) => onChange([cast(e.target.value), b])}
        />
        <span className="text-muted-foreground">–</span>
        <Input
          type={inputType}
          aria-label={labels.max}
          placeholder={labels.max}
          className="h-9"
          value={b}
          onChange={(e) => onChange([a, cast(e.target.value)])}
        />
      </div>
    );
  }
  return (
    <Input
      type={inputType}
      aria-label={labels.value}
      placeholder={labels.value}
      className="flex-1"
      value={rule.value === null || Array.isArray(rule.value) ? '' : rule.value}
      onChange={(e) => onChange(cast(e.target.value))}
    />
  );
}

function GroupEditor({
  group,
  fields,
  onChange,
  onRemove,
  labels,
  nested,
}: {
  group: FilterGroup;
  fields: FilterField[];
  onChange: (group: FilterGroup) => void;
  onRemove?: () => void;
  labels: FilterBuilderLabels;
  nested?: boolean;
}) {
  const setRules = (rules: FilterGroup['rules']) => onChange({ ...group, rules });
  const update = (id: string, node: FilterRule | FilterGroup | null) =>
    setRules(
      node === null
        ? group.rules.filter((r) => r.id !== id)
        : group.rules.map((r) => (r.id === id ? node : r)),
    );

  return (
    <div className={cn('space-y-2', nested && 'rounded-lg border border-dashed bg-muted/30 p-2')}>
      {group.rules.length === 0 && !nested && (
        <p className="py-2 text-sm text-muted-foreground">{labels.empty}</p>
      )}
      {group.rules.map((node, index) => (
        <div key={node.id} className="flex items-start gap-2">
          <div className="w-16 shrink-0 pt-1.5 text-right text-xs text-muted-foreground">
            {index === 0 ? (
              labels.where
            ) : index === 1 ? (
              <Select
                value={group.combinator}
                onValueChange={(v) => onChange({ ...group, combinator: v as 'and' | 'or' })}
              >
                <SelectTrigger size="sm" className="h-7 w-16 px-2 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="and">{labels.and}</SelectItem>
                  <SelectItem value="or">{labels.or}</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <span className="inline-block pt-0.5">
                {group.combinator === 'and' ? labels.and : labels.or}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            {node.kind === 'group' ? (
              <GroupEditor
                group={node}
                fields={fields}
                labels={labels}
                nested
                onChange={(g) => update(node.id, g)}
                onRemove={() => update(node.id, null)}
              />
            ) : (
              <RuleEditor
                rule={node}
                fields={fields}
                labels={labels}
                onChange={(r) => update(node.id, r)}
                onRemove={() => update(node.id, null)}
              />
            )}
          </div>
        </div>
      ))}
      <div className={cn('flex items-center gap-1', !nested && 'pt-1')}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fields[0] && setRules([...group.rules, createFilterRule(fields[0])])}
        >
          <Plus /> {labels.addRule}
        </Button>
        {!nested && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const child = createFilterGroup(group.combinator === 'and' ? 'or' : 'and');
              if (fields[0]) child.rules = [createFilterRule(fields[0])];
              setRules([...group.rules, child]);
            }}
          >
            <FolderPlus /> {labels.addGroup}
          </Button>
        )}
        {onRemove && (
          <Button
            variant="ghost"
            size="icon-sm"
            className="ml-auto"
            onClick={onRemove}
            aria-label="Remove group"
          >
            <Trash2 />
          </Button>
        )}
      </div>
    </div>
  );
}

function RuleEditor({
  rule,
  fields,
  onChange,
  onRemove,
  labels,
}: {
  rule: FilterRule;
  fields: FilterField[];
  onChange: (rule: FilterRule) => void;
  onRemove: () => void;
  labels: FilterBuilderLabels;
}) {
  const field = fields.find((f) => f.id === rule.field) ?? fields[0]!;
  return (
    <div className="flex flex-wrap items-center gap-1.5 sm:flex-nowrap">
      <Select
        value={field.id}
        onValueChange={(id) => {
          const next = fields.find((f) => f.id === id)!;
          onChange({ ...createFilterRule(next), id: rule.id });
        }}
      >
        <SelectTrigger size="sm" className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {fields.map((f) => (
            <SelectItem key={f.id} value={f.id}>
              {f.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={rule.operator}
        onValueChange={(op) => {
          const operator = op as FilterOperator;
          const sameArity = getArity(field.type, operator) === getArity(field.type, rule.operator);
          onChange({ ...rule, operator, value: sameArity ? rule.value : null });
        }}
      >
        <SelectTrigger size="sm" className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {OPERATORS[field.type].map((op) => (
            <SelectItem key={op.value} value={op.value}>
              {op.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <ValueInput
        field={field}
        rule={rule}
        labels={labels}
        onChange={(value) => onChange({ ...rule, value })}
      />
      <Button variant="ghost" size="icon-sm" onClick={onRemove} aria-label="Remove filter">
        <Trash2 />
      </Button>
    </div>
  );
}

/**
 * Notion/Linear-style filter builder in a popover: field → operator (by field
 * type) → value, combined with AND/OR, with one level of nested groups. The
 * value is a plain JSON tree (see `filter-tree.ts`), so it can be stored in
 * the URL, saved as a view or sent to a server.
 */
export function AdvancedFilterBuilder({ fields, value, onChange, labels: overrides }: Props) {
  const labels = { ...DEFAULT_LABELS, ...overrides };
  const [open, setOpen] = useState(false);
  const active = countActiveRules(value, fields);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <ListFilter /> {labels.trigger}
          {active > 0 && (
            <Badge className="ml-0.5 h-4.5 min-w-4.5 rounded-full px-1 tabular-nums">
              {active}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(40rem,calc(100vw-2rem))] p-3">
        <GroupEditor group={value} fields={fields} labels={labels} onChange={onChange} />
        {value.rules.length > 0 && (
          <div className="mt-2 flex justify-end border-t pt-2">
            <Button variant="ghost" size="sm" onClick={() => onChange({ ...value, rules: [] })}>
              {labels.clear}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
