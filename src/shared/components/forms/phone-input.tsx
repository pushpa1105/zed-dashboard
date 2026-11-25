import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

import { cn } from '@/shared/lib/cn';
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from '@/shared/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';

import { useControllableState } from './use-controllable-state';

export type PhoneCountry = {
  code: string;
  name: string;
  dial: string;
  /** Grouping pattern for the national number, "#" = digit. */
  mask: string;
};

/** A starter list. Pass `countries` for a complete one (e.g. from libphonenumber). */
const COUNTRIES: PhoneCountry[] = [
  { code: 'US', name: 'United States', dial: '+1', mask: '(###) ###-####' },
  { code: 'CA', name: 'Canada', dial: '+1', mask: '(###) ###-####' },
  { code: 'GB', name: 'United Kingdom', dial: '+44', mask: '#### ######' },
  { code: 'DE', name: 'Germany', dial: '+49', mask: '### ########' },
  { code: 'FR', name: 'France', dial: '+33', mask: '# ## ## ## ##' },
  { code: 'ES', name: 'Spain', dial: '+34', mask: '### ### ###' },
  { code: 'IN', name: 'India', dial: '+91', mask: '##### #####' },
  { code: 'NP', name: 'Nepal', dial: '+977', mask: '###-#######' },
  { code: 'AU', name: 'Australia', dial: '+61', mask: '### ### ###' },
  { code: 'JP', name: 'Japan', dial: '+81', mask: '##-####-####' },
  { code: 'BR', name: 'Brazil', dial: '+55', mask: '(##) #####-####' },
  { code: 'MX', name: 'Mexico', dial: '+52', mask: '## #### ####' },
];

const applyMask = (digits: string, mask: string) => {
  let out = '';
  let i = 0;
  for (const ch of mask) {
    if (i >= digits.length) break;
    out += ch === '#' ? digits[i++] : ch;
  }
  return out + digits.slice(i);
};

export type PhoneValue = { country: string; number: string };

export type PhoneInputProps = {
  /** `number` holds digits only (national format). */
  value?: PhoneValue;
  defaultValue?: PhoneValue;
  onChange?: (value: PhoneValue) => void;
  countries?: PhoneCountry[];
  disabled?: boolean;
  invalid?: boolean;
  id?: string;
  className?: string;
};

/** Country code picker + national number formatted as you type. */
export function PhoneInput({
  value: valueProp,
  defaultValue = { country: 'US', number: '' },
  onChange,
  countries = COUNTRIES,
  disabled,
  invalid,
  id,
  className,
}: PhoneInputProps) {
  const [value, setValue] = useControllableState({ value: valueProp, defaultValue, onChange });
  const [open, setOpen] = useState(false);
  const country = countries.find((c) => c.code === value.country) ?? countries[0]!;

  return (
    <div
      aria-invalid={invalid}
      className={cn(
        'flex h-9 w-full items-center overflow-hidden rounded-lg border border-input bg-transparent text-sm transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30',
        disabled && 'pointer-events-none opacity-50',
        className,
      )}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={`Country: ${country.name}`}
            className="flex h-full items-center gap-1 border-r px-2 hover:bg-muted"
          >
            <span className="text-xs font-medium">{country.code}</span>
            <span className="text-muted-foreground tabular-nums">{country.dial}</span>
            <ChevronDown className="size-3 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64 p-0">
          <Command>
            <CommandInput placeholder="Search country…" />
            <CommandList>
              <CommandEmpty>No country found.</CommandEmpty>
              {countries.map((c) => (
                <CommandItem
                  key={c.code}
                  value={`${c.name} ${c.dial} ${c.code}`}
                  data-checked={c.code === country.code}
                  onSelect={() => {
                    setValue({ ...value, country: c.code });
                    setOpen(false);
                  }}
                >
                  <span className="w-6 text-xs font-medium text-muted-foreground">{c.code}</span>
                  <span className="flex-1 truncate">{c.name}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">{c.dial}</span>
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <input
        id={id}
        type="tel"
        autoComplete="tel-national"
        inputMode="tel"
        disabled={disabled}
        placeholder={country.mask.replace(/#/g, '0')}
        value={applyMask(value.number, country.mask)}
        onChange={(e) =>
          setValue({ ...value, number: e.target.value.replace(/\D/g, '').slice(0, 15) })
        }
        className="h-full flex-1 bg-transparent px-3 tabular-nums outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}
