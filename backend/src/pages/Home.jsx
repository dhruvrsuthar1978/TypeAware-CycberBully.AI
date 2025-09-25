import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/enhanced-button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Shield, 
  Eye, 
  AlertTriangle, 
  Users, 
  Chrome,
  BarChart3,
  Lock,
  Zap,
  CheckCircle
} from 'lucide-react';

const Home = () => {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: Eye,
      title: "Real-Time Detection",
      description: "Advanced NLP and pattern matching detects toxic behavior as it happens across any website."
    },
    {
      icon: AlertTriangle,
      title: "Smart Warnings",
      description: "In-context overlays provide gentle nudges and alternative phrasing suggestions."
    },
    {
      icon: Users,
      title: "Community Protection",
      description: "Automatic blocking system protects users from repeat offenders with escalating timeouts."
    },
    {
      icon: Lock,
      title: "Privacy First",
      description: "All detection happens locally in your browser. No personal data leaves your device."
    },
    {
      icon: BarChart3,
      title: "Detailed Analytics",
      description: "Track patterns, view reports, and understand online behavior trends."
    },
    {
      icon: Chrome,
      title: "Browser Extension",
      description: "Works seamlessly across all your favorite social platforms and websites."
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Install Extension",
      description: "Add the TypeAware browser extension from the Chrome Web Store"
    },
    {
      number: "02", 
      title: "Browse Safely",
      description: "The extension automatically detects and flags toxic content as you browse"
    },
    {
      number: "03",
      title: "Take Action",
      description: "Report, block, or get suggestions for better communication"
    },
    {
      number: "04",
      title: "Track Progress",
      description: "View your impact and community safety metrics in your dashboard"
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-10"></div>
        <div className="relative max-w-7xl mx-auto text-center">
          <div className="mb-8">
            <Shield className="h-20 w-20 mx-auto text-primary mb-6 animate-pulse-glow" />
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Make the Internet
              <span className="block bg-gradient-primary bg-clip-text text-transparent">
                Safer for Everyone
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              TypeAware uses advanced AI to detect, prevent, and moderate toxic behavior across 
              the web, creating safer online spaces for everyone.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            {!isAuthenticated ? (
              <>
                <Link to="/demo">
                  <Button variant="glow" size="xl" className="w-full sm:w-auto">
                    <Zap className="mr-2 h-5 w-5" />
                    Try Live Demo
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button variant="hero" size="xl" className="w-full sm:w-auto">
                    Get Started Free
                  </Button>
                </Link>
                <Link to="/about">
                  <Button variant="outline" size="xl" className="w-full sm:w-auto">
                    Learn More
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/demo">
                  <Button variant="glow" size="xl">
                    <Zap className="mr-2 h-5 w-5" />
                    Try Live Demo
                  </Button>
                </Link>
                <Link to="/dashboard">
                  <Button variant="hero" size="xl">
                    <BarChart3 className="mr-2 h-5 w-5" />
                    Go to Dashboard
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">99.2%</div>
              <div className="text-muted-foreground">Detection Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-secondary mb-2">250K+</div>
              <div className="text-muted-foreground">Protected Users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent mb-2">10M+</div>
              <div className="text-muted-foreground">Toxic Comments Blocked</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Powerful Protection Features
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Advanced technology meets user-friendly design to create the ultimate 
              online safety toolkit.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="shadow-card hover:shadow-glow transition-all duration-300 border-primary/20">
                <CardContent className="p-6">
                  <feature.icon className="h-12 w-12 text-primary mb-4" />
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How TypeAware Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get up and running in minutes with our simple four-step process.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold text-xl mb-4 mx-auto">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-primary">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Make the Web Safer?
          </h2>
          <p className="text-xl opacity-90 mb-8">
            Join thousands of users already protecting their online communities.
          </p>
          {!isAuthenticated && (
            <Link to="/signup">
              <Button variant="secondary" size="xl">
                <CheckCircle className="mr-2 h-5 w-5" />
                Start Protecting Today
              </Button>
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
