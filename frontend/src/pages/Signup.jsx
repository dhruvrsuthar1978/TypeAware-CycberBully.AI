import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, User, Eye, EyeOff, UserPlus, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { signup } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Password mismatch",
        description: "Please make sure your passwords match."
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        variant: "destructive",
        title: "Password too short",
        description: "Password must be at least 6 characters long."
      });
      return;
    }

    setIsLoading(true);

    const result = await signup(formData.name, formData.email, formData.password);
    
    if (result.success) {
      toast({
        title: "Account created successfully!",
        description: "Welcome to TypeAware. You've been automatically signed in."
      });
      navigate('/dashboard');
    } else {
      toast({
        variant: "destructive",
        title: "Signup failed",
        description: result.error || "Please try again."
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

  const features = [
    'Real-time threat detection',
    'Privacy-first processing',
    'Cross-platform support',
    'Detailed analytics dashboard'
  ];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="w-full max-w-4xl">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left Side - Features */}
          <div className="hidden lg:block">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <Shield className="h-16 w-16 text-primary" />
                  <div className="absolute inset-0 bg-gradient-primary rounded-full opacity-20 blur-sm"></div>
                </div>
              </div>
              <h1 className="text-3xl font-bold mb-4">Join TypeAware</h1>
              <p className="text-muted-foreground text-lg">
                Start protecting your online communities today
              </p>
            </div>

            <Card className="bg-gradient-card">
              <CardHeader>
                <CardTitle className="text-xl">What you'll get:</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      <CheckCircle className="h-4 w-4" />
                    </div>
                    <span className="text-foreground">{feature}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Signup Form */}
          <div className="w-full max-w-md mx-auto lg:mx-0">
            {/* Mobile Header */}
            <div className="text-center mb-8 lg:hidden">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <Shield className="h-12 w-12 text-primary" />
                  <div className="absolute inset-0 bg-gradient-primary rounded-full opacity-20 blur-sm"></div>
                </div>
              </div>
              <h1 className="text-2xl font-bold">Create Account</h1>
              <p className="text-muted-foreground mt-2">Join TypeAware today</p>
            </div>

            {/* Signup Form */}
            <Card className="shadow-elegant">
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-smooth"
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                  </div>

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
                        placeholder="Create a password"
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

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="w-full pl-10 pr-12 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-smooth"
                        placeholder="Confirm your password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
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
                        Creating Account...
                      </div>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Create Account
                      </>
                    )}
                  </Button>
                </form>

                {/* Links */}
                <div className="mt-6 text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <Link to="/login" className="text-primary hover:text-primary/80 font-medium">
                      Sign in
                    </Link>
                  </p>
                  <Link to="/" className="text-sm text-muted-foreground hover:text-foreground block">
                    ← Back to Home
                  </Link>
                </div>

                {/* Terms */}
                <div className="mt-4 text-xs text-muted-foreground text-center">
                  By creating an account, you agree to our Terms of Service and Privacy Policy.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;