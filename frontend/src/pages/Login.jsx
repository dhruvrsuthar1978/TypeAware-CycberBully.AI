import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, Eye, EyeOff, LogIn, AlertCircle, Zap, Users, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const STATS = [
  { value: '15K+', label: 'Protected users' },
  { value: '99%',  label: 'Detection accuracy' },
  { value: '89K+', label: 'Threats blocked' },
];

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '', isAdmin: false });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const result = await login(formData.email, formData.password, formData.isAdmin);
    if (result.success) {
      toast({ title: 'Welcome back', description: 'Signed in to TypeAware.' });
      navigate(formData.isAdmin ? '/admin' : '/dashboard');
    } else {
      toast({ variant: 'destructive', title: 'Sign in failed', description: result.error || 'Check your credentials.' });
    }
    setIsLoading(false);
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  return (
    <div className="min-h-screen flex bg-background">
      {/* ── Left panel ────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-5/12 flex-col relative overflow-hidden bg-card border-r border-border">
        {/* Grid background */}
        <div className="absolute inset-0 bg-grid-dark opacity-100" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />

        {/* Blue glow accent */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col h-full p-12">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group mb-auto">
            <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center">
              <Shield className="h-4.5 w-4.5 text-primary" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-lg text-foreground">TypeAware</span>
          </Link>

          <div className="my-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary/10 border border-primary/25 text-primary text-xs font-semibold mb-6">
              <Zap className="h-3.5 w-3.5" />
              AI-Powered Protection
            </div>

            <h2 className="text-3xl font-bold text-foreground mb-3 leading-tight">
              Secure your<br />digital space.
            </h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Real-time content moderation powered by advanced AI. Protecting communities across every platform.
            </p>

            {/* Features */}
            <div className="space-y-3 mb-8">
              {[
                'Real-time threat detection across platforms',
                'Privacy-first — no personal data stored',
                'AI trained on millions of examples',
              ].map((f, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle className="h-4 w-4 text-security mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">{f}</span>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {STATS.map((s) => (
                <div key={s.label} className="p-3 rounded-lg bg-secondary border border-border text-center">
                  <p className="text-lg font-bold text-foreground tab-nums">{s.value}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-auto">
            © {new Date().getFullYear()} TypeAware
          </p>
        </div>
      </div>

      {/* ── Right panel — form ────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative">
        <div className="absolute inset-0 bg-dot-dark opacity-40" />

        <div className="w-full max-w-md relative z-10">
          {/* Mobile logo */}
          <Link to="/" className="flex items-center gap-2.5 mb-8 lg:hidden w-fit">
            <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center">
              <Shield className="h-4 w-4 text-primary" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-foreground">TypeAware</span>
          </Link>

          <h1 className="text-2xl font-bold text-foreground mb-1">Sign in</h1>
          <p className="text-sm text-muted-foreground mb-8">
            New here?{' '}
            <Link to="/signup" className="text-primary hover:underline font-medium">
              Create a free account
            </Link>
          </p>

          <div className="ta-card p-6 space-y-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="ta-input pl-10"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">Password</label>
                  <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="ta-input pl-10 pr-10"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Admin toggle */}
              <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-secondary border border-border">
                <label htmlFor="isAdmin" className="text-sm text-muted-foreground cursor-pointer select-none">
                  Admin access
                </label>
                <Switch
                  id="isAdmin"
                  checked={formData.isAdmin}
                  onCheckedChange={(v) => setFormData({ ...formData, isAdmin: v })}
                />
              </div>

              <Button type="submit" className="w-full" size="default" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <LogIn className="h-4 w-4" />
                    Sign In
                  </span>
                )}
              </Button>
            </form>
          </div>

          <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-secondary border border-border">
            <AlertCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              All connections are encrypted. Your privacy is guaranteed.
            </p>
          </div>

          <div className="mt-5 text-center">
            <Link to="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
