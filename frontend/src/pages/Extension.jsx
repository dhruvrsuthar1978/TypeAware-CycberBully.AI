import { Download, Shield, Zap, Lock, Globe, CheckCircle, Chrome, Sparkles, TrendingUp, Share, FileText, Bug, ArrowRight, Star, Users, AlertTriangle, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { downloadExtension as downloadExtensionUtil } from '@/utils/extensionDownload';

/* ─── data ─────────────────────────────────────── */
const features = [
  {
    icon: Zap,
    title: 'Real-Time Detection',
    description: 'Instant threat analysis as you type — zero perceptible lag on any platform.',
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10',
    border: 'border-yellow-400/20',
  },
  {
    icon: Lock,
    title: 'Privacy by Design',
    description: 'All processing happens locally in your browser. Nothing is ever sent to our servers.',
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/20',
  },
  {
    icon: Globe,
    title: 'Cross-Platform',
    description: 'Works on Twitter/X, YouTube, Reddit, Facebook, Instagram and more.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-400/10',
    border: 'border-cyan-400/20',
  },
  {
    icon: Shield,
    title: 'Smart Suggestions',
    description: 'Receive alternative phrasing tips when potentially harmful content is detected.',
    color: 'text-accent',
    bg: 'bg-accent/10',
    border: 'border-accent/20',
  },
];

const steps = [
  { number: '1', title: 'Download', description: 'Click "Download Extension" to grab the latest zip.' },
  { number: '2', title: 'Open Extensions', description: 'Go to chrome://extensions and enable Developer Mode.' },
  { number: '3', title: 'Load Unpacked', description: 'Click "Load unpacked" and select the extracted folder.' },
  { number: '4', title: 'Start Browsing', description: 'TypeAware activates automatically on supported sites.' },
];

const platforms = [
  { name: 'Twitter / X',  supported: true  },
  { name: 'YouTube',      supported: true  },
  { name: 'Reddit',       supported: true  },
  { name: 'Facebook',     supported: true  },
  { name: 'Instagram',    supported: true  },
  { name: 'Discord',      supported: false },
];

const stats = [
  { icon: Users,      value: '50K+',   label: 'Active Users'       },
  { icon: TrendingUp, value: '10M+',   label: 'Pages Analysed'     },
  { icon: Shield,     value: '99.2%',  label: 'Detection Accuracy' },
  { icon: Star,       value: '4.9 ★',  label: 'User Rating'        },
];

/* ─── Mock Extension Popup ──────────────────────── */
function ExtensionMockup() {
  return (
    <div className="relative mx-auto w-[280px]">
      {/* Glow */}
      <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-110 pointer-events-none" />

      {/* Popup shell */}
      <div className="relative rounded-2xl border border-border bg-card shadow-dramatic overflow-hidden">
        {/* Header bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/50">
          <Shield className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">TypeAware</span>
          <span className="ml-auto badge-success text-[10px]">Active</span>
        </div>

        {/* Status card */}
        <div className="p-4 space-y-3">
          <div className="rounded-xl border border-primary/20 bg-primary/8 p-3 text-center">
            <div className="text-2xl font-bold text-primary mb-0.5">99.2%</div>
            <div className="text-[11px] text-muted-foreground">Detection Accuracy</div>
          </div>

          {/* Detection rows */}
          {[
            { label: 'Hate Speech', value: 'None', ok: true },
            { label: 'Toxicity',    value: 'None', ok: true },
            { label: 'Threat',      value: 'None', ok: true },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{row.label}</span>
              <span className="flex items-center gap-1 text-[hsl(var(--security))] font-medium">
                <CheckCircle className="w-3 h-3" />
                {row.value}
              </span>
            </div>
          ))}

          {/* Divider */}
          <div className="border-t border-border pt-2">
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <Lock className="w-3 h-3 text-primary" />
              All processing is local
            </div>
          </div>
        </div>

        {/* Alert row */}
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 px-3 py-2 text-[11px] text-yellow-400">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            Text analysed in real-time
          </div>
        </div>
      </div>

      {/* Floating badges */}
      <div className="absolute -top-3 -right-4 badge-success text-[10px] shadow-md animate-float">
        <Eye className="w-3 h-3" /> Watching
      </div>
      <div className="absolute -bottom-3 -left-4 badge-primary text-[10px] shadow-md animate-float" style={{ animationDelay: '1.5s' }}>
        <Zap className="w-3 h-3" /> Real-Time
      </div>
    </div>
  );
}

