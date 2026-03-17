import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import {
  Shield, Sparkles, AlertTriangle, Info, Zap, CheckCircle,
  RefreshCw, Copy, ArrowRight, Terminal, Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

function parseResult(raw) {
  if (!raw) return null;
  const get = (key) => {
    const rx = new RegExp(`${key}:\\s*(.+)`, 'i');
    const m  = raw.match(rx);
    return m ? m[1].trim() : null;
  };
  return {
    category:    get('Category'),
    severity:    get('Severity'),
    score:       parseFloat(get('Toxicity Score') || '0'),
    explanation: get('Explanation'),
    suggestion:  get('Suggestion'),
  };
}

const SEVERITY_CONFIG = {
  low:      { badge: 'badge-success',  bar: 'bg-security', label: 'Low Risk' },
  medium:   { badge: 'badge-warning',  bar: 'bg-warning',  label: 'Medium Risk' },
  high:     { badge: 'badge-warning',  bar: 'bg-warning',  label: 'High Risk' },
  critical: { badge: 'badge-danger',   bar: 'bg-danger',   label: 'Critical' },
};

function getSeverityKey(sev) {
  const s = (sev || '').toLowerCase();
  if (s === 'critical') return 'critical';
  if (s === 'high')     return 'high';
  if (s === 'medium' || s === 'moderate') return 'medium';
  return 'low';
}

const EXAMPLES = [
  { label: 'Harassment',  text: "You're absolutely worthless and nobody likes you. Get off this platform!" },
  { label: 'Clean text',  text: "Great post! Really appreciated your perspective on this topic. Thanks for sharing." },
  { label: 'Hate speech', text: "People like you don't deserve to be here. Go back where you came from." },
];

const FEATURE_CHIPS = [
  { icon: Shield,      label: 'Threat detection',    color: 'text-primary',  bg: 'bg-primary/10' },
  { icon: Zap,         label: 'Sub-second analysis',  color: 'text-accent',   bg: 'bg-accent/10' },
  { icon: Sparkles,    label: 'Rephrase suggestions', color: 'text-warning',  bg: 'bg-warning/10' },
  { icon: Lock,        label: 'Privacy-first',        color: 'text-security', bg: 'bg-security/10' },
];

export default function Demo() {
  const navigate = useNavigate();
  const [userText, setUserText] = useState('');
  const [parsed,   setParsed]   = useState(null);
  const [rephraseResult, setRephraseResult] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [demoError, setDemoError] = useState('');

  const getRephrase = useCallback(async (text) => {
    try {
      const res = await api.post('/ai/rephrase', { message: text });
      const d   = res.data;
      if (d.success && d.data?.suggestions?.length > 0)
        setRephraseResult(d.data.suggestions[0].suggested_text);
      else setRephraseResult('');
    } catch { setRephraseResult(''); }
  }, []);

  const analyzeText = useCallback(async (text) => {
    if (!text.trim()) { setParsed(null); setRephraseResult(''); setDemoError(''); return; }
    setIsAnalyzing(true);
    try {
      const res = await api.post('/analyze', { content: text });
      const d   = res.data;
      if (d.success && d.data) {
        const p = parseResult(
          `Category: ${d.data.category ?? 'safe'}\nSeverity: ${d.data.severity ?? 'low'}\nToxicity Score: ${d.data.toxicity_score ?? 0}\nExplanation: ${d.data.explanation ?? d.data.message ?? 'No explanation available.'}\nSuggestion: ${d.data.suggestion ?? ''}`
        );
        setParsed(p);
        const cat = (d.data.category || '').toLowerCase();
        const sev = (d.data.severity || '').toLowerCase();
        if (cat.includes('bullying') || cat.includes('harassment') || sev === 'high' || sev === 'critical')
          await getRephrase(text);
        else setRephraseResult('');
        setDemoError('');
      } else {
        setParsed(null);
        setDemoError('Unexpected response from analysis service.');
      }
    } catch (err) {
      setParsed(null);
      setDemoError(err?.message || 'Failed to analyze text. Check backend connection.');
    }
    finally { setIsAnalyzing(false); }
  }, [getRephrase]);

  useEffect(() => {
    const t = setTimeout(() => analyzeText(userText), 500);
    return () => clearTimeout(t);
  }, [userText, analyzeText]);

  const handleExampleClick = (text) => {
    setUserText(text);
    analyzeText(text);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(rephraseResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sevKey    = getSeverityKey(parsed?.severity);
  const sevConfig = SEVERITY_CONFIG[sevKey];
  const scorePct  = Math.round((parsed?.score || 0) * 100);

  return (
    <div className="min-h-screen bg-background">

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-grid-dark" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/6 via-transparent to-transparent" />
        <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-primary/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-accent/6 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary/10 border border-primary/25 text-primary text-xs font-semibold mb-6 animate-fade-in">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
            </span>
            Live AI Demo — No signup required
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-4 leading-tight animate-fade-in delay-100">
            Try <span className="text-gradient-primary">TypeAware</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto animate-fade-in delay-200">
            Paste any text to analyse it for toxicity, harassment, and harmful content — instantly.
          </p>
        </div>
      </section>

      {/* ── Feature chips ─────────────────────────────────── */}
      <section className="py-5 px-4 border-y border-border bg-card">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-center gap-3">
          {FEATURE_CHIPS.map((f, i) => (
            <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-border ${f.bg}`}>
              <f.icon className={`h-4 w-4 ${f.color}`} />
              <span className="text-sm font-medium text-foreground">{f.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Demo workspace ────────────────────────────────── */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">

          {/* Examples */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Try:</span>
            {EXAMPLES.map((ex, i) => (
              <button
                key={i}
                onClick={() => handleExampleClick(ex.text)}
                className="text-xs px-3 py-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 transition-all"
              >
                {ex.label}
              </button>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-5">

            {/* Input panel */}
            <div className="ta-card overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border bg-secondary">
                <Terminal className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Text Input</span>
              </div>
              <div className="p-5">
                <div className="relative">
                  <textarea
                    placeholder="Paste or type any text to analyse for harmful content…"
                    value={userText}
                    onChange={(e) => setUserText(e.target.value)}
                    rows={14}
                    className="ta-input resize-none font-mono text-xs leading-relaxed"
                  />
                  {userText && (
                    <div className="absolute bottom-3 right-3 flex items-center gap-2">
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md border border-border">
                        {userText.length} chars
                      </span>
                      <button
                        onClick={() => setUserText('')}
                        className="text-xs text-muted-foreground hover:text-foreground bg-muted px-2 py-1 rounded-md border border-border transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Results panel */}
            <div className="ta-card overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border bg-secondary">
                <Shield className="h-4 w-4 text-security" />
                <span className="text-sm font-semibold text-foreground">Analysis Results</span>
                {isAnalyzing && (
                  <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
                    <div className="w-3 h-3 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                    Scanning…
                  </div>
                )}
              </div>

              <div className="p-5">
                {demoError && !isAnalyzing && (
                  <div className="mb-4 p-3 rounded-md border border-danger/30 bg-danger/10 text-danger text-xs">
                    {demoError}
                  </div>
                )}
                {isAnalyzing ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                      <Shield className="absolute inset-0 m-auto h-6 w-6 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground font-mono">Analysing content…</p>
                  </div>
                ) : parsed ? (
                  <div className="space-y-4 animate-fade-in">
                    {/* Score */}
                    <div className="ta-panel p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Toxicity Score</span>
                        <span className="text-2xl font-bold font-mono text-foreground tab-nums">{scorePct}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${sevConfig.bar}`}
                          style={{ width: `${scorePct}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1.5 text-xs text-muted-foreground">
                        <span>Safe</span><span>Toxic</span>
                      </div>
                    </div>

                    {/* Category + Severity */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="ta-panel p-3 rounded-lg">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Category</p>
                        <span className="badge-primary text-xs">{parsed.category || 'N/A'}</span>
                      </div>
                      <div className="ta-panel p-3 rounded-lg">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Severity</p>
                        <span className={`${sevConfig.badge} text-xs`}>{sevConfig.label}</span>
                      </div>
                    </div>

                    {/* Explanation */}
                    {parsed.explanation && (
                      <div className="ta-panel p-4 rounded-lg">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Explanation</p>
                        <p className="text-sm text-foreground leading-relaxed">{parsed.explanation}</p>
                      </div>
                    )}

                    {/* Suggestion */}
                    {parsed.suggestion && (
                      <div className="p-4 rounded-lg bg-primary/8 border border-primary/20">
                        <p className="text-[10px] font-semibold text-primary uppercase tracking-widest mb-2">Suggestion</p>
                        <p className="text-sm text-foreground leading-relaxed">{parsed.suggestion}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                    <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center">
                      <Info className="h-7 w-7 text-muted-foreground/40" />
                    </div>
                    <p className="text-sm font-medium text-foreground">No text entered yet</p>
                    <p className="text-xs text-muted-foreground">Type above or pick an example</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Rephrase result */}
          {rephraseResult && (
            <div className="mt-5 ta-card p-5 animate-slide-up">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-security/15 border border-security/25 flex items-center justify-center flex-shrink-0">
                  <RefreshCw className="h-5 w-5 text-security" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-foreground">Suggested Rephrasing</h3>
                    <Button variant="ghost" size="sm" onClick={handleCopy} className="gap-1.5 text-xs h-7">
                      <Copy className="h-3.5 w-3.5" />
                      {copied ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{rephraseResult}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────── */}
      <section className="py-10 px-4 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto">
          <div className="ta-panel rounded-lg p-6 flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/25 flex items-center justify-center flex-shrink-0">
              <Info className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1.5">How the Analysis Works</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Our AI analyses text using advanced NLP models trained on millions of examples. It detects toxicity,
                harassment, hate speech, and other harmful content by understanding context, tone, and intent — not
                just keywords. All analysis is performed server-side with zero data retention.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-dark opacity-60" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-xl h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Ready to <span className="text-gradient-primary">Protect</span> Your Community?
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Sign up free and deploy real-time protection across all your platforms.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" className="gap-2 shadow-blue" onClick={() => navigate('/signup')}>
              <Shield className="h-4 w-4" />
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg" className="gap-2" onClick={() => navigate('/extension')}>
              Download Extension
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
