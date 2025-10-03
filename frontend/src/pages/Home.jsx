import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Eye, Users, BarChart3, Chrome, Globe, Zap, Lock, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const Home = () => {
  const features = [
    {
      icon: Eye,
      title: 'Real-Time Detection',
      description: 'Advanced AI monitors content across platforms instantly, detecting threats as they happen.'
    },
    {
      icon: Shield,
      title: 'Privacy First',
      description: 'All processing happens on-device. Your data never leaves your browser.'
    },
    {
      icon: BarChart3,
      title: 'Analytics Dashboard',
      description: 'Comprehensive insights and reporting tools for users and administrators.'
    },
    {
      icon: Users,
      title: 'Community Safety',
      description: 'Building safer online communities through collaborative threat detection.'
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
    { label: 'Active Users', value: '15,420+' },
    { label: 'Threats Detected', value: '89,650+' },
    { label: 'Platforms Supported', value: '5+' },
    { label: 'Reports Resolved', value: '95%' }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero py-20 px-4">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <Shield className="h-16 w-16 text-white" />
              <div className="absolute inset-0 bg-white/30 rounded-full blur-xl"></div>
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 animate-fade-in">
            Protecting Digital
            <span className="block bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
              Communities
            </span>
          </h1>
          
          <p className="text-xl text-white/90 max-w-3xl mx-auto mb-8 animate-fade-in">
            TypeAware combines advanced AI detection with real-time monitoring to create safer online spaces. 
            Detect, report, and moderate abusive behavior across all major platforms.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
            <Link to="/demo">
              <Button variant="premium" size="xl" className="min-w-48 group">
                <Eye className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                Try Demo
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Button 
              variant="hero" 
              size="xl" 
              className="min-w-48 group"
              onClick={() => {
                const link = document.createElement('a');
                link.href = '/extension.zip';
                link.download = 'typeaware-extension.zip';
                link.click();
              }}
            >
              <Chrome className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
              Download Extension
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
          
          {/* Additional Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6 animate-fade-in">
            <Link to="/signup">
              <Button variant="glass" size="lg" className="min-w-40 group">
                <Lock className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                Get Started Free
              </Button>
            </Link>
            <Link to="/about">
              <Button variant="glass" size="lg" className="min-w-40 group">
                <Globe className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                  {stat.value}
                </div>
                <div className="text-muted-foreground font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Advanced Protection Features
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our comprehensive suite of tools works seamlessly across platforms to keep communities safe
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-elegant transition-smooth">
                <CardContent className="p-6 text-center">
                  <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-primary text-white group-hover:scale-110 transition-smooth">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Support */}
      <section className="py-20 bg-muted/30 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Supported Platforms
          </h2>
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            TypeAware works across all major social media and communication platforms
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {platforms.map((platform, index) => (
              <Card key={index} className={`p-6 ${platform.supported ? 'bg-gradient-card' : 'opacity-50'}`}>
                <div className="flex flex-col items-center space-y-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    platform.supported ? 'bg-primary/10' : 'bg-muted'
                  }`}>
                    <Globe className={`h-6 w-6 ${platform.supported ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <span className="font-medium">{platform.name}</span>
                  {platform.supported ? (
                    <CheckCircle className="h-4 w-4 text-security" />
                  ) : (
                    <span className="text-xs text-muted-foreground">Coming Soon</span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Make the Internet Safer?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of users already protecting their online communities with TypeAware.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/demo">
              <Button variant="premium" size="xl" className="min-w-48 group">
                <Eye className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                Try Demo Now
              </Button>
            </Link>
            <Link to="/signup">
              <Button variant="glass" size="xl" className="min-w-48 group">
                <Lock className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                Start Free Trial
              </Button>
            </Link>
          </div>
          
          {/* Secondary CTA */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
            <Button 
              variant="glass" 
              size="lg" 
              className="min-w-40 group"
              onClick={() => {
                const link = document.createElement('a');
                link.href = '/extension.zip';
                link.download = 'typeaware-extension.zip';
                link.click();
              }}
            >
              <Chrome className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
              Get Extension
            </Button>
            <Link to="/login">
              <Button variant="ghost" size="lg" className="min-w-40 text-white hover:bg-white/10 group">
                <Zap className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;