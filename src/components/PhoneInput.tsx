import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFormsCopy } from '@/i18n/content/forms';

// One simple phone field for every form on the site: pick the country (Poland by default),
// then type the number. Digits are grouped as you type; the form gets "+48 881 238 684".

const COUNTRIES = [
  { iso: 'PL', code: '+48', length: 9 },
  { iso: 'UA', code: '+380', length: 9 },
  { iso: 'BY', code: '+375', length: 9 },
  { iso: 'DE', code: '+49' },
  { iso: 'GB', code: '+44' },
  { iso: 'LT', code: '+370', length: 8 },
  { iso: 'CZ', code: '+420', length: 9 },
  { iso: 'RU', code: '+7', length: 10 },
  { iso: 'US', code: '+1', length: 10 },
] as const;

const OTHER = 'other';
type CountryIso = (typeof COUNTRIES)[number]['iso'] | typeof OTHER;

const digitsOf = (s: string) => s.replace(/\D/g, '');
const group = (digits: string) => digits.replace(/(\d{3})(?=\d)/g, '$1 ');

// Valid if the number part has the right length for the country (or 6–15 digits when unknown).
export const isValidPhone = (value: string) => {
  const country = COUNTRIES.find((c) => value.startsWith(c.code + ' '));
  const digits = digitsOf(country ? value.slice(country.code.length) : value);
  if (country && 'length' in country) return digits.length === country.length;
  return value.trim().startsWith('+') && digits.length >= 6 && digits.length <= 15;
};

interface PhoneInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

const PhoneInput = ({ id, value, onChange, required }: PhoneInputProps) => {
  const f = useFormsCopy();
  const [iso, setIso] = useState<CountryIso>('PL');
  const [local, setLocal] = useState(() => (value ? group(digitsOf(value.replace(/^\+48/, ''))) : ''));
  const [touched, setTouched] = useState(false);
  const country = COUNTRIES.find((c) => c.iso === iso);

  const emit = (nextIso: CountryIso, nextLocal: string) => {
    const c = COUNTRIES.find((x) => x.iso === nextIso);
    if (!nextLocal.trim()) return onChange('');
    onChange(c ? `${c.code} ${nextLocal.trim()}` : nextLocal.trim());
  };

  const handleType = (raw: string) => {
    let nextIso = iso;
    let text = raw;
    // A full number typed or pasted ("+380…", "0048…"): pick its country and keep the rest.
    const intl = raw.trim().replace(/^00/, '+');
    if (intl.startsWith('+')) {
      const compact = '+' + digitsOf(intl);
      const match = [...COUNTRIES].sort((a, b) => b.code.length - a.code.length).find((c) => compact.startsWith(c.code));
      if (match && compact.length > match.code.length) {
        nextIso = match.iso;
        text = compact.slice(match.code.length);
      } else if (!match) {
        nextIso = OTHER;
      }
    }
    const target = COUNTRIES.find((c) => c.iso === nextIso);
    const max = target && 'length' in target ? target.length : 15;
    const next = nextIso === OTHER ? text.replace(/[^\d+ ]/g, '') : group(digitsOf(text).slice(0, max));
    setIso(nextIso);
    setLocal(next);
    emit(nextIso, next);
  };

  const handleCountry = (nextIso: CountryIso) => {
    setIso(nextIso);
    const next = nextIso === OTHER ? '+' : group(digitsOf(local));
    setLocal(next === '+' ? '' : next);
    emit(nextIso, next === '+' ? '' : next);
  };

  const full = country ? `${country.code} ${local}` : local;
  const invalid = touched && local.trim() !== '' && !isValidPhone(full);
  const placeholder = iso === 'PL' ? '123 456 789' : iso === OTHER ? f.phone_other_placeholder : '';

  return (
    <div className="w-full min-w-0">
      <div
        className={cn(
          'flex h-10 w-full min-w-0 overflow-hidden rounded-md border border-input bg-background ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
          invalid && 'border-destructive'
        )}
      >
        <div className="relative flex-shrink-0 border-r border-input">
          <select
            aria-label={f.phone_country}
            value={iso}
            onChange={(e) => handleCountry(e.target.value as CountryIso)}
            className="h-full w-[6.25rem] appearance-none truncate bg-transparent pl-3 pr-7 text-base md:text-sm focus:outline-none cursor-pointer"
          >
            {COUNTRIES.map((c) => (
              <option key={c.iso} value={c.iso} className="bg-background">
                {c.iso} {c.code}
              </option>
            ))}
            <option value={OTHER} className="bg-background">
              {f.phone_other}
            </option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        </div>
        <input
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder={placeholder}
          value={local}
          onChange={(e) => handleType(e.target.value)}
          onBlur={() => setTouched(true)}
          required={required}
          aria-invalid={invalid || undefined}
          className="min-w-0 flex-1 bg-transparent px-3 text-base md:text-sm placeholder:text-muted-foreground/40 focus:outline-none"
        />
      </div>
      {invalid && <p className="mt-1.5 text-xs text-destructive">{f.phone_invalid}</p>}
    </div>
  );
};

export default PhoneInput;
