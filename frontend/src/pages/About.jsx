import { Link } from 'react-router-dom';
import { Shield, Target, Users, Brain, Lock, Zap, Globe, CheckCircle, Sparkles, Award, TrendingUp, ArrowRight, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const About = () => {
  const missions = [
    {
      icon: Target,
      title: 'Our Mission',
      description: 'To create safer digital communities through intelligent, privacy-first content moderation and real-time threat detection.',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Brain,
      title: 'Our Technology',
      description: 'Advanced AI and machine learning algorithms that work entirely on-device, ensuring privacy while maintaining accuracy.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Users,
      title: 'Our Community',
      description: 'Building a collaborative network of users, moderators, and platforms working together for digital safety.',
      color: 'from-green-500 to-emerald-500'
    }
  ];

  const features = [
    {
      icon: Lock,
      title: 'Privacy by Design',
      description: 'All detection happens locally on your device. No personal data is ever transmitted or stored on our servers.',
      highlight: true
    },
    {
      icon: Zap,
      title: 'Real-Time Processing',
      description: 'Instant threat detection using advanced natural language processing and pattern recognition algorithms.'
    },
    {
      icon: Globe,
      title: 'Cross-Platform Support',
      description: 'Seamlessly works across Twitter, YouTube, Reddit, Facebook, Discord, and more platforms.'
    },
    {
      icon: Shield,
      title: 'Advanced Detection',
      description: 'Multi-layered approach combining regex, NLP, and fuzzy matching to catch various forms of abuse.'
    }
  ];

  const stats = [
    { number: '99.3%', label: 'Detection Accuracy', icon: Award },
    { number: '<100ms', label: 'Processing Time', icon: Zap },
    { number: '15,420+', label: 'Active Users', icon: Users },
    { number: '5+', label: 'Supported Platforms', icon: Globe }
  ];

  const team = [
    {
      name: 'Security Team',
      role: 'AI & Machine Learning',
      description: 'Expert researchers in natural language processing and threat detection algorithms.'
    },
    {
      name: 'Privacy Team',
      role: 'Data Protection',
      description: 'Specialists ensuring all processing remains private and secure on user devices.'
    },
    {
      name: 'Platform Team',
      role: 'Integration & Support',
      description: 'Engineers building seamless integrations across social media platforms.'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section - Aurora Gradient with Animations */}
      <section className="relative py-24 px-4 bg-gradient-aurora overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-transparent"></div>
        
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 bg-pattern-dots opacity-20"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-8">
            <div className="relative group">
              <Shield className="h-20 w-20 text-white relative z-10 group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute inset-0 bg-white/40 rounded-full blur-2xl animate-pulse-glow"></div>
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-display font-bold text-white mb-8 animate-fade-in leading-tight">
            About TypeAware
          </h1>
          
          <p className="text-xl md:text-2xl text-white/95 max-w-3xl mx-auto mb-8 animate-fade-in leading-relaxed font-light">
            We're building the future of online safety through intelligent, privacy-first content moderation. 
            Our mission is to create digital spaces where everyone can communicate freely and safely.
          </p>
        </div>
      </section>

      {/* Stats Section - Modern Glass Cards */}
      <section className="py-16 px-4 -mt-12 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card key={index} className="hover-lift-strong border-0 bg-gradient-card text-center overflow-hidden relative group shadow-elegant">
                <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-10 transition-opacity"></div>
                <CardContent className="p-6 relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:scale-110 transition-transform">
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                    {stat.number}
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">
                    {stat.label}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section - Modern Cards with Gradients */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-semibold">Our Core Values</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6 bg-gradient-hero bg-clip-text text-transparent">
              What Drives Us Forward
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Everything we do is guided by our commitment to privacy, accuracy, and community safety
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {missions.map((mission, index) => (
              <Card key={index} className="hover-lift-strong border-0 bg-gradient-card text-center overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <CardHeader className="pb-4 relative z-10">
                  <div className={`mb-4 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${mission.color} text-white mx-auto shadow-lg group-hover:scale-110 transition-transform`}>
                    <mission.icon className="h-8 w-8" />
                  </div>
                  <CardTitle className="text-xl font-bold">{mission.title}</CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <p className="text-muted-foreground leading-relaxed">{mission.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Section - Enhanced Cards */}
      <section className="py-20 px-4 bg-muted/30 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-pattern-grid opacity-10"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
              <Brain className="h-4 w-4" />
              <span className="text-sm font-semibold">Advanced Technology</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6 bg-gradient-hero bg-clip-text text-transparent">
              How TypeAware Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Advanced technology stack designed for privacy, speed, and accuracy
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className={`hover-lift-strong border-0 bg-gradient-card overflow-hidden relative group ${
                feature.highlight ? 'ring-2 ring-primary/30' : ''
              }`}>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <CardContent className="p-8 relative z-10">
                  <div className="flex items-start space-x-4">
                    <div className={`flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform ${
                      feature.highlight ? 'bg-gradient-primary text-white' : 'bg-primary/10 text-primary'
                    }`}>
                      <feature.icon className="h-7 w-7" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold mb-3">{feature.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                      {feature.highlight && (
                        <div className="flex items-center mt-4 text-sm text-primary font-medium">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          <span>Privacy Guaranteed</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section - Modern Cards */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
              <Users className="h-4 w-4" />
              <span className="text-sm font-semibold">Meet The Team</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6 bg-gradient-hero bg-clip-text text-transparent">
              Our Expert Teams
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Dedicated professionals working to make the internet a safer place for everyone
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <Card key={index} className="hover-lift-strong border-0 bg-gradient-card text-center overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <CardContent className="p-8 relative z-10">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-primary text-white flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform">
                    <Users className="h-10 w-10" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{member.name}</h3>
                  <p className="text-primary font-semibold mb-4">{member.role}</p>
                  <p className="text-muted-foreground leading-relaxed">{member.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Aurora Gradient */}
      <section className="py-24 px-4 bg-gradient-aurora relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-transparent"></div>
        
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 bg-pattern-dots opacity-20"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-10 right-20 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-10 left-20 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }}></div>
        
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <TrendingUp className="h-16 w-16 text-white relative z-10" />
              <div className="absolute inset-0 bg-white/40 rounded-full blur-xl animate-pulse-glow"></div>
            </div>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6 animate-fade-in">
            Join the Movement
          </h2>
          <p className="text-xl md:text-2xl text-white/95 mb-12 max-w-2xl mx-auto leading-relaxed font-light">
            Be part of the solution. Help us build safer digital communities for everyone.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-8">
            <Link to="/signup">
              <Button variant="premium" size="xl" className="min-w-56 group shadow-2xl">
                <Sparkles className="mr-2 h-6 w-6 group-hover:scale-110 transition-transform" />
                Get Started Free
                <ArrowRight className="ml-2 h-6 w-6 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/demo">
              <Button variant="glass" size="xl" className="min-w-56 group shadow-2xl">
                <Eye className="mr-2 h-6 w-6 group-hover:scale-110 transition-transform" />
                Try Demo
                <ArrowRight className="ml-2 h-6 w-6 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
          
          <p className="text-white/80 text-sm">
            No credit card required • Free forever • 5-minute setup
          </p>
        </div>
      </section>
    </div>
  );
};

export default About;