import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { be, enGB, pl, ru, uk } from 'date-fns/locale';
import { ArrowLeft, CalendarDays, Check, CheckCircle2, Clock, CreditCard, Loader2, Send } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { LANGUAGES, Language, pagePath } from '@/i18n/config';
import { useBookingCopy } from '@/i18n/content/booking';
import {
  BOOKING_EMAIL_ENDPOINT,
  BOOKING_SERVICES,
  BOOK_AHEAD_DAYS,
  BookingServiceId,
  MIN_NOTICE_MINUTES,
  OPENING_HOURS,
  REHEARSAL_OPTIONS,
  RehearsalOptionId,
  SLOT_STEP_MINUTES,
  STRIPE_LOCALES,
  STUDIO_TIME_ZONE,
} from '@/data/booking';
import { TakenSlot, confirmPayment, fetchTakenSlots, holdSlot, releaseHold } from '@/lib/bookingApi';

// Remembers the visitor's language across the Stripe round trip. The backend now returns each visitor
// to their own language's page; this still covers a return to the Polish /booking/?paid=1.
const RETURN_LANG_KEY = 'sanctum_booking_lang';

const DATE_LOCALES = { pl, en: enGB, uk, be, ru };
const INTL_LOCALES: Record<Language, string> = { pl: 'pl-PL', en: 'en-GB', uk: 'uk-UA', be: 'be-BY', ru: 'ru-RU' };

const schema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(5).max(50),
  notes: z.string().trim().max(2000),
});

// ---- dates and times (all in studio time; dates as 'YYYY-MM-DD', times as minutes after midnight) ----

const pad = (n: number) => String(n).padStart(2, '0');
const isoFromDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dateFromIso = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const addDays = (iso: string, days: number) => {
  const d = dateFromIso(iso);
  d.setDate(d.getDate() + days);
  return isoFromDate(d);
};
const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
const formatMinutes = (min: number) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;

const studioNow = () => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: STUDIO_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(new Date())
      .map((p) => [p.type, p.value])
  );
  return { date: `${parts.year}-${parts.month}-${parts.day}`, minutes: Number(parts.hour) * 60 + Number(parts.minute) };
};

interface Slot {
  start: number;
  taken: boolean;
}

// Every start time on a day that fits the session inside opening hours and after the notice period.
const slotsForDay = (iso: string, durationMin: number, taken: TakenSlot[], now: { date: string; minutes: number }): Slot[] => {
  const hours = OPENING_HOURS[dateFromIso(iso).getDay()];
  if (!hours || iso < now.date) return [];
  const [open, close] = hours.map(toMinutes);
  // Minimum notice, carried into tomorrow when it runs past midnight.
  const earliest =
    iso === now.date ? now.minutes + MIN_NOTICE_MINUTES : iso === addDays(now.date, 1) ? now.minutes + MIN_NOTICE_MINUTES - 1440 : 0;
  const busy = taken.filter((t) => t.booking_date === iso);
  const slots: Slot[] = [];
  for (let start = open; start + durationMin <= close; start += SLOT_STEP_MINUTES) {
    if (start < earliest) continue;
    const end = start + durationMin;
    slots.push({ start, taken: busy.some((b) => b.start_minute < end && start < b.start_minute + b.duration_minutes) });
  }
  return slots;
};

// Stripe's client_reference_id allows letters, digits, "-" and "_" only (max 200 chars).
const bookingReference = (service: BookingServiceId, date?: string, start?: number, quantity = 1) =>
  [
    'SS',
    service,
    date?.replace(/-/g, ''),
    start === undefined ? undefined : formatMinutes(start).replace(':', ''),
    `${quantity}x`,
    Math.random().toString(36).slice(2, 6),
  ]
    .filter(Boolean)
    .join('-');

