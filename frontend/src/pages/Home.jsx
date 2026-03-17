import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import {
  Shield, Eye, Users, BarChart3, Zap, Lock, ArrowRight,
  CheckCircle, Brain, Chrome, Globe, Terminal, Activity,
  AlertTriangle, Play, Download
} from 'lucide-react';
import { downloadExtension } from '@/utils/extensionDownload';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

/* ── Animated counter ──────────────────────────────────────── */
function useCounter(target, duration = 1600, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let t0 = null;
    const step = (ts) => {
      if (!t0) t0 = ts;
      const p = Math.min((ts - t0) / duration, 1);
      setCount(Math.floor(p * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

const PLATFORMS = [
  'Twitter / X', 'YouTube', 'Reddit', 'Facebook', 'Discord',
  'Instagram', 'LinkedIn', 'Twitch', 'TikTok', 'Telegram',
];

const FEATURES = [
  {
    icon: Eye,
    title: 'Real-Time Detection',
    desc: 'AI monitors content as you type and browse, flagging harmful material instantly.',
    accent: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/20',
  },
  {
    icon: Lock,
    title: 'Privacy First',
    desc: 'All analysis happens on-device. Your data never leaves your browser.',
    accent: 'text-security',
    bg: 'bg-security/10',
    border: 'border-security/20',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    desc: 'Comprehensive reporting, trend analysis, and moderation insights.',
    accent: 'text-accent',
    bg: 'bg-accent/10',
    border: 'border-accent/20',
  },
  {
    icon: Brain,
    title: 'AI-Powered Engine',
    desc: 'NLP models trained on millions of examples with 99% detection accuracy.',
    accent: 'text-warning',
    bg: 'bg-warning/10',
    border: 'border-warning/20',
  },
];

const STEPS = [
  { n: '01', title: 'Install Extension',  desc: 'Add TypeAware to Chrome in under 2 minutes.' },
  { n: '02', title: 'Browse Normally',    desc: 'TypeAware silently monitors in the background.' },
  { n: '03', title: 'Get Alerted',        desc: 'Instant, non-intrusive alerts on harmful content.' },
  { n: '04', title: 'Take Action',        desc: 'Report, rephrase or dismiss with one click.' },
];

/* ── Scanner mockup data ───────────────────────────────────── */
const SCAN_LINES = [
  { text: 'Initializing content scanner…',  delay: 0 },
  { text: 'Loading NLP model v4.2…',        delay: 400 },
  { text: 'Connecting to detection API…',   delay: 800 },
  { text: 'Ready. Monitoring active.',       delay: 1200 },
];

export default function Home() {
  const { toast } = useToast();
  const navigate  = useNavigate();
  const statsRef  = useRef(null);
  const [statsOn, setStatsOn] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setStatsOn(true); },
      { threshold: 0.3 }
    );
    if (statsRef.current) obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, []);

  const users     = useCounter(15420, 1600, statsOn);
  const threats   = useCounter(89650, 1600, statsOn);
  const accuracy  = useCounter(99, 1200, statsOn);
  const platforms = useCounter(9, 900, statsOn);

  const handleDownload = async () => {
    toast({ title: 'Preparing download…' });
    const ok = await downloadExtension();
    if (!ok) toast({ variant: 'destructive', title: 'Download failed', description: 'Please try again.' });
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">

      {/* ══ HERO ══════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center px-4 py-24 overflow-hidden">
        {/* Backgrounds */}
        <div className="absolute inset-0 bg-grid-dark opacity-100" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-primary/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/6 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto w-full relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: copy */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary/10 border border-primary/25 text-primary text-xs font-semibold mb-6 animate-fade-in">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
                </span>
                AI-Powered Content Moderation
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-[1.05] tracking-tight animate-fade-in delay-100">
                Protect Your
                <span className="block text-gradient-primary mt-1">Digital Space</span>
              </h1>

              <p className="text-lg text-muted-foreground mb-8 max-w-lg leading-relaxed animate-fade-in delay-200">
                TypeAware uses advanced AI to detect, flag, and moderate toxic content in real-time —
                across every platform you use.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 animate-fade-in delay-300">
                <Link to="/demo">
                  <Button size="lg" className="gap-2 shadow-blue">
                    <Play className="h-4 w-4 fill-current" />
                    Try Demo Free
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="lg"
                  className="gap-2"
                  onClick={handleDownload}
                >
                  <Chrome className="h-4 w-4" />
                  Get Extension
                </Button>
              </div>

              <p className="text-xs text-muted-foreground mt-4 animate-fade-in delay-400">
                No credit card · Free forever · 5-min setup
              </p>
            </div>

            {/* Right: terminal mockup */}
            <div className="animate-fade-in delay-500">
              <div className="ta-card rounded-xl overflow-hidden border-border/60">
                {/* Window chrome */}
                <div className="flex items-center gap-2 px-4 py-3 bg-secondary border-b border-border">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-danger/60" />
                    <div className="w-3 h-3 rounded-full bg-warning/60" />
                    <div className="w-3 h-3 rounded-full bg-security/60" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-muted text-xs text-muted-foreground border border-border">
                      <Terminal className="h-3 w-3" />
                      typeaware — scanner
                    </div>
                  </div>
                </div>

                {/* Terminal content */}
                <div className="p-5 font-mono text-sm space-y-3 bg-muted/20">
                  {SCAN_LINES.map((line, i) => (
                    <div key={i} className="flex items-center gap-2 text-muted-foreground">
                      <span className="text-security">›</span>
                      <span>{line.text}</span>
                    </div>
                  ))}

                  <div className="border-t border-border/50 pt-3 mt-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">
                      Input text
                    </p>
                    <div className="p-3 rounded-lg bg-background border border-border text-xs text-muted-foreground leading-relaxed">
                      "You should just disappear. Nobody wants you here and you're completely worthless…"
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    {/* Toxicity bar */}
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Toxicity score</span>
                      <span className="text-danger font-bold font-mono">84%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full w-[84%] bg-gradient-to-r from-warning to-danger rounded-full" />
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      <span className="badge-danger">Harassment</span>
                      <span className="badge-warning">Cyberbullying</span>
                      <span className="badge-danger">High Severity</span>
                    </div>

                    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-danger/10 border border-danger/25 mt-2">
                      <AlertTriangle className="h-4 w-4 text-danger flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-foreground">
                        <span className="font-semibold text-danger">Flagged:</span>{' '}
                        "disappear", "worthless", "nobody wants you"
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer status */}
                <div className="px-5 py-3 bg-secondary border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-security opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-security" />
                    </span>
                    TypeAware Active
                  </div>
                  <span>Analysed in 142ms</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ PLATFORM MARQUEE ══════════════════════════════════ */}
      <section className="py-6 border-y border-border bg-card overflow-hidden">
        <div className="flex items-center gap-3 justify-center mb-3">
          <div className="h-px w-24 bg-border" />
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-widest">
            Works across every platform
          </p>
          <div className="h-px w-24 bg-border" />
        </div>
        <div className="relative flex overflow-hidden">
          <div className="flex gap-10 animate-marquee whitespace-nowrap">
            {[...PLATFORMS, ...PLATFORMS].map((p, i) => (
              <div key={i} className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                <CheckCircle className="h-3.5 w-3.5 text-security" />
                {p}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ STATS ═════════════════════════════════════════════ */}
      <section ref={statsRef} className="py-20 px-4 relative">
        <div className="absolute inset-0 bg-dot-dark opacity-40" />
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-12">
            <div className="section-chip mb-4">By the Numbers</div>
            <h2 className="text-4xl font-bold text-foreground">Trusted at Scale</h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { value: users,     suffix: '+', label: 'Active Users',         icon: Users,    color: 'text-primary' },
              { value: threats,   suffix: '+', label: 'Threats Detected',     icon: Shield,   color: 'text-danger' },
              { value: accuracy,  suffix: '%', label: 'Detection Accuracy',   icon: Activity, color: 'text-security' },
              { value: platforms, suffix: '+', label: 'Platforms Supported',  icon: Globe,    color: 'text-accent' },
            ].map((stat, i) => (
              <div key={i} className="ta-card p-6 text-center hover-lift">
                <stat.icon className={`h-6 w-6 ${stat.color} mx-auto mb-3`} />
                <div className={`text-4xl font-bold mb-1 tab-nums ${stat.color}`}>
                  {statsOn ? stat.value.toLocaleString() : '0'}{stat.suffix}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FEATURES ══════════════════════════════════════════ */}
      <section className="py-20 px-4 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <div className="section-chip mb-4">Core Features</div>
            <h2 className="text-4xl font-bold text-foreground mb-3">
              Everything You Need
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              A complete protection suite that works silently in the background
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className={`ta-card p-6 hover-lift border ${f.border} group`}
              >
                <div className={`w-10 h-10 rounded-lg ${f.bg} ${f.border} border flex items-center justify-center mb-4`}>
                  <f.icon className={`h-5 w-5 ${f.accent}`} />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══════════════════════════════════════ */}
      <section className="py-20 px-4 relative">
        <div className="absolute inset-0 bg-grid-dark opacity-60" />
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-14">
            <div className="section-chip mb-4">Simple Setup</div>
            <h2 className="text-4xl font-bold text-foreground mb-3">Up & Running in Minutes</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Four steps to a safer browsing experience</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 relative">
            {/* Connector line */}
            <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-px bg-border z-0" />
            {STEPS.map((step, i) => (
              <div key={i} className="ta-card p-6 relative z-10 hover-lift">
                <div className="w-10 h-10 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center mb-4">
                  <span className="text-sm font-bold text-primary font-mono">{step.n}</span>
                </div>
                <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA ═══════════════════════════════════════════════ */}
      <section className="py-24 px-4 bg-card border-t border-border relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-dark opacity-50" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-xl h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <div className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center mx-auto mb-6">
            <Shield className="h-6 w-6 text-primary animate-pulse-glow" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
            Start Protecting Your{' '}
            <span className="text-gradient-primary">Community</span>
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-lg mx-auto">
            Join 15,000+ users already using TypeAware to detect and block harmful content.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
            <Link to="/signup">
              <Button size="lg" className="gap-2 min-w-44 shadow-blue">
                <Lock className="h-4 w-4" />
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/demo">
              <Button variant="outline" size="lg" className="gap-2 min-w-44">
                <Eye className="h-4 w-4" />
                Try Demo
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap gap-5 justify-center">
            {['Free forever plan', 'No credit card', '5-min setup', 'Privacy guaranteed'].map((item) => (
              <div key={item} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <CheckCircle className="h-3.5 w-3.5 text-security" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
