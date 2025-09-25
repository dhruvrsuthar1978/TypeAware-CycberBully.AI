import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Shield, 
  Eye, 
  Brain, 
  Lock, 
  Zap,
  Globe,
  Users,
  Target
} from 'lucide-react';

const About = () => {
  const values = [
    {
      icon: Lock,
      title: "Privacy First",
      description: "All detection happens locally in your browser. Your data never leaves your device unless you choose to sync reports."
    },
    {
      icon: Shield,
      title: "Proven Protection",
      description: "Our advanced AI models achieve 97%+ accuracy in detecting toxic behavior across multiple platforms."
    },
    {
      icon: Users,
      title: "Community Driven",
      description: "Built with feedback from online communities, moderators, and safety experts worldwide."
    },
    {
      icon: Target,
      title: "Precise Detection",
      description: "Smart algorithms that understand context, avoiding false positives while catching sophisticated abuse."
    }
  ];

  const features = [
    {
      icon: Brain,
      title: "Advanced NLP",
      description: "Natural language processing that understands context, slang, and obfuscated abuse patterns."
    },
    {
      icon: Eye,
      title: "Real-time Monitoring",
      description: "Instant detection and flagging as you browse, with customizable sensitivity levels."
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Optimized for performance with minimal impact on your browsing experience."
    },
    {
      icon: Globe,
      title: "Universal Coverage",
      description: "Works across all websites and social platforms, adapting to each site's unique structure."
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <Shield className="h-16 w-16 mx-auto text-primary mb-6" />
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          About TypeAware
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          TypeAware is a comprehensive safety platform that uses advanced AI to detect, 
          prevent, and moderate toxic behavior across the web, creating safer online 
          spaces for everyone.
        </p>
      </div>

      {/* Mission Section */}
      <section className="mb-16">
        <div className="bg-gradient-primary p-8 md:p-12 rounded-2xl text-white">
          <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
          <p className="text-lg opacity-90 leading-relaxed">
            We believe the internet should be a place where everyone can express themselves 
            freely without fear of harassment, abuse, or toxicity. TypeAware empowers users 
            and communities with intelligent tools to identify and address harmful behavior 
            before it escalates, fostering healthier online interactions.
          </p>
        </div>
      </section>

      {/* Core Values */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-12">Our Core Values</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {values.map((value, index) => (
            <Card key={index} className="shadow-card hover:shadow-glow transition-all duration-300">
              <CardContent className="p-6">
                <value.icon className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-3">{value.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{value.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Technology Features */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-12">Advanced Technology</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="shadow-card hover:shadow-glow transition-all duration-300 text-center">
              <CardContent className="p-6">
                <feature.icon className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-12">How TypeAware Works</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="text-2xl font-semibold mb-6">Intelligent Detection Engine</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold">1</div>
                <div>
                  <h4 className="font-semibold mb-1">Content Analysis</h4>
                  <p className="text-muted-foreground text-sm">Advanced NLP models analyze text in real-time for toxic patterns</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold">2</div>
                <div>
                  <h4 className="font-semibold mb-1">Context Understanding</h4>
                  <p className="text-muted-foreground text-sm">AI considers conversation context to avoid false positives</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold">3</div>
                <div>
                  <h4 className="font-semibold mb-1">Smart Actions</h4>
                  <p className="text-muted-foreground text-sm">Automated blocking, reporting, and suggestion systems activate</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-muted/30 rounded-2xl p-8">
            <h4 className="font-semibold mb-4 text-center">Detection Capabilities</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-background p-3 rounded-lg text-center">
                <div className="font-bold text-primary">Hate Speech</div>
                <div className="text-muted-foreground">99.1%</div>
              </div>
              <div className="bg-background p-3 rounded-lg text-center">
                <div className="font-bold text-secondary">Harassment</div>
                <div className="text-muted-foreground">97.8%</div>
              </div>
              <div className="bg-background p-3 rounded-lg text-center">
                <div className="font-bold text-accent">Spam</div>
                <div className="text-muted-foreground">98.5%</div>
              </div>
              <div className="bg-background p-3 rounded-lg text-center">
                <div className="font-bold text-warning">Threats</div>
                <div className="text-muted-foreground">96.3%</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="text-center">
        <h2 className="text-3xl font-bold mb-8">Built by Experts</h2>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
          TypeAware is developed by a team of AI researchers, safety experts, and community 
          moderators who understand the complexities of online behavior and the importance 
          of creating inclusive digital spaces.
        </p>
        <div className="bg-muted/30 rounded-2xl p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-2xl font-bold text-primary mb-2">250K+</div>
              <div className="text-muted-foreground">Protected Users</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-secondary mb-2">10M+</div>
              <div className="text-muted-foreground">Toxic Comments Blocked</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-accent mb-2">500+</div>
              <div className="text-muted-foreground">Supported Platforms</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
