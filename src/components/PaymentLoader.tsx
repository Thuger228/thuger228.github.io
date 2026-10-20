import { useEffect } from 'react';
import { Check, Loader2, Lock } from 'lucide-react';
import { useFormsCopy } from '@/i18n/content/forms';

// Full-screen "taking you to payment" screen, shown from the moment the visitor presses
// "Continue to payment" until the browser opens Stripe. `phase` is the step that's running now;
// `steps` replaces the booking steps (the voucher shop has its own).
const PaymentLoader = ({ phase, total, steps }: { phase: 0 | 1 | 2; total: number; steps?: [string, string, string] }) => {
  const f = useFormsCopy();

  // Keep the page behind it from scrolling while it's up.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/90 backdrop-blur-md p-6 select-none animate-in fade-in duration-200"
      role="alertdialog"
      aria-modal="true"
      aria-busy="true"
      aria-labelledby="payment-loader-title"
    >
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 text-center shadow-2xl">
        <div className="relative mx-auto mb-6 h-16 w-16">
          <Loader2 className="h-16 w-16 animate-spin text-primary" strokeWidth={1.5} />
          <Lock className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 text-primary" />
        </div>
        <h2 id="payment-loader-title" className="text-xl font-bold mb-1">
          {f.pay_title}
        </h2>
        <p className="text-2xl font-bold mb-6">{total} zł</p>
        <ol className="space-y-3 text-left" aria-live="polite">
          {(steps ?? f.pay_steps).map((label, i) => {
            const state = i < phase ? 'done' : i === phase ? 'active' : 'waiting';
            return (
              <li key={i} className="flex items-center gap-3 text-sm">
                <span
                  className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border ${
                    state === 'done'
                      ? 'border-primary bg-primary text-primary-foreground'
                      : state === 'active'
                        ? 'border-primary text-primary'
                        : 'border-border text-muted-foreground'
                  }`}
                >
                  {state === 'done' ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : state === 'active' ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <span className="text-xs">{i + 1}</span>
                  )}
                </span>
                <span className={state === 'waiting' ? 'text-muted-foreground' : 'font-medium'}>{label}</span>
              </li>
            );
          })}
        </ol>
        <p className="mt-6 text-xs text-muted-foreground">{f.pay_note}</p>
      </div>
    </div>
  );
};

export default PaymentLoader;
