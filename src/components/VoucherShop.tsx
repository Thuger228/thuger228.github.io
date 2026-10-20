import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Check, CheckCircle2, CreditCard, Gift, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import PhoneInput, { isValidPhone } from '@/components/PhoneInput';
import PaymentLoader from '@/components/PaymentLoader';
import { toast } from '@/hooks/use-toast';
import { pagePath } from '@/i18n/config';
import { useVoucherShopCopy } from '@/i18n/content/voucherShop';
import { STRIPE_LOCALES } from '@/data/booking';
import { GIFT_MAX, GIFT_MIN, GIFT_PRESETS, VOUCHER_TIERS, VoucherTierId } from '@/data/vouchers';
import { buyVoucher, confirmPayment } from '@/lib/bookingApi';

const schema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(50).refine(isValidPhone),
  recipient: z.string().trim().max(60),
  message: z.string().trim().max(200),
});

// "Buy a voucher" panel on /voucher/: pick a package (or any amount), fill in the buyer's details and
// pay on Stripe. The booking backend creates the voucher and emails it as a PDF once it's paid.
const VoucherShop = () => {
  const { language } = useLanguage();
  const c = useVoucherShopCopy();
  const navigate = useNavigate();
  const [tierId, setTierId] = useState<VoucherTierId>('song');
  const [amount, setAmount] = useState('300');
  const [form, setForm] = useState({ name: '', email: '', phone: '', recipient: '', message: '' });
  const [hidePrice, setHidePrice] = useState(false);
  const [loading, setLoading] = useState(false);
  const [payPhase, setPayPhase] = useState<0 | 1 | 2 | null>(null);
  const [done, setDone] = useState(false);
  const submittingRef = useRef(false);
  const topRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const tier = VOUCHER_TIERS.find((t) => t.id === tierId)!;
  const giftAmount = Number(amount);
  const giftOk = Number.isInteger(giftAmount) && giftAmount >= GIFT_MIN && giftAmount <= GIFT_MAX;
  const total = tier.price ?? (giftOk ? giftAmount : 0);
  const fill = (s: string) => s.replace('{min}', String(GIFT_MIN)).replace('{max}', String(GIFT_MAX));

  const stopLoading = () => {
    submittingRef.current = false;
    setPayPhase(null);
    setLoading(false);
  };

  // Back from Stripe (?paid=1): show the thank-you and let the backend check the payment straight away.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('paid') !== '1') return;
    const sessionId = params.get('session_id');
    if (sessionId) confirmPayment(sessionId);
    setDone(true);
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ block: 'start' }));
  }, []);

  // Back from Stripe with the browser's Back button: the page comes back from cache with the loader up.
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) stopLoading();
    };
    window.addEventListener('pageshow', onShow);
    return () => window.removeEventListener('pageshow', onShow);
  }, []);

  const pickTier = (id: VoucherTierId) => {
    setTierId(id);
    if (window.matchMedia('(max-width: 767px)').matches) {
      requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;
    if (tier.price === null && !giftOk) {
      toast({ title: fill(c.amount_invalid), variant: 'destructive' });
      return;
    }
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast({ title: c.error_invalid, variant: 'destructive' });
      return;
    }
    submittingRef.current = true;
    setLoading(true);
    setPayPhase(0);
    const step = window.setTimeout(() => setPayPhase(1), 900);
    const checkoutUrl = await buyVoucher({
      tier: tierId,
      amount: total,
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      recipient: parsed.data.recipient,
      message: parsed.data.message,
      hidePrice,
      locale: STRIPE_LOCALES[language],
      returnPath: pagePath(language, 'voucher'),
    });
    window.clearTimeout(step);
    // Only ever send the buyer to Stripe's own checkout page.
    if (!checkoutUrl?.startsWith('https://checkout.stripe.com/')) {
      toast({ title: c.pay_error, variant: 'destructive' });
      stopLoading();
      return;
    }
    setPayPhase(2);
    window.location.href = checkoutUrl;
  };

  const buyAnother = () => {
    setDone(false);
    if (window.location.search) navigate(pagePath(language, 'voucher'), { replace: true });
  };

  return (
    <section className="pb-4">
      <div className="container mx-auto px-6 max-w-5xl">
        <div ref={topRef} id="buy" className="scroll-mt-28 bg-card border border-border rounded-lg p-6 md:p-8">
          {done ? (
            <div className="text-center py-4" role="status">
              <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl md:text-3xl font-bold mb-3">{c.paid_title}</h2>
              <p className="text-muted-foreground mb-6 max-w-xl mx-auto">{c.paid_text}</p>
              <Button variant="outline" onClick={buyAnother}>
                {c.buy_another}
              </Button>
            </div>
          ) : (
            <>
              <h2 className="text-2xl md:text-3xl font-bold mb-2">{c.heading}</h2>
              <p className="text-muted-foreground mb-6">{c.intro}</p>

              <fieldset>
                <legend className="text-sm font-medium mb-2">{c.choose}</legend>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" role="radiogroup">
                  {VOUCHER_TIERS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      role="radio"
                      aria-checked={t.id === tierId}
                      onClick={() => pickTier(t.id)}
                      className={`flex flex-col items-start text-left rounded-lg border p-4 transition-colors touch-manipulation ${
                        t.id === tierId ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <span className="flex items-center gap-2 font-semibold">
                        {t.price === null && <Gift className="w-4 h-4 shrink-0" />}
                        {c.tiers[t.id].name}
                      </span>
                      <span className="block text-2xl font-bold mt-1">{t.price === null ? c.any_amount : `${t.price} zł`}</span>
                      <span className="block text-sm text-muted-foreground mt-1">{c.tiers[t.id].items}</span>
                    </button>
                  ))}
                </div>
              </fieldset>

              {payPhase !== null && <PaymentLoader phase={payPhase} total={total} steps={c.pay_steps} />}
              <form
                ref={formRef}
                onSubmit={handleSubmit}
                className="scroll-mt-28 mt-6 border-t border-border pt-6 grid gap-6 md:grid-cols-[1fr_280px]"
                aria-busy={loading}
              >
                <div className="space-y-4">
                  {tier.price === null && (
                    <div className="space-y-2">
                      <Label htmlFor="voucher-amount">{c.amount}</Label>
                      <Input
                        id="voucher-amount"
                        type="number"
                        inputMode="numeric"
                        min={GIFT_MIN}
                        max={GIFT_MAX}
                        step={1}
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="max-w-[200px]"
                        required
                      />
                      <div className="flex flex-wrap gap-2">
                        {GIFT_PRESETS.map((p) => (
                          <button
                            key={p}
                            type="button"
                            aria-pressed={giftAmount === p}
                            onClick={() => setAmount(String(p))}
                            className={`h-9 px-3 rounded-md border text-sm font-semibold transition-colors ${
                              giftAmount === p ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/50'
                            }`}
                          >
                            {p} zł
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">{fill(c.amount_hint)}</p>
                    </div>
                  )}
                  <h3 className="text-lg font-bold">{c.your_details}</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="voucher-name">{c.name}</Label>
                      <Input
                        id="voucher-name"
                        autoComplete="name"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        maxLength={100}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="voucher-phone">{c.phone}</Label>
                      <PhoneInput id="voucher-phone" value={form.phone} onChange={(phone) => setForm({ ...form, phone })} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="voucher-email">{c.email}</Label>
                    <Input
                      id="voucher-email"
                      type="email"
                      autoComplete="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      maxLength={255}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="voucher-recipient">
                      {c.recipient} <span className="font-normal text-muted-foreground">({c.optional})</span>
                    </Label>
                    <Input
                      id="voucher-recipient"
                      value={form.recipient}
                      onChange={(e) => setForm({ ...form, recipient: e.target.value })}
                      placeholder={c.recipient_hint}
                      maxLength={60}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="voucher-message">
                      {c.message} <span className="font-normal text-muted-foreground">({c.optional})</span>
                    </Label>
                    <Textarea
                      id="voucher-message"
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder={c.message_hint}
                      maxLength={200}
                      rows={3}
                    />
                  </div>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={hidePrice}
                    onClick={() => setHidePrice((v) => !v)}
                    className={`flex w-full items-start gap-3 text-left rounded-md border p-3 transition-colors touch-manipulation ${
                      hidePrice ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                        hidePrice ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'
                      }`}
                      aria-hidden="true"
                    >
                      {hidePrice && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                    </span>
                    <span>
                      <span className="block font-semibold text-sm">{c.hide_price}</span>
                      <span className="block text-sm text-muted-foreground">{c.hide_price_hint}</span>
                    </span>
                  </button>
                </div>

                <aside className="md:border-l md:border-border md:pl-6 space-y-4">
                  <div>
                    <p className="text-xl font-bold">{c.tiers[tierId].name}</p>
                    <p className="text-sm text-muted-foreground">{c.tiers[tierId].items}</p>
                  </div>
                  <div className="pt-4 border-t border-border flex items-baseline justify-between">
                    <span className="text-muted-foreground text-sm">{c.total}</span>
                    <span className="text-2xl font-bold">{total ? `${total} zł` : '-'}</span>
                  </div>
                  <Button type="submit" disabled={loading} className="w-full" size="lg">
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CreditCard className="w-4 h-4 mr-2" />}
                    {loading ? c.sending : total ? `${c.pay_button} · ${total} zł` : c.pay_button}
                  </Button>
                  <p className="text-xs md:text-sm text-muted-foreground">{c.note}</p>
                </aside>
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default VoucherShop;
