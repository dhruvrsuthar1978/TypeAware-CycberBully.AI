import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, Eye, EyeOff, LogIn, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    isAdmin: false
  });
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
      toast({
        title: "Login successful!",
        description: "Welcome back to TypeAware."
      });
      navigate(formData.isAdmin ? '/admin' : '/dashboard');
    } else {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: result.error || "Please check your credentials and try again."
      });
    }
    
    setIsLoading(false);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Aurora Gradient Background */}
      <div className="absolute inset-0 bg-gradient-aurora"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/20"></div>
      
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 bg-pattern-dots opacity-20"></div>
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-20 right-10 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>

      <div className="relative min-h-screen flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="flex justify-center mb-6">
              <div className="relative group">
                <Shield className="h-16 w-16 text-white relative z-10 group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-white/40 rounded-full blur-2xl animate-pulse-glow"></div>
              </div>
            </div>
            <h1 className="text-4xl font-display font-bold text-white mb-3">Welcome Back</h1>
            <p className="text-white/90 text-lg">Sign in to your TypeAware account</p>
          </div>

          {/* Login Form */}
          <Card className="glass-card-strong border-white/30 shadow-dramatic hover-lift overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <CardContent className="p-8 relative z-10">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 border-2 border-border/50 rounded-xl bg-background/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full pl-12 pr-14 py-3 border-2 border-border/50 rounded-xl bg-background/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Admin Toggle */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <label htmlFor="isAdmin" className="text-sm font-semibold text-foreground">
                      Admin Login
                    </label>
                  </div>
                  <Switch
                    id="isAdmin"
                    checked={formData.isAdmin}
                    onCheckedChange={(checked) => setFormData({ ...formData, isAdmin: checked })}
                  />
                </div>

                {/* Submit */}
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-primary hover:opacity-90 transition-opacity shadow-lg hover-scale text-lg py-6 rounded-xl" 
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Signing In...
                    </div>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-5 w-5" />
                      Sign In
                    </>
                  )}
                </Button>
              </form>

              {/* Links */}
              <div className="mt-6 text-center space-y-3">
                <p className="text-sm text-foreground">
                  Don't have an account?{' '}
                  <Link to="/signup" className="text-primary hover:text-primary/80 font-semibold hover:underline">
                    Sign up
                  </Link>
                </p>
                <Link to="/forgot-password" className="text-sm text-primary hover:text-primary/80 font-semibold hover:underline block transition-colors">
                  Forgot Password?
                </Link>
                <Link to="/" className="text-sm text-muted-foreground hover:text-foreground block transition-colors">
                  ← Back to Home
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Security Notice */}
          <Card className="mt-6 glass-card border-white/20 hover-lift">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="text-xs text-foreground">
                  <p className="font-semibold mb-1">🔒 Security Notice</p>
                  <p className="text-muted-foreground">All login attempts are encrypted and secured. Your privacy is our priority.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;