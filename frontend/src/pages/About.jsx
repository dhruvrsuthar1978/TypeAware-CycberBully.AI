import { Link } from 'react-router-dom';
import {
  Shield, Target, Users, Brain, Lock, Zap, Globe,
  CheckCircle, Award, TrendingUp, ArrowRight, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const missions = [
  {
    icon: Target,
    title: 'Our Mission',
    desc: 'To create safer digital communities through intelligent, privacy-first content moderation and real-time threat detection.',
    color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20',
  },
  {
    icon: Brain,
    title: 'Our Technology',
    desc: 'Advanced AI and machine learning algorithms that work entirely on-device, ensuring privacy while maintaining accuracy.',
    color: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/20',
  },
  {
    icon: Users,
    title: 'Our Community',
    desc: 'Building a collaborative network of users, moderators, and platforms working together for digital safety.',
    color: 'text-security', bg: 'bg-security/10', border: 'border-security/20',
  },
];

const features = [
  {
    icon: Lock,
    title: 'Privacy by Design',
    desc: 'All detection happens locally on your device. No personal data is ever transmitted or stored on our servers.',
    highlight: true,
    color: 'text-primary', bg: 'bg-primary/10',
  },
  {
    icon: Zap,
    title: 'Real-Time Analysis',
    desc: 'Instant content evaluation as you browse, with zero noticeable latency impact on your browsing experience.',
    color: 'text-yellow-500', bg: 'bg-yellow-500/10',
  },
  {
    icon: Eye,
    title: 'Transparent AI',
    desc: 'Every decision comes with a clear explanation so you always understand why content was flagged.',
    color: 'text-accent', bg: 'bg-accent/10',
  },
  {
    icon: Globe,
    title: 'Global Standards',
    desc: 'Built on internationally recognised content safety guidelines, supporting moderation across languages and regions.',
    color: 'text-security', bg: 'bg-security/10',
  },
];

const stats = [
  { icon: Shield, value: '99.2%', label: 'Detection Accuracy' },
  { icon: TrendingUp, value: '10M+', label: 'Pages Analysed' },
  { icon: Users, value: '50K+', label: 'Active Users' },
  { icon: Award, value: '#1', label: 'Rated Extension' },
];

export default function About() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Shield className="w-4 h-4" />
            About TypeAware
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Making the Web Safer,{' '}
            <span className="text-primary">One Page at a Time</span>
          </h1>
          <p className="text-muted-foreground text-lg mb-8">
            TypeAware is a privacy-first browser extension that uses on-device AI to detect
            harmful content in real time — keeping you and your community safe without
            compromising your data.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button asChild>
              <Link to="/dashboard">
                Get Started <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-4 border-y border-border">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map(({ icon: Icon, value, label }) => (
            <div key={label} className="flex flex-col items-center gap-2 text-center">
              <Icon className="w-6 h-6 text-primary" />
              <span className="text-3xl font-bold">{value}</span>
              <span className="text-sm text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">What Drives Us</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {missions.map(({ icon: Icon, title, desc, color, bg, border }) => (
              <div
                key={title}
                className={`p-6 rounded-xl border ${border} ${bg} flex flex-col gap-4`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${bg}`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <h3 className={`font-semibold text-lg ${color}`}>{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Built Different</h2>
          <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
            Everything we build starts with two principles: your privacy and your safety.
          </p>
          <div className="grid sm:grid-cols-2 gap-6">
            {features.map(({ icon: Icon, title, desc, color, bg, highlight }) => (
              <div
                key={title}
                className={`p-6 rounded-xl border border-border bg-card flex gap-4 ${highlight ? 'ring-1 ring-primary/30' : ''}`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${bg}`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{title}</h3>
                    {highlight && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                        Core
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <CheckCircle className="w-12 h-12 text-primary mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4">Ready to Browse Safely?</h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of users who trust TypeAware to keep their online experience safe and private.
          </p>
          <Button size="lg" asChild>
            <Link to="/dashboard">
              Start for Free <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
