import { ChevronRight, ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';

import { cn } from '@/shared/lib/cn';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';

import type { TreeNode } from './tree-select';
import { useControllableState } from './use-controllable-state';

export type CascaderProps = {
  data: TreeNode[];
  /** Path of values from root to the chosen leaf. */
  value?: string[];
  defaultValue?: string[];
  onChange?: (path: string[]) => void;
  placeholder?: string;
  /** Allow picking a non-leaf node. */
  changeOnSelect?: boolean;
  separator?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
};

/**
 * Column-by-column picker for deep hierarchies (country → region → city,
 * category → subcategory). Each level opens in a new column.
 */
export function Cascader({
  data,
  value: valueProp,
  defaultValue = [],
  onChange,
  placeholder = 'Select…',
  changeOnSelect,
  separator = ' / ',
  disabled,
  id,
  className,
}: CascaderProps) {
  const [value, setValue] = useControllableState({ value: valueProp, defaultValue, onChange });
  const [open, setOpen] = useState(false);
  const [path, setPath] = useState<string[]>(value);

  const columns: TreeNode[][] = [data];
  let level = data;
  for (const v of path) {
    const node = level.find((n) => n.value === v);
    if (!node?.children?.length) break;
    columns.push(node.children);
    level = node.children;
  }

  const labelPath = (() => {
    const labels: string[] = [];
    let nodes = data;
    for (const v of value) {
      const node = nodes.find((n) => n.value === v);
      if (!node) break;
      labels.push(node.label);
      nodes = node.children ?? [];
    }
    return labels;
  })();

  const pick = (depth: number, node: TreeNode) => {
    const next = [...path.slice(0, depth), node.value];
    setPath(next);
    if (!node.children?.length) {
      setValue(next);
      setOpen(false);
    } else if (changeOnSelect) {
      setValue(next);
    }
  };

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setPath(value);
      }}
    >
      <PopoverTrigger asChild disabled={disabled}>
        <button
          id={id}
          type="button"
          className={cn(
            'flex h-9 w-full items-center gap-2 rounded-lg border border-input bg-transparent px-3 text-left text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30',
            className,
          )}
        >
          <span className={cn('flex-1 truncate', !labelPath.length && 'text-muted-foreground')}>
            {labelPath.length ? labelPath.join(separator) : placeholder}
          </span>
          <ChevronsUpDown className="size-3.5 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="flex w-auto max-w-[calc(100vw-2rem)] overflow-x-auto p-0"
      >
        {columns.map((nodes, depth) => (
          <ul
            key={depth}
            role="listbox"
            className="max-h-72 w-44 shrink-0 overflow-y-auto border-r p-1 last:border-r-0"
          >
            {nodes.map((node) => {
              const active = path[depth] === node.value;
              return (
                <li key={node.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => pick(depth, node)}
                    className={cn(
                      'flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-sm hover:bg-muted',
                      active && 'bg-accent font-medium text-accent-foreground',
                    )}
                  >
                    <span className="flex-1 truncate">{node.label}</span>
                    {node.children?.length ? (
                      <ChevronRight className="size-3.5 text-muted-foreground" />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        ))}
      </PopoverContent>
    </Popover>
  );
}