const BookingForm = () => {
  const { language, t } = useLanguage();
  const { form: c } = useBookingCopy();
  const navigate = useNavigate();

  const [serviceId, setServiceId] = useState<BookingServiceId>('rehearsal');
  const [quantity, setQuantity] = useState(1);
  const [options, setOptions] = useState<RehearsalOptionId[]>([]);
  const [day, setDay] = useState<string>();
  const [start, setStart] = useState<number>();
  const [step, setStep] = useState<'pick' | 'details'>('pick');
  const [contact, setContact] = useState({ name: '', email: '', phone: '', notes: '' });
  const [now, setNow] = useState<{ date: string; minutes: number }>();
  const [busy, setBusy] = useState<Partial<Record<BookingServiceId, { loading: boolean; slots: TakenSlot[] }>>>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<'paid' | 'requested' | null>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const timesRef = useRef<HTMLDivElement>(null);

  const service = BOOKING_SERVICES.find((s) => s.id === serviceId)!;
  // Rehearsal extras change the hourly price. Recording and mixing have no date or quantity: they're
  // requests the studio answers by email or phone. Only slot bookings are paid online.
  const chosenOptions = service.id === 'rehearsal' ? REHEARSAL_OPTIONS.filter((o) => options.includes(o.id)) : [];
  const perHour = service.pricePerUnit + chosenOptions.reduce((sum, o) => sum + (o.perHour ? o.price : 0), 0);
  const fixedExtras = chosenOptions.reduce((sum, o) => sum + (o.perHour ? 0 : o.price), 0);
  const total = perHour * quantity + fixedExtras;
  const payOnline = service.needsSlot;
  const optionName = (id: RehearsalOptionId) => c[`opt_${id}`];
  const optionPrice = (o: (typeof REHEARSAL_OPTIONS)[number]) =>
    `${o.price > 0 ? '+' : '−'}${Math.abs(o.price)} zł${o.perHour ? t('unit_hour') : ''}`;
  const toggleOption = (id: RehearsalOptionId) =>
    setOptions((cur) => (cur.includes(id) ? cur.filter((o) => o !== id) : [...cur, id]));
  const requestCopy =
    serviceId === 'recording'
      ? { note: c.recording_note, label: c.describe_recording, hint: c.describe_recording_hint }
      : { note: c.mixing_note, label: c.describe_songs, hint: c.describe_songs_hint };
  const durationMin = quantity * 60;
  const serviceName = (id: BookingServiceId) =>
    t(id === 'recording' ? 'price_recording_name' : id === 'rehearsal' ? 'price_rehearsal_name' : 'price_mixing_name');
  const unitLabel = (id: BookingServiceId) =>
    BOOKING_SERVICES.find((s) => s.id === id)!.unit === 'hour' ? t('unit_hour') : t('unit_song');

  // Client-only bits (the page is pre-rendered at build time): the current date and the ?paid=1 return.
  useEffect(() => {
    setNow(studioNow());
    const params = new URLSearchParams(window.location.search);
    const cancelled = params.get('cancel');
    if (cancelled) {
      // Back from Stripe without paying: free the held slot, then load busy times without it.
      navigate(pagePath(language, 'booking'), { replace: true });
      releaseHold(cancelled).finally(() => setNow(studioNow()));
      return;
    }
    if (params.get('paid') !== '1') return;
    const sessionId = params.get('session_id');
    let returnLang: string | null = null;
    try {
      returnLang = sessionStorage.getItem(RETURN_LANG_KEY);
      sessionStorage.removeItem(RETURN_LANG_KEY);
    } catch {
      // storage blocked: stay on this language
    }
    if (returnLang && returnLang !== language && (LANGUAGES as readonly string[]).includes(returnLang)) {
      navigate(`${pagePath(returnLang as Language, 'booking')}${window.location.search}`, { replace: true });
      return;
    }
    if (sessionId) confirmPayment(sessionId);
    setDone('paid');
  }, [language, navigate]);

  // Busy times come from the Google Apps Script backend, which takes a few seconds to answer.
  // Both rooms load as soon as the page opens, so switching service doesn't wait again, and
  // times stay hidden behind a loader until the answer arrives instead of showing as free.
  const loadBusy = useCallback(
    async (id: BookingServiceId) => {
      if (!now) return;
      setBusy((b) => ({ ...b, [id]: { loading: true, slots: b[id]?.slots ?? [] } }));
      const slots = await fetchTakenSlots(id, now.date, addDays(now.date, BOOK_AHEAD_DAYS));
      setBusy((b) => ({ ...b, [id]: { loading: false, slots: slots ?? [] } }));
    },
    [now]
  );

  useEffect(() => {
    BOOKING_SERVICES.filter((s) => s.needsSlot).forEach((s) => loadBusy(s.id));
  }, [loadBusy]);

  const loadTaken = () => {
    if (service.needsSlot) loadBusy(serviceId);
  };
  const checking = service.needsSlot && (busy[serviceId]?.loading ?? true);
  const taken = useMemo(() => busy[serviceId]?.slots ?? [], [busy, serviceId]);

  // Double check with the calendar: busy times for the chosen day are fetched again whenever the day
  // (or service) changes and again when a time is clicked, so a slot booked a minute ago never shows as free.
  const recheckDay = useCallback(async (id: BookingServiceId, iso: string) => {
    const fresh = await fetchTakenSlots(id, iso, iso);
    if (!fresh) return null;
    const forDay = fresh.filter((t) => t.booking_date === iso);
    setBusy((b) => ({
      ...b,
      [id]: { loading: b[id]?.loading ?? false, slots: [...(b[id]?.slots ?? []).filter((t) => t.booking_date !== iso), ...forDay] },
    }));
    return forDay;
  }, []);

  const [dayChecked, setDayChecked] = useState<string>();
  const [timeChecking, setTimeChecking] = useState<number>();
  useEffect(() => {
    if (!day || !service.needsSlot) return;
    let live = true;
    setDayChecked(undefined);
    recheckDay(serviceId, day).finally(() => {
      if (live) setDayChecked(`${serviceId}:${day}`);
    });
    return () => {
      live = false;
    };
  }, [day, serviceId, service.needsSlot, recheckDay]);
  const dayChecking = checking || (Boolean(day) && dayChecked !== `${serviceId}:${day}`);

  // Keep the step that just changed in view (the details step and thank-you panel are shorter).
  const scrollTop = () => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  useEffect(() => {
    if (done) scrollTop();
  }, [done]);

  const daySlots = useMemo(
    () => (day && now ? slotsForDay(day, durationMin, taken, now) : []),
    [day, now, durationMin, taken]
  );

  const lastDay = now ? addDays(now.date, BOOK_AHEAD_DAYS) : undefined;
  const isDayDisabled = (d: Date) => {
    if (!now || !lastDay) return true;
    const iso = isoFromDate(d);
    if (iso < now.date || iso > lastDay) return true;
    // While busy times load, only closed or past days are greyed out.
    return !slotsForDay(iso, durationMin, checking ? [] : taken, now).some((s) => !s.taken);
  };

  const formatDay = (iso: string) =>
    new Intl.DateTimeFormat(INTL_LOCALES[language], { weekday: 'long', day: 'numeric', month: 'long' }).format(dateFromIso(iso));

  const selectService = (id: BookingServiceId) => {
    setServiceId(id);
    const next = BOOKING_SERVICES.find((s) => s.id === id)!;
    setQuantity((q) => Math.min(q, next.maxQuantity));
    setStart(undefined);
  };

  const pickTime = async (slot: Slot) => {
    if (slot.taken || dayChecking || timeChecking !== undefined || !day) return;
    setTimeChecking(slot.start);
    const fresh = await recheckDay(serviceId, day);
    setTimeChecking(undefined);
    // null (calendar unreachable): carry on, booking checks the slot again on the server.
    if (fresh?.some((b) => b.start_minute < slot.start + durationMin && slot.start < b.start_minute + b.duration_minutes)) {
      toast({ title: c.slot_taken, variant: 'destructive' });
      return;
    }
    setStart(slot.start);
    setStep('details');
    scrollTop();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(contact);
    if (!parsed.success || (service.needsSlot && (!day || start === undefined))) {
      toast({ title: c.error_invalid, variant: 'destructive' });
      return;
    }
    const slotDay = service.needsSlot ? day : undefined;
    const slotStart = service.needsSlot ? start : undefined;
    const reference = bookingReference(serviceId, slotDay, slotStart, quantity);
    setLoading(true);

    // 1. Hold the slot so nobody else can book it while this customer pays. The backend also creates
    //    the Stripe Checkout for the exact amount.
    let checkoutUrl: string | undefined;
    if (slotDay && slotStart !== undefined) {
      const hold = await holdSlot({
        reference,
        service: serviceId,
        date: slotDay,
        startMinute: slotStart,
        durationMinutes: durationMin,
        options: chosenOptions.map((o) => o.id),
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        notes: parsed.data.notes,
        amount: total,
        checkout: payOnline,
        locale: STRIPE_LOCALES[language],
        returnPath: pagePath(language, 'booking'),
      });
      if (hold.status === 'slot_taken') {
        toast({ title: c.slot_taken, variant: 'destructive' });
        setLoading(false);
        setStart(undefined);
        setStep('pick');
        loadTaken();
        return;
      }
      // Only ever send the customer to Stripe's own checkout page.
      if (hold.status === 'held' && hold.checkoutUrl?.startsWith('https://checkout.stripe.com/')) checkoutUrl = hold.checkoutUrl;
      // 'unavailable', or no checkout (Stripe not set up): carry on, the studio confirms by hand.
    }

    // 2. Email the booking to the studio.
    try {
      const res = await fetch(BOOKING_EMAIL_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          reference,
          service: serviceName(serviceId),
          date: slotDay ?? '-',
          start_time: slotStart === undefined ? '-' : `${formatMinutes(slotStart)}–${formatMinutes(slotStart + durationMin)}`,
          quantity: service.needsSlot ? `${quantity} × ${perHour} zł${unitLabel(serviceId)}` : '-',
          extras: chosenOptions.length ? chosenOptions.map((o) => `${optionName(o.id)} (${optionPrice(o)})`).join(', ') : '-',
          total: service.needsSlot ? `${total} zł` : `to agree (from ${service.pricePerUnit} zł${unitLabel(serviceId)})`,
          name: parsed.data.name,
          email: parsed.data.email,
          phone: parsed.data.phone,
          notes: parsed.data.notes || '-',
          language,
          payment: checkoutUrl ? 'Stripe (check the Stripe Dashboard for this reference)' : 'To arrange with the customer',
          _subject: `New booking ${reference}: ${serviceName(serviceId)} — Sanctum Sound`,
          _replyto: parsed.data.email,
          _template: 'table',
          _captcha: 'false',
        }),
      });
      if (!res.ok) throw new Error('Failed');
    } catch {
      toast({ title: c.error_send, variant: 'destructive' });
      setLoading(false);
      return;
    }

    if (!checkoutUrl) {
      setDone('requested');
      setLoading(false);
      return;
    }

    // 3. Pay on Stripe. The reference ties the payment to the booking (the backend marks it paid).
    try {
      sessionStorage.setItem(RETURN_LANG_KEY, language);
    } catch {
      // storage blocked: the visitor returns to the Polish page, which still shows the thank-you
    }
    window.location.href = checkoutUrl;
  };

  const resetAll = () => {
    setDone(null);
    setStep('pick');
    setDay(undefined);
    setStart(undefined);
    if (window.location.search) navigate(pagePath(language, 'booking'), { replace: true });
    loadTaken();
  };

  if (done) {
    return (
      <div ref={topRef} className="scroll-mt-28 bg-card border border-border rounded-lg p-8 md:p-10 text-center" role="status">
        <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-4" />
        <h2 className="text-2xl md:text-3xl font-bold mb-3">{done === 'paid' ? c.paid_title : service.needsSlot ? c.request_sent_title : c.ask_sent_title}</h2>
        <p className="text-muted-foreground mb-6">{done === 'paid' ? c.paid_text : service.needsSlot ? c.request_sent_text : c.ask_sent_text}</p>
        <Button variant="outline" onClick={resetAll}>
          {c.new_booking}
        </Button>
      </div>
    );
  }

  // ---- step 2: details and payment ----
  if (step === 'details') {
    return (
      <div ref={topRef} className="scroll-mt-28 bg-card border border-border rounded-lg overflow-hidden md:grid md:grid-cols-[260px_1fr]">
        <aside className="p-6 md:p-8 border-b md:border-b-0 md:border-r border-border space-y-4">
          <Button variant="ghost" size="sm" className="-ml-3" onClick={() => setStep('pick')}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            {c.back}
          </Button>
          <div>
            <p className="text-sm text-muted-foreground">Sanctum Sound</p>
            <p className="text-xl font-bold">{serviceName(serviceId)}</p>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {service.needsSlot && day && start !== undefined ? (
              <>
                <li className="flex items-start gap-2">
                  <CalendarDays className="w-4 h-4 mt-0.5 shrink-0" />
                  <span className="first-letter:uppercase">{formatDay(day)}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Clock className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>
                    {formatMinutes(start)}–{formatMinutes(start + durationMin)} ({quantity} × {perHour} zł{unitLabel(serviceId)})
                  </span>
                </li>
                {chosenOptions.map((o) => (
                  <li key={o.id} className="pl-6">
                    {optionName(o.id)} ({optionPrice(o)})
                  </li>
                ))}
              </>
            ) : null}
          </ul>
          {service.needsSlot ? (
            <div className="pt-4 border-t border-border flex items-baseline justify-between">
              <span className="text-muted-foreground text-sm">{c.total}</span>
              <span className="text-2xl font-bold">{total} zł</span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{requestCopy.note}</p>
          )}
        </aside>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-4">
          <h2 className="text-xl font-bold">{c.your_details}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="booking-name">{c.name}</Label>
              <Input
                id="booking-name"
                autoComplete="name"
                value={contact.name}
                onChange={(e) => setContact({ ...contact, name: e.target.value })}
                maxLength={100}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="booking-phone">{c.phone}</Label>
              <Input
                id="booking-phone"
                type="tel"
                autoComplete="tel"
                value={contact.phone}
                onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                maxLength={50}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="booking-email">{c.email}</Label>
            <Input
              id="booking-email"
              type="email"
              autoComplete="email"
              value={contact.email}
              onChange={(e) => setContact({ ...contact, email: e.target.value })}
              maxLength={255}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="booking-notes">{service.needsSlot ? c.notes : requestCopy.label}</Label>
            <Textarea
              id="booking-notes"
              value={contact.notes}
              onChange={(e) => setContact({ ...contact, notes: e.target.value })}
              placeholder={service.needsSlot ? undefined : requestCopy.hint}
              maxLength={2000}
              rows={service.needsSlot ? 3 : 6}
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full" size="lg">
            {payOnline ? <CreditCard className="w-4 h-4 mr-2" /> : <Send className="w-4 h-4 mr-2" />}
            {loading ? c.sending : payOnline ? `${c.pay_button} · ${total} zł` : c.ask_button}
          </Button>
          <p className="text-xs md:text-sm text-muted-foreground text-center">
            {service.needsSlot && c.confirm_note}
          </p>
        </form>
      </div>
    );
  }

  // ---- step 1: service, duration, day and time ----
  return (
    <div ref={topRef} className="scroll-mt-28 bg-card border border-border rounded-lg p-6 md:p-8 space-y-6">
      <div className="space-y-5">
        <fieldset>
          <legend className="text-sm font-medium mb-2">{c.service}</legend>
          <div className="grid gap-3 sm:grid-cols-3" role="radiogroup">
            {BOOKING_SERVICES.map((s) => (
              <button
                key={s.id}
                type="button"
                role="radio"
                aria-checked={s.id === serviceId}
                onClick={() => selectService(s.id)}
                className={`text-left rounded-lg border p-4 transition-colors touch-manipulation ${
                  s.id === serviceId ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                }`}
              >
                <span className="block font-semibold">{serviceName(s.id)}</span>
                <span className="block text-sm text-muted-foreground">
                  {s.pricePerUnit} zł{unitLabel(s.id)}
                </span>
              </button>
            ))}
          </div>
        </fieldset>
        {service.needsSlot && (
          <fieldset>
            <legend className="text-sm font-medium mb-2">{c.duration}</legend>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-2">
              {Array.from({ length: service.maxQuantity }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-pressed={n === quantity}
                  onClick={() => {
                    setQuantity(n);
                    setStart(undefined);
                  }}
                  className={`h-11 rounded-md border text-sm font-semibold transition-colors ${
                    n === quantity
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {n} h
                </button>
              ))}
            </div>
          </fieldset>
        )}
      </div>

      {service.id === 'rehearsal' && (
        <fieldset>
          <legend className="text-sm font-medium mb-2">{c.extras}</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            {REHEARSAL_OPTIONS.map((o) => {
              const on = options.includes(o.id);
              return (
                <button
                  key={o.id}
                  type="button"
                  role="checkbox"
                  aria-checked={on}
                  onClick={() => toggleOption(o.id)}
                  className={`flex items-start gap-3 text-left rounded-md border p-3 transition-colors touch-manipulation ${
                    on ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                      on ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'
                    }`}
                    aria-hidden="true"
                  >
                    {on && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                  </span>
                  <span>
                    <span className="block font-semibold text-sm">{optionName(o.id)}</span>
                    <span className="block text-sm text-muted-foreground">{optionPrice(o)}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {service.needsSlot ? (
        <div className="border-t border-border pt-6 grid gap-6 md:grid-cols-[auto_1fr]">
          <div>
            <h2 className="text-lg font-bold mb-2">{c.pick_day}</h2>
            {now ? (
              <Calendar
                mode="single"
                locale={DATE_LOCALES[language]}
                weekStartsOn={1}
                selected={day ? dateFromIso(day) : undefined}
                onSelect={(d) => {
                  setDay(d ? isoFromDate(d) : undefined);
                  setStart(undefined);
                  if (d && window.matchMedia('(max-width: 767px)').matches) {
                    requestAnimationFrame(() => timesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
                  }
                }}
                fromDate={dateFromIso(now.date)}
                toDate={lastDay ? dateFromIso(lastDay) : undefined}
                disabled={isDayDisabled}
                className="p-0"
                classNames={{
                  head_cell: 'text-muted-foreground rounded-md w-10 md:w-11 font-normal text-[0.8rem]',
                  cell: 'h-10 w-10 md:h-11 md:w-11 text-center text-sm p-0 relative',
                  day: 'h-10 w-10 md:h-11 md:w-11 p-0 rounded-full font-semibold text-primary hover:bg-primary/15 aria-selected:opacity-100',
                  day_selected: 'bg-primary !text-primary-foreground hover:bg-primary',
                  day_today: 'underline underline-offset-4',
                  day_disabled: '!text-muted-foreground opacity-40 font-normal hover:bg-transparent',
                  day_outside: 'invisible',
                }}
              />
            ) : (
              <div className="h-[320px] w-[300px] max-w-full rounded-md bg-muted/30 animate-pulse" />
            )}
          </div>

          <div ref={timesRef} className="min-w-0 scroll-mt-28">
            <h2 className="text-lg font-bold mb-2">
              {day ? <span className="first-letter:uppercase inline-block">{formatDay(day)}</span> : c.free_times}
            </h2>
            {!day ? (
              <p className="text-sm text-muted-foreground">{c.pick_day_hint}</p>
            ) : dayChecking ? (
              <div role="status" aria-live="polite">
                <p className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  {c.checking}
                </p>
                <div className="grid grid-cols-3 gap-2" aria-hidden="true">
                  {daySlots.slice(0, 9).map((slot) => (
                    <div key={slot.start} className="h-11 rounded-md bg-muted/40 animate-pulse" />
                  ))}
                </div>
              </div>
            ) : daySlots.every((s) => s.taken) ? (
              <p className="text-sm text-muted-foreground">{c.no_slots}</p>
            ) : (
              <div className="grid grid-cols-3 gap-2 md:max-h-[340px] md:overflow-y-auto md:pr-1">
                {daySlots.map((slot) => (
                  <button
                    key={slot.start}
                    type="button"
                    disabled={slot.taken || timeChecking !== undefined}
                    onClick={() => pickTime(slot)}
                    className={`h-11 rounded-md border text-sm font-semibold transition-colors ${
                      slot.taken
                        ? 'border-border text-muted-foreground line-through opacity-50 cursor-not-allowed'
                        : 'border-primary/60 text-primary hover:bg-primary hover:text-primary-foreground'
                    }`}
                    aria-label={slot.taken ? `${formatMinutes(slot.start)} (${c.taken})` : formatMinutes(slot.start)}
                  >
                    {timeChecking === slot.start ? (
                      <Loader2 className="mx-auto h-4 w-4 animate-spin" aria-label={c.checking} />
                    ) : (
                      formatMinutes(slot.start)
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="border-t border-border pt-6 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <p className="text-sm text-muted-foreground">{requestCopy.note}</p>
          <Button size="lg" onClick={() => setStep('details')}>
            {c.your_details}
          </Button>
        </div>
      )}
    </div>
  );
};

export default BookingForm;
