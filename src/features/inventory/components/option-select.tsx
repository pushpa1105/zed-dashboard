import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

/** Full-width select for form fields, fed with plain value/label options. */
export function OptionSelect({
  id,
  value,
  onChange,
  options,
  invalid,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  invalid?: boolean;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} className="w-full" aria-invalid={invalid}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
