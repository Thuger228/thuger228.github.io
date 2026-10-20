import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { contactCopy, useContactCopy, type ContactTopic } from '@/i18n/content/contact';
import { useFormsCopy } from '@/i18n/content/forms';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PhoneInput, { isValidPhone } from '@/components/PhoneInput';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { notifyStudio } from '@/lib/bookingApi';
import { cn } from '@/lib/utils';
import { CheckCircle2, Send } from 'lucide-react';
import { z } from 'zod';

const TOPICS: ContactTopic[] = ['rehearsal', 'recording', 'mixing', 'rent', 'voucher', 'other'];

const schema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(50).refine(isValidPhone),
  message: z.string().trim().min(1).max(2000),
});

const EMPTY = { name: '', email: '', phone: '', message: '' };

const ContactForm = () => {
  const { language, t } = useLanguage();
  const c = useContactCopy();
  const f = useFormsCopy();
  const [form, setForm] = useState(EMPTY);
  const [topic, setTopic] = useState<ContactTopic | null>(null);
  const [honey, setHoney] = useState(''); // spam trap, real visitors never see it
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const phoneOnly = parsed.error.issues.every((i) => i.path[0] === 'phone');
      toast({
        title: phoneOnly ? f.phone_invalid : t('contact_error_title'),
        description: phoneOnly ? undefined : t('contact_error_desc'),
        variant: 'destructive',
      });
      return;
    }
    setLoading(true);
    try {
      // Topic goes to the studio in Polish, whatever language the visitor uses.
      const topicLabel = topic ? `[${contactCopy.pl.topics[topic]}] ` : '';
      const res = await fetch('https://formsubmit.co/ajax/support@sanctum-sa.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name: parsed.data.name,
          email: parsed.data.email,
          phone: parsed.data.phone,
          topic: topic ? c.topics[topic] : '',
          language: language.toUpperCase(),
          message: parsed.data.message,
          _subject: `${topicLabel}New contact from ${parsed.data.name} - Sanctum Sound`,
          _replyto: parsed.data.email,
          _template: 'table',
          _captcha: 'false',
          _honey: honey,
        }),
      });
      if (!res.ok) throw new Error('Failed');
      if (!honey) {
        notifyStudio({
          kind: 'contact',
          topic: topic ? contactCopy.pl.topics[topic] : '',
          name: parsed.data.name,
          email: parsed.data.email,
          phone: parsed.data.phone,
          message: parsed.data.message,
          language,
        });
      }
      setSent(true);
      setForm(EMPTY);
      setTopic(null);
    } catch {
      toast({ title: t('contact_error_title'), description: t('contact_error_desc'), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center gap-4 py-12" role="status">
        <CheckCircle2 className="w-14 h-14 text-primary" />
        <h3 className="text-2xl font-bold">{c.sent_title}</h3>
        <p className="text-muted-foreground max-w-sm">{c.sent_text}</p>
        <Button variant="outline" onClick={() => setSent(false)}>
          {c.send_another}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <fieldset>
        <legend className="text-sm font-medium mb-3">{c.topic_label}</legend>
        <div className="flex flex-wrap gap-2">
          {TOPICS.map((id) => (
            <button
              key={id}
              type="button"
              aria-pressed={topic === id}
              onClick={() => setTopic(topic === id ? null : id)}
              className={cn(
                'rounded-full border px-4 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                topic === id
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:border-primary hover:text-foreground'
              )}
            >
              {c.topics[id]}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="contact-name">{t('contact_name')}</Label>
          <Input
            id="contact-name"
            autoComplete="name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            maxLength={100}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-email">{t('contact_email')}</Label>
          <Input
            id="contact-email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            maxLength={255}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-phone">{t('contact_phone')}</Label>
          <PhoneInput
            id="contact-phone"
            value={form.phone}
            onChange={(phone) => setForm({ ...form, phone })}
            required
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="contact-message">{t('contact_message')}</Label>
          <Textarea
            id="contact-message"
            placeholder={c.message_placeholder}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            maxLength={2000}
            rows={6}
            required
          />
        </div>
      </div>

      <input
        type="text"
        name="_honey"
        value={honey}
        onChange={(e) => setHoney(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      <Button type="submit" disabled={loading} className="w-full" size="lg">
        <Send className="w-4 h-4 mr-2" />
        {loading ? c.sending : t('contact_send')}
      </Button>
    </form>
  );
};

export default ContactForm;
