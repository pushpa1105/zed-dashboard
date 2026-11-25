import { cn } from '@/shared/lib/cn';

import { CopyButton } from './copy-button';

export type CodeBlockProps = {
  code: string;
  /** Shown in the header (e.g. "tsx", "bash", a file name). */
  title?: string;
  lineNumbers?: boolean;
  /** 1-based line numbers to highlight. */
  highlight?: number[];
  className?: string;
};

/** Read-only code snippet with copy button and optional line numbers. No syntax library. */
export function CodeBlock({
  code,
  title,
  lineNumbers = true,
  highlight = [],
  className,
}: CodeBlockProps) {
  const lines = code.replace(/\n$/, '').split('\n');

  return (
    <div className={cn('overflow-hidden rounded-lg border bg-muted/40', className)}>
      <div className="flex h-9 items-center justify-between border-b bg-muted/60 pr-1 pl-3">
        <span className="font-mono text-xs text-muted-foreground">{title}</span>
        <CopyButton value={code} />
      </div>
      <pre className="overflow-x-auto py-3 font-mono text-[0.8rem] leading-6">
        <code className="grid">
          {lines.map((line, i) => (
            <span
              key={i}
              className={cn(
                'flex px-3',
                highlight.includes(i + 1) && 'bg-primary/10 shadow-[inset_2px_0_0_var(--primary)]',
              )}
            >
              {lineNumbers && (
                <span className="mr-4 inline-block w-6 shrink-0 text-right text-muted-foreground/60 select-none">
                  {i + 1}
                </span>
              )}
              <span className="whitespace-pre">{line || ' '}</span>
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}
