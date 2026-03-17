import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, MapPin, Clock, MessageCircle, Send, ChevronDown, Shield, Zap, Users } from 'lucide-react';

const FAQS = [
  {
    q: 'How does TypeAware detect harmful content?',
    a: 'TypeAware uses advanced NLP models trained on millions of data points. The AI analyses context, tone, and intent — not just keywords — to accurately identify harassment, hate speech, and other harmful patterns in real-time.',
  },
  {
    q: 'Is my data private and secure?',
    a: 'Absolutely. All text analysis happens locally in your browser wherever possible. We never store your personal messages without explicit consent. All API communication is encrypted end-to-end.',
  },
  {
    q: 'Do you offer enterprise or team plans?',
    a: 'Yes! We offer custom enterprise solutions with advanced features, SLA support, bulk licensing, and integration APIs. Contact us directly for pricing tailored to your organisation.',
  },
  {
    q: 'Which platforms does TypeAware support?',
    a: 'The extension currently supports Twitter/X, YouTube, Reddit, Facebook, and Instagram. Discord support is coming soon. The demo works on any text input independently of platform.',
  },
  {
    q: 'How accurate is the AI detection?',
    a: 'TypeAware achieves 99.3% accuracy across our benchmark datasets. We continuously retrain models on emerging threats and update the extension automatically.',
  },
];

const FaqItem = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className={`rounded-xl border transition-all duration-300 overflow-hidden ${open ? 'border-primary/30 shadow-card' : 'border-border/50'}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left gap-4 hover:bg-muted/30 transition-colors"
      >
        <span className="font-semibold text-sm text-foreground">{q}</span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-48' : 'max-h-0'}`}>
        <p className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">{a}</p>
      </div>
    </div>
  );
};

const Contact = () => {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = (e) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => { setSending(false); setSent(true); }, 1500);
  };

  return (
    <div className="min-h-screen bg-background">

      {/* ── Aurora header ─────────────────────────────────── */}
      <section className="relative bg-gradient-aurora py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/15 to-transparent" />
        <div className="absolute inset-0 bg-pattern-dots opacity-20" />
        <div className="absolute top-10 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-10 right-10 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-md text-white text-sm font-semibold mb-6 border border-white/30">
            <MessageCircle className="h-4 w-4" />
            We're here to help
          </div>
          <h1 className="text-5xl md:text-7xl font-display font-bold text-white mb-4 leading-tight">
            Get In Touch
          </h1>
          <p className="text-white/85 text-xl max-w-xl mx-auto font-light">
            Have a question or need support? Our team typically responds within 2 hours.
          </p>
        </div>
      </section>

      {/* ── Quick stats ───────────────────────────────────── */}
      <section className="py-8 px-4 bg-muted/30 border-b border-border/50">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-3 gap-6">
            {[
              { icon: Zap, label: 'Avg. Response', value: '< 2 hrs' },
              { icon: Users, label: 'Happy Users', value: '15,000+' },
              { icon: Shield, label: 'Uptime SLA', value: '99.9%' },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-primary mb-2 shadow-lg">
                  <s.icon className="h-5 w-5 text-white" />
                </div>
                <div className="text-2xl font-bold font-display text-foreground">{s.value}</div>
                <div className="text-xs text-muted-foreground font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-16">

        {/* ── Main grid ─────────────────────────────────── */}
        <div className="grid lg:grid-cols-5 gap-8 mb-16">

          {/* Contact info — 2 cols */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-2xl font-display font-bold mb-6">Contact Details</h2>

            {[
              { icon: Mail, title: 'Email Us', detail: 'support@typeaware.com', sub: 'For general inquiries and support' },
              { icon: Phone, title: 'Call Us', detail: '+91 xxxxxxxxxx', sub: 'Mon–Fri, 9 AM – 6 PM IST' },
              { icon: MapPin, title: 'Our Office', detail: 'Remote-first company', sub: 'Global team — no physical office' },
              { icon: Clock, title: 'Business Hours', detail: 'Mon–Fri: 9 AM – 6 PM', sub: 'Weekends: Emergency support only' },
            ].map((item, i) => (
              <Card key={i} className="border-border/50 shadow-card hover-lift group">
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-gradient-primary flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                    <item.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">{item.title}</p>
                    <p className="text-sm text-foreground/80 font-medium">{item.detail}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.sub}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Contact form — 3 cols */}
          <div className="lg:col-span-3">
            <h2 className="text-2xl font-display font-bold mb-6">Send a Message</h2>

            {sent ? (
              <Card className="border-emerald-200 dark:border-emerald-900/50 shadow-elegant animate-scale-in">
                <CardContent className="p-10 text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-security flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <Send className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-display font-bold text-foreground mb-2">Message Sent!</h3>
                  <p className="text-muted-foreground mb-6">Thank you for reaching out. We'll get back to you within 2 hours.</p>
                  <Button variant="outline" onClick={() => { setSent(false); setForm({ name: '', email: '', subject: '', message: '' }); }}>Send Another</Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border/50 shadow-elegant">
                <CardContent className="p-8">
                  <form onSubmit={handleSend} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground">Your Name</label>
                        <input
                          type="text"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          className="w-full px-4 py-3 border border-border rounded-xl bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm"
                          placeholder="Jane Smith"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground">Email Address</label>
                        <input
                          type="email"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          className="w-full px-4 py-3 border border-border rounded-xl bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm"
                          placeholder="jane@example.com"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-foreground">Subject</label>
                      <input
                        type="text"
                        value={form.subject}
                        onChange={(e) => setForm({ ...form, subject: e.target.value })}
                        className="w-full px-4 py-3 border border-border rounded-xl bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm"
                        placeholder="How can we help?"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-foreground">Message</label>
                      <textarea
                        rows={6}
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        className="w-full px-4 py-3 border border-border rounded-xl bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm resize-none"
                        placeholder="Tell us more about your inquiry..."
                        required
                      />
                    </div>

                    <Button type="submit" className="w-full py-6 rounded-xl text-base font-semibold" disabled={sending}>
                      {sending ? (
                        <span className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Sending...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Send className="h-4 w-4" />
                          Send Message
                        </span>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* ── FAQ ───────────────────────────────────────── */}
        <div>
          <div className="text-center mb-10">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 px-4 py-1.5">FAQ</Badge>
            <h2 className="text-4xl font-display font-bold mb-3">Frequently Asked Questions</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Quick answers to the most common questions about TypeAware</p>
          </div>
          <div className="max-w-3xl mx-auto space-y-3">
            {FAQS.map((faq, i) => <FaqItem key={i} {...faq} />)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
