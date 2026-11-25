import {
  Bold,
  Heading2,
  Italic,
  Link2,
  List,
  ListOrdered,
  Pilcrow,
  Quote,
  Redo2,
  Strikethrough,
  Underline,
  Undo2,
  Unlink,
  type LucideIcon,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { cn } from '@/shared/lib/cn';
import { Separator } from '@/shared/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';

type Command = {
  id: string;
  icon: LucideIcon;
  label: string;
  run: () => void;
  /** Used to highlight the button for the current selection. */
  state?: string;
};

export type RichTextEditorProps = {
  /** HTML string. Read once on mount (the editor owns its DOM afterwards). */
  defaultValue?: string;
  onChange?: (html: string, text: string) => void;
  placeholder?: string;
  /** Soft limit shown in the footer counter. */
  maxLength?: number;
  minHeight?: number;
  disabled?: boolean;
  /** Toolbar labels (for i18n). Keys: bold, italic, underline, strike, heading, paragraph, quote, bullet, ordered, link, unlink, undo, redo, linkPrompt. */
  labels?: Partial<Record<string, string>>;
  className?: string;
  id?: string;
};

const DEFAULT_LABELS: Record<string, string> = {
  bold: 'Bold',
  italic: 'Italic',
  underline: 'Underline',
  strike: 'Strikethrough',
  heading: 'Heading',
  paragraph: 'Paragraph',
  quote: 'Quote',
  bullet: 'Bulleted list',
  ordered: 'Numbered list',
  link: 'Add link',
  unlink: 'Remove link',
  undo: 'Undo',
  redo: 'Redo',
  linkPrompt: 'Link URL',
};

/* `execCommand` is deprecated but still the only dependency-free way to edit
 * rich text with native undo; it is fine for notes, comments and descriptions.
 * Swap in a real editor (Tiptap, Lexical) for documents. */
const exec = (command: string, value?: string) => document.execCommand(command, false, value);

/**
 * Lightweight WYSIWYG editor: bold/italic/underline/strike, heading,
 * quote, lists, links, undo/redo, keyboard shortcuts (Ctrl+B/I/U) and a
 * character counter. Emits HTML and plain text.
 */
export function RichTextEditor({
  defaultValue = '',
  onChange,
  placeholder,
  maxLength,
  minHeight = 160,
  disabled,
  labels: labelsProp,
  className,
  id,
}: RichTextEditorProps) {
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<Set<string>>(new Set());
  const [length, setLength] = useState(0);
  const [empty, setEmpty] = useState(!defaultValue);

  useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = defaultValue;
      // textContent (not innerText) so it also works outside a layout engine.
      setLength((ref.current.textContent ?? '').trim().length);
    }
    // Read the initial HTML once; the editor owns its DOM afterwards.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshState = useCallback(() => {
    const el = ref.current;
    if (!el || !el.contains(document.getSelection()?.anchorNode ?? null)) return;
    const next = new Set<string>();
    for (const cmd of [
      'bold',
      'italic',
      'underline',
      'strikeThrough',
      'insertUnorderedList',
      'insertOrderedList',
    ]) {
      if (document.queryCommandState(cmd)) next.add(cmd);
    }
    const block = String(document.queryCommandValue('formatBlock')).toLowerCase();
    if (block) next.add(`block:${block}`);
    setActive(next);
  }, []);

  useEffect(() => {
    document.addEventListener('selectionchange', refreshState);
    return () => document.removeEventListener('selectionchange', refreshState);
  }, [refreshState]);

  const emit = () => {
    const el = ref.current;
    if (!el) return;
    const text = el.textContent?.trim() ?? '';
    setLength(text.length);
    setEmpty(text.length === 0 && !el.querySelector('li,img'));
    onChange?.(el.innerHTML, text);
  };

  const run = (fn: () => void) => {
    ref.current?.focus();
    fn();
    emit();
    refreshState();
  };

  const groups: Command[][] = [
    [
      { id: 'undo', icon: Undo2, label: labels.undo!, run: () => exec('undo') },
      { id: 'redo', icon: Redo2, label: labels.redo!, run: () => exec('redo') },
    ],
    [
      {
        id: 'p',
        icon: Pilcrow,
        label: labels.paragraph!,
        run: () => exec('formatBlock', 'p'),
        state: 'block:p',
      },
      {
        id: 'h2',
        icon: Heading2,
        label: labels.heading!,
        run: () => exec('formatBlock', 'h2'),
        state: 'block:h2',
      },
      {
        id: 'quote',
        icon: Quote,
        label: labels.quote!,
        run: () => exec('formatBlock', 'blockquote'),
        state: 'block:blockquote',
      },
    ],
    [
      { id: 'bold', icon: Bold, label: labels.bold!, run: () => exec('bold'), state: 'bold' },
      {
        id: 'italic',
        icon: Italic,
        label: labels.italic!,
        run: () => exec('italic'),
        state: 'italic',
      },
      {
        id: 'underline',
        icon: Underline,
        label: labels.underline!,
        run: () => exec('underline'),
        state: 'underline',
      },
      {
        id: 'strike',
        icon: Strikethrough,
        label: labels.strike!,
        run: () => exec('strikeThrough'),
        state: 'strikeThrough',
      },
    ],
    [
      {
        id: 'ul',
        icon: List,
        label: labels.bullet!,
        run: () => exec('insertUnorderedList'),
        state: 'insertUnorderedList',
      },
      {
        id: 'ol',
        icon: ListOrdered,
        label: labels.ordered!,
        run: () => exec('insertOrderedList'),
        state: 'insertOrderedList',
      },
    ],
    [
      {
        id: 'link',
        icon: Link2,
        label: labels.link!,
        run: () => {
          const url = window.prompt(labels.linkPrompt, 'https://');
          if (url) exec('createLink', url);
        },
      },
      { id: 'unlink', icon: Unlink, label: labels.unlink!, run: () => exec('unlink') },
    ],
  ];

  const over = maxLength !== undefined && length > maxLength;

  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border border-input bg-transparent transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30',
        disabled && 'pointer-events-none opacity-50',
        className,
      )}
    >
      <div role="toolbar" className="flex flex-wrap items-center gap-0.5 border-b bg-muted/40 p-1">
        {groups.map((group, gi) => (
          <div key={gi} className="flex items-center gap-0.5">
            {gi > 0 && (
              <Separator orientation="vertical" className="mx-1 data-[orientation=vertical]:h-5" />
            )}
            {group.map((cmd) => {
              const on = cmd.state ? active.has(cmd.state) : false;
              return (
                <Tooltip key={cmd.id}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label={cmd.label}
                      aria-pressed={cmd.state ? on : undefined}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => run(cmd.run)}
                      className={cn(
                        'flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-background hover:text-foreground [&>svg]:size-4',
                        on && 'bg-background text-foreground shadow-xs ring-1 ring-border',
                      )}
                    >
                      <cmd.icon />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>{cmd.label}</TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        ))}
      </div>
      <div className="relative">
        {empty && placeholder && (
          <p className="pointer-events-none absolute top-3 left-3 text-sm text-muted-foreground">
            {placeholder}
          </p>
        )}
        <div
          ref={ref}
          id={id}
          role="textbox"
          aria-multiline
          contentEditable={!disabled}
          suppressContentEditableWarning
          onInput={emit}
          onKeyUp={refreshState}
          style={{ minHeight }}
          className={cn(
            'max-h-96 overflow-y-auto px-3 py-3 text-sm leading-6 outline-none',
            '[&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground',
            '[&_h2]:text-base [&_h2]:font-semibold [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5',
          )}
        />
      </div>
      {maxLength !== undefined && (
        <div className="flex justify-end border-t px-3 py-1.5">
          <span
            className={cn(
              'text-xs tabular-nums',
              over ? 'text-destructive' : 'text-muted-foreground',
            )}
          >
            {length}/{maxLength}
          </span>
        </div>
      )}
    </div>
  );
}