/* ─── Page ──────────────────────────────────────── */
const Extension = () => {
  const { toast } = useToast();

  const handleDownload = async () => {
    toast({ title: 'Preparing Download…', description: 'Extension files are being packaged.' });
    const ok = await downloadExtensionUtil();
    if (ok) {
      toast({ title: 'Download Started', description: 'Check your downloads folder.', variant: 'success' });
    } else {
      toast({ title: 'Download Failed', description: 'Please try again.', variant: 'destructive' });
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'TypeAware Extension',
        text: 'Check out TypeAware — AI-powered content moderation for safer browsing.',
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: 'Link Copied', description: 'Page URL copied to clipboard.' });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── Hero ──────────────────────────────────────── */}
      <section className="relative pt-24 pb-20 px-4 overflow-hidden border-b border-border">
        {/* Subtle background grid */}
        <div className="absolute inset-0 bg-grid-dark pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          {/* Copy */}
          <div>
            <div className="inline-flex items-center gap-2 section-chip mb-6">
              <Chrome className="w-3.5 h-3.5" />
              Chrome Extension
            </div>

            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
              Browse the Web
              <br />
              <span className="text-gradient-primary">Without the Hate</span>
            </h1>

            <p className="text-muted-foreground text-lg leading-relaxed mb-8 max-w-lg">
              TypeAware is a privacy-first browser extension that uses on-device AI to detect
              harmful content in real time — keeping you safe without compromising your data.
            </p>

            <div className="flex flex-wrap gap-3">
              <Button onClick={handleDownload} size="lg" className="gap-2 shadow-glow">
                <Download className="w-4 h-4" />
                Download Extension
              </Button>
              <Button onClick={handleShare} variant="outline" size="lg" className="gap-2">
                <Share className="w-4 h-4" />
                Share
              </Button>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-3 mt-6">
              {['Privacy First', 'Open Source', 'Free Forever'].map(tag => (
                <Badge key={tag} variant="secondary" className="gap-1.5 py-1 px-3">
                  <CheckCircle className="w-3 h-3 text-[hsl(var(--security))]" />
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Mockup */}
          <div className="flex justify-center">
            <ExtensionMockup />
          </div>
        </div>
      </section>

      {/* ── Stats bar ─────────────────────────────────── */}
      <section className="py-10 px-4 border-b border-border bg-card/50">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map(({ icon: Icon, value, label }) => (
            <div key={label} className="flex flex-col items-center gap-1.5 text-center">
              <Icon className="w-5 h-5 text-primary mb-1" />
              <span className="text-2xl font-bold">{value}</span>
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ──────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 section-chip mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              Features
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Built Different</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Every feature starts with two principles: your privacy and your safety.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {features.map(({ icon: Icon, title, description, color, bg, border }) => (
              <div
                key={title}
                className={`ta-card hover-lift p-6 flex gap-4 border ${border}`}
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center mt-8">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => window.open('/docs', '_blank')}
            >
              <FileText className="w-4 h-4" />
              View Full Documentation
            </Button>
          </div>
        </div>
      </section>

      {/* ── How to Install ────────────────────────────── */}
      <section className="py-20 px-4 bg-muted/20 border-y border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 section-chip mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              Easy Setup
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Up and Running in Minutes</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              No account required. No telemetry. Just download, load, and go.
            </p>
          </div>

          {/* Steps with connecting line */}
          <div className="relative">
            {/* Connector line — desktop only */}
            <div className="hidden md:block absolute top-[26px] left-[calc(12.5%+20px)] right-[calc(12.5%+20px)] h-px bg-border z-0" />

            <div className="grid md:grid-cols-4 gap-6 relative z-10">
              {steps.map((step, i) => (
                <div key={i} className="flex flex-col items-center text-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow text-white font-bold text-lg border-4 border-background">
                    {step.number}
                  </div>
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center mt-12">
            <Button onClick={handleDownload} size="lg" className="gap-2 shadow-glow">
              <Download className="w-4 h-4" />
              Download Now
            </Button>
          </div>
        </div>
      </section>

      {/* ── Platform Support ──────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 section-chip mb-4">
              <Globe className="w-3.5 h-3.5" />
              Platform Support
            </div>
            <h2 className="text-3xl font-bold mb-3">Works Everywhere You Browse</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              TypeAware integrates seamlessly with your favourite platforms out of the box.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            {platforms.map(({ name, supported }) => (
              <div
                key={name}
                className={`ta-card flex items-center gap-3 px-4 py-3 ${!supported ? 'opacity-40' : ''}`}
              >
                {supported ? (
                  <CheckCircle className="w-4 h-4 text-[hsl(var(--security))] shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-muted-foreground shrink-0" />
                )}
                <span className="text-sm font-medium">{name}</span>
                {!supported && (
                  <span className="ml-auto text-[10px] text-muted-foreground">Soon</span>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-center mt-8">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => window.open('/report-issue', '_blank')}
            >
              <Bug className="w-4 h-4" />
              Report an Issue
            </Button>
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────── */}
      <section className="py-24 px-4 border-t border-border bg-card/40 relative overflow-hidden">
        <div className="absolute inset-0 bg-dot-dark pointer-events-none opacity-50" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[200px] bg-primary/10 blur-[80px] rounded-full pointer-events-none" />

        <div className="relative max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/15 border border-primary/25 mb-6 mx-auto">
            <TrendingUp className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Browse <span className="text-gradient-primary">Safer?</span>
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Join 50,000+ users who trust TypeAware for a cleaner, safer online experience.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button onClick={handleDownload} size="lg" className="gap-2 shadow-glow">
              <Download className="w-4 h-4" />
              Download Extension
            </Button>
            <Button onClick={handleShare} variant="outline" size="lg" className="gap-2">
              <Share className="w-4 h-4" />
              Share with a Friend
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Extension;
