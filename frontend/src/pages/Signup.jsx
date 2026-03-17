import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, User, Eye, EyeOff, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const pwRules = [
  { label: 'At least 8 characters',       test: (p) => p.length >= 8 },
  { label: 'One uppercase letter (A–Z)',   test: (p) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter (a–z)',   test: (p) => /[a-z]/.test(p) },
  { label: 'Three or more digits (0–9)',   test: (p) => /\d{3,}/.test(p) },
  { label: 'One special character (!@#$)', test: (p) => /[!@#$%^&*]/.test(p) },
];

const Signup = () => {
  const [form, setForm]           = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPw, setShowPw]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signup } = useAuth();
  const navigate   = useNavigate();
  const { toast }  = useToast();

  const failed   = pwRules.filter((r) => !r.test(form.password));
  const strength = Math.round(((pwRules.length - failed.length) / pwRules.length) * 100);
  const strengthColor =
    strength < 40 ? 'bg-danger' : strength < 80 ? 'bg-warning' : 'bg-security';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (failed.length > 0) {
      toast({ variant: 'destructive', title: 'Weak password', description: 'Please meet all requirements.' });
      return;
    }
    if (form.password !== form.confirm) {
      toast({ variant: 'destructive', title: 'Passwords do not match' });
      return;
    }
    setIsLoading(true);
    const result = await signup(form.name, form.email, form.password);
    if (result.success) {
      toast({ title: 'Account created!', description: 'Welcome to TypeAware.' });
      navigate('/dashboard');
    } else {
      toast({ variant: 'destructive', title: 'Signup failed', description: result.error });
    }
    setIsLoading(false);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <div className="min-h-screen flex bg-background">
      {/* ── Left branding ─────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-5/12 flex-col relative overflow-hidden bg-card border-r border-border">
        <div className="absolute inset-0 bg-grid-dark" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/8 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col h-full p-12">
          <Link to="/" className="flex items-center gap-2.5 group mb-auto">
            <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center">
              <Shield className="h-4.5 w-4.5 text-primary" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-lg text-foreground">TypeAware</span>
          </Link>

          <div className="my-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-security/10 border border-security/25 text-security text-xs font-semibold mb-6">
              <CheckCircle className="h-3.5 w-3.5" />
              Free Forever Plan
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-3 leading-tight">
              Join TypeAware.<br />Browse safely.
            </h2>
            <p className="text-muted-foreground mb-8 leading-relaxed text-sm">
              Create your free account and start detecting harmful content across all your platforms in minutes.
            </p>

            <div className="space-y-2.5">
              {[
                { label: 'No credit card required',        color: 'text-security' },
                { label: '5-minute setup',                 color: 'text-primary' },
                { label: 'Works on 9+ major platforms',    color: 'text-accent' },
                { label: 'Privacy-first architecture',     color: 'text-warning' },
              ].map((f) => (
                <div key={f.label} className="flex items-center gap-3">
                  <CheckCircle className={`h-4 w-4 flex-shrink-0 ${f.color}`} />
                  <span className="text-sm text-muted-foreground">{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-auto">© {new Date().getFullYear()} TypeAware</p>
        </div>
      </div>

      {/* ── Form panel ────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative overflow-y-auto">
        <div className="absolute inset-0 bg-dot-dark opacity-40" />

        <div className="w-full max-w-md relative z-10">
          {/* Mobile logo */}
          <Link to="/" className="flex items-center gap-2.5 mb-8 lg:hidden w-fit">
            <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center">
              <Shield className="h-4 w-4 text-primary" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-foreground">TypeAware</span>
          </Link>

          <h1 className="text-2xl font-bold text-foreground mb-1">Create account</h1>
          <p className="text-sm text-muted-foreground mb-8">
            Already registered?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">Sign in</Link>
          </p>

          <div className="ta-card p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="ta-input pl-10"
                    placeholder="Jane Smith"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className="ta-input pl-10"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    className="ta-input pl-10 pr-10"
                    placeholder="Create a strong password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {form.password && (
                  <div className="space-y-2 mt-2">
                    {/* Strength bar */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-400 ${strengthColor}`}
                          style={{ width: `${strength}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-8 text-right">{strength}%</span>
                    </div>
                    {/* Rules */}
                    <div className="grid grid-cols-2 gap-1">
                      {pwRules.map((rule, i) => (
                        <div
                          key={i}
                          className={`flex items-center gap-1.5 text-xs ${
                            rule.test(form.password) ? 'text-security' : 'text-muted-foreground'
                          }`}
                        >
                          <CheckCircle
                            className={`h-3 w-3 flex-shrink-0 ${
                              rule.test(form.password) ? 'text-security' : 'text-muted-foreground/40'
                            }`}
                          />
                          {rule.label}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    name="confirm"
                    value={form.confirm}
                    onChange={handleChange}
                    className={`ta-input pl-10 pr-10 ${
                      form.confirm && form.password !== form.confirm
                        ? 'border-danger/50 focus:border-danger/70'
                        : ''
                    }`}
                    placeholder="Repeat your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {form.confirm && form.password !== form.confirm && (
                  <p className="text-xs text-danger">Passwords do not match</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating account…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Create Free Account
                  </span>
                )}
              </Button>
            </form>
          </div>

          <p className="mt-4 text-xs text-muted-foreground text-center px-4">
            By signing up you agree to our{' '}
            <Link to="/terms-of-service" className="text-primary hover:underline">Terms</Link>
            {' '}and{' '}
            <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>.
          </p>

          <div className="mt-4 text-center">
            <Link to="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
