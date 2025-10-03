import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Shield className="h-12 w-12 text-primary" />
              <div className="absolute inset-0 bg-gradient-primary rounded-full opacity-20 blur-sm"></div>
            </div>
          </div>
          <h1 className="text-2xl font-bold">Welcome Back</h1>
          <p className="text-muted-foreground mt-2">Sign in to your TypeAware account</p>
        </div>

        {/* Removed Demo Credentials section as per user request */}

        {/* Login Form */}
        <Card className="shadow-elegant">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-smooth"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-12 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-smooth"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Admin Toggle */}
              <div className="flex items-center justify-between">
                <label htmlFor="isAdmin" className="text-sm font-medium">
                  Admin Login
                </label>
                <Switch
                  id="isAdmin"
                  checked={formData.isAdmin}
                  onCheckedChange={(checked) => setFormData({ ...formData, isAdmin: checked })}
                />
              </div>

              {/* Submit */}
              <Button 
                type="submit" 
                className="w-full hover-glow" 
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing In...
                  </div>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign In
                  </>
                )}
              </Button>
            </form>

            {/* Links */}
            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link to="/signup" className="text-primary hover:text-primary/80 font-medium">
                  Sign up
                </Link>
              </p>
              <Link to="/" className="text-sm text-muted-foreground hover:text-foreground block">
                ← Back to Home
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <div className="text-xs text-muted-foreground">
              <p className="font-medium mb-1">Security Notice</p>
              <p>All login attempts are encrypted and secured. Your privacy is our priority.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;