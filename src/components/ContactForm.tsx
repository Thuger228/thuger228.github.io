import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Send } from 'lucide-react';
import { z } from 'zod';

const schema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(1).max(50),
  message: z.string().trim().min(1).max(2000),
});

const ContactForm = () => {
  const { t } = useLanguage();
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast({ title: 'Invalid input', description: 'Please check your fields.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('https://formsubmit.co/ajax/support@sanctum-sa.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name: parsed.data.name,
          email: parsed.data.email,
          phone: parsed.data.phone,
          message: parsed.data.message,
          _subject: `New contact from ${parsed.data.name} — Sanctum Sound`,
          _template: 'table',
          _captcha: 'false',
        }),
      });
      if (!res.ok) throw new Error('Failed');
      toast({ title: t('contact_success_title'), description: t('contact_success_desc') });
      setForm({ name: '', email: '', phone: '', message: '' });
    } catch {
      toast({ title: t('contact_error_title'), description: t('contact_error_desc'), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-6 md:p-8 space-y-4">
      <Input
        placeholder={t('contact_name')}
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        maxLength={100}
        required
      />
      <Input
        type="email"
        placeholder={t('contact_email')}
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        maxLength={255}
        required
      />
      <Input
        type="tel"
        placeholder={t('contact_phone')}
        value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
        maxLength={50}
        required
      />
      <Textarea
        placeholder={t('contact_message')}
        value={form.message}
        onChange={(e) => setForm({ ...form, message: e.target.value })}
        maxLength={2000}
        rows={6}
        required
      />
      <Button type="submit" disabled={loading} className="w-full" size="lg">
        <Send className="w-4 h-4 mr-2" />
        {loading ? '...' : t('contact_send')}
      </Button>
    </form>
  );
};

export default ContactForm;
