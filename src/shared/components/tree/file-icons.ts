import {
  File,
  FileCode2,
  FileImage,
  FileJson,
  FileSpreadsheet,
  FileText,
  type LucideIcon,
} from 'lucide-react';

const BY_EXTENSION: Record<string, { icon: LucideIcon; color: string }> = {
  ts: { icon: FileCode2, color: 'var(--chart-4)' },
  tsx: { icon: FileCode2, color: 'var(--chart-4)' },
  js: { icon: FileCode2, color: 'var(--warning)' },
  css: { icon: FileCode2, color: 'var(--chart-5)' },
  json: { icon: FileJson, color: 'var(--chart-3)' },
  md: { icon: FileText, color: 'var(--muted-foreground)' },
  txt: { icon: FileText, color: 'var(--muted-foreground)' },
  pdf: { icon: FileText, color: 'var(--destructive)' },
  png: { icon: FileImage, color: 'var(--chart-2)' },
  jpg: { icon: FileImage, color: 'var(--chart-2)' },
  svg: { icon: FileImage, color: 'var(--chart-2)' },
  csv: { icon: FileSpreadsheet, color: 'var(--success)' },
  xlsx: { icon: FileSpreadsheet, color: 'var(--success)' },
};

/** Icon + color for a file name, by extension. */
export function fileIconFor(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  return BY_EXTENSION[ext] ?? { icon: File, color: 'var(--muted-foreground)' };
}
