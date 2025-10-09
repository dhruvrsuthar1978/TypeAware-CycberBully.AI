import { Link, useNavigate } from 'react-router-dom';
import { Download, Shield, Eye, Users, BarChart3, Chrome, Globe, Zap, Lock, ArrowRight, CheckCircle, Sparkles, TrendingUp, Award, Target, BarChart, MessageCircle } from 'lucide-react';
import { downloadExtension } from '@/utils/extensionDownload';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const Home = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const features = [
    {
      icon: Eye,
      title: 'Real-Time Detection',
      description: 'Advanced AI monitors content across platforms instantly, detecting threats as they happen.',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Shield,
      title: 'Privacy First',
      description: 'All processing happens on-device. Your data never leaves your browser.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: BarChart3,
      title: 'Analytics Dashboard',
      description: 'Comprehensive insights and reporting tools for users and administrators.',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Users,
      title: 'Community Safety',
      description: 'Building safer online communities through collaborative threat detection.',
      color: 'from-orange-500 to-red-500'
    }
  ];

  const platforms = [
    { name: 'Twitter', supported: true },
    { name: 'YouTube', supported: true },
    { name: 'Reddit', supported: true },
    { name: 'Facebook', supported: true },
    { name: 'Discord', supported: true },
    { name: 'Instagram', supported: false }
  ];

  const stats = [
    { label: 'Active Users', value: '15,420+', icon: Users, color: 'text-purple-600' },
    { label: 'Threats Detected', value: '89,650+', icon: Shield, color: 'text-blue-600' },
    { label: 'Platforms Supported', value: '5+', icon: Globe, color: 'text-green-600' },
    { label: 'Reports Resolved', value: '95%', icon: TrendingUp, color: 'text-orange-600' }
  ];

  const benefits = [
    {
      icon: Target,
      title: 'Precision Detection',
      description: 'Machine learning models trained on millions of data points for accurate threat identification.'
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Real-time analysis with sub-second response times across all platforms.'
    },
    {
      icon: Award,
      title: 'Industry Leading',
      description: 'Trusted by thousands of users and recognized for excellence in digital safety.'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section - Enhanced with Modern Design */}
      <section className="relative overflow-hidden bg-gradient-aurora py-24 px-4 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-transparent"></div>
        
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 bg-pattern-dots opacity-30"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        
        <div className="relative max-w-7xl mx-auto text-center">
          <div className="flex justify-center mb-8">
            <div className="relative group">
              <Shield className="h-20 w-20 text-white relative z-10 group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute inset-0 bg-white/40 rounded-full blur-2xl animate-pulse-glow"></div>
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold text-white mb-8 animate-fade-in leading-tight">
            Protecting Digital
            <span className="block mt-2 bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
              Communities
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-white/95 max-w-4xl mx-auto mb-12 animate-fade-in leading-relaxed font-light">
            TypeAware combines advanced AI detection with real-time monitoring to create safer online spaces. 
            Detect, report, and moderate abusive behavior across all major platforms.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center animate-fade-in mb-8">
            <Link to="/demo">
              <Button variant="premium" size="xl" className="min-w-56 group shadow-2xl">
                <Eye className="mr-2 h-6 w-6 group-hover:scale-110 transition-transform" />
                Try Demo
                <ArrowRight className="ml-2 h-6 w-6 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Button 
              variant="glass" 
              size="xl" 
              className="min-w-56 group shadow-2xl"
              onClick={async () => {
                toast({
                  title: "Extension Ready",
                  description: "Extension files are being prepared for download..."
                });
                const success = await downloadExtension();
                if (!success) {
                  toast({
                    title: 'Download Failed',
                    description: 'There was a problem downloading the extension. Please try again.',
                    variant: 'destructive'
                  });
                }
              }}
            >
              <Chrome className="mr-2 h-6 w-6 group-hover:scale-110 transition-transform" />
              Download Extension
              <ArrowRight className="ml-2 h-6 w-6 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-4 justify-center animate-fade-in">
            <Link to="/signup">
              <Button variant="glass" size="lg" className="group">
                <Lock className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                Get Started Free
              </Button>
            </Link>
            <Link to="/about">
              <Button variant="glass" size="lg" className="group">
                <Sparkles className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section - Redesigned */}
      <section className="py-20 bg-gradient-to-b from-muted/30 to-background relative">
        <div className="absolute inset-0 bg-pattern-grid opacity-20"></div>
        <div className="max-w-7xl mx-auto px-4 relative">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {stats.map((stat, index) => (
              <Card key={index} className="card-gradient hover:shadow-dramatic transition-all duration-500 group border-0">
                <CardContent className="p-8 text-center">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-primary mb-4 group-hover:scale-110 transition-transform duration-500 shadow-lg`}>
                    <stat.icon className="h-8 w-8 text-white" />
                  </div>
                  <div className={`text-4xl lg:text-5xl font-bold mb-2 ${stat.color} font-display`}>
                    {stat.value}
                  </div>
                  <div className="text-muted-foreground font-medium text-sm lg:text-base">
                    {stat.label}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="flex justify-center mt-8">
            <Button 
              onClick={() => navigate('/analytics')}
              variant="outline" 
              size="lg" 
              className="group hover-scale bg-gradient-primary text-white hover:text-white"
            >
              <BarChart className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
              View Detailed Analytics
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section - Enhanced */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-primary opacity-5 blur-3xl"></div>
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-semibold mb-6 animate-fade-in">
              <Sparkles className="h-4 w-4" />
              <span>Advanced Protection</span>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6 text-gradient-primary">
              Features That Protect
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Our comprehensive suite of tools works seamlessly across platforms to keep communities safe
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-dramatic transition-all duration-500 border-0 bg-gradient-card overflow-hidden relative">
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
                <CardContent className="p-8 text-center relative">
                  <div className={`mb-6 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} text-white group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg`}>
                    <feature.icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold mb-4 font-display">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section - New */}
      <section className="py-24 px-4 bg-gradient-to-b from-background to-muted/30 relative">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="card-modern hover-lift-strong group border-2 border-primary/10 hover:border-primary/30">
                <CardHeader>
                  <div className="w-14 h-14 rounded-xl bg-gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500 shadow-lg">
                    <benefit.icon className="h-7 w-7 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-display">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {benefit.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Support - Redesigned */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-1/2 h-full bg-gradient-security opacity-5 blur-3xl"></div>
        <div className="max-w-7xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 text-green-600 font-semibold mb-6 animate-fade-in">
            <Globe className="h-4 w-4" />
            <span>Cross-Platform</span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6">
            Supported Platforms
          </h2>
          <p className="text-xl text-muted-foreground mb-16 max-w-3xl mx-auto leading-relaxed">
            TypeAware works across all major social media and communication platforms
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {platforms.map((platform, index) => (
              <Card key={index} className={`p-8 group transition-all duration-500 border-0 ${
                platform.supported 
                  ? 'bg-gradient-card hover:shadow-dramatic hover:-translate-y-2' 
                  : 'bg-muted/50 opacity-60'
              }`}>
                <div className="flex flex-col items-center space-y-4">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                    platform.supported 
                      ? 'bg-gradient-primary shadow-lg group-hover:scale-110 group-hover:rotate-6' 
                      : 'bg-muted'
                  }`}>
                    <Globe className={`h-8 w-8 ${platform.supported ? 'text-white' : 'text-muted-foreground'}`} />
                  </div>
                  <span className="font-semibold text-lg">{platform.name}</span>
                  {platform.supported ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <span className="text-xs text-muted-foreground font-medium px-3 py-1 rounded-full bg-muted">
                      Coming Soon
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Enhanced */}
      <section className="py-24 px-4 bg-gradient-aurora relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/40"></div>
        <div className="absolute inset-0 bg-pattern-dots opacity-20"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-10 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-10 right-20 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }}></div>
        
        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-md text-white font-semibold mb-8 animate-fade-in">
            <Sparkles className="h-4 w-4" />
            <span>Join the Movement</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white mb-8 leading-tight">
            Ready to Make the Internet Safer?
          </h2>
          <p className="text-xl md:text-2xl text-white/95 mb-12 max-w-3xl mx-auto leading-relaxed font-light">
            Join thousands of users already protecting their online communities with TypeAware.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-8">
            <Link to="/demo">
              <Button variant="premium" size="xl" className="min-w-56 group shadow-2xl">
                <Eye className="mr-2 h-6 w-6 group-hover:scale-110 transition-transform" />
                Try Demo Now
              </Button>
            </Link>
            <Link to="/signup">
              <Button variant="glass" size="xl" className="min-w-56 group shadow-2xl">
                <Lock className="mr-2 h-6 w-6 group-hover:scale-110 transition-transform" />
                Start Free Trial
              </Button>
            </Link>
          </div>
          
          <div className="flex flex-wrap gap-4 justify-center">
            <Button 
              variant="glass" 
              size="lg" 
              className="group"
              onClick={async () => {
                toast({
                  title: "Extension Ready",
                  description: "Extension files are being prepared for download..."
                });
                const success = await downloadExtension();
                if (!success) {
                  toast({
                    title: 'Download Failed',
                    description: 'There was a problem downloading the extension. Please try again.',
                    variant: 'destructive'
                  });
                }
              }}
            >
              <Chrome className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
              Get Extension
            </Button>
            <Link to="/login">
              <Button variant="glass" size="lg" className="group">
                <Zap className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                Sign In
              </Button>
            </Link>
            <Link to="/contact">
              <Button variant="glass" size="lg" className="group">
                <MessageCircle className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                Contact Support
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;