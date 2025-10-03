import React from 'react';
import { Shield, Target, Users, Brain, Lock, Zap, Globe, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const About = () => {
  const missions = [
    {
      icon: Target,
      title: 'Our Mission',
      description: 'To create safer digital communities through intelligent, privacy-first content moderation and real-time threat detection.'
    },
    {
      icon: Brain,
      title: 'Our Technology',
      description: 'Advanced AI and machine learning algorithms that work entirely on-device, ensuring privacy while maintaining accuracy.'
    },
    {
      icon: Users,
      title: 'Our Community',
      description: 'Building a collaborative network of users, moderators, and platforms working together for digital safety.'
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
    { number: '99.3%', label: 'Detection Accuracy' },
    { number: '<100ms', label: 'Processing Time' },
    { number: '15,420+', label: 'Active Users' },
    { number: '5+', label: 'Supported Platforms' }
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
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-gradient-hero overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <Shield className="h-16 w-16 text-white" />
              <div className="absolute inset-0 bg-white/30 rounded-full blur-xl"></div>
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            About TypeAware
          </h1>
          
          <p className="text-xl text-white/90 max-w-3xl mx-auto mb-8">
            We're building the future of online safety through intelligent, privacy-first content moderation. 
            Our mission is to create digital spaces where everyone can communicate freely and safely.
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                  {stat.number}
                </div>
                <div className="text-muted-foreground font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Our Core Values
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Everything we do is guided by our commitment to privacy, accuracy, and community safety
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {missions.map((mission, index) => (
              <Card key={index} className="text-center hover:shadow-elegant transition-smooth">
                <CardHeader className="pb-4">
                  <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-primary text-white mx-auto">
                    <mission.icon className="h-8 w-8" />
                  </div>
                  <CardTitle className="text-xl">{mission.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{mission.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              How TypeAware Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Advanced technology stack designed for privacy, speed, and accuracy
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className={`hover:shadow-elegant transition-smooth ${
                feature.highlight ? 'ring-2 ring-primary/20 bg-gradient-card' : ''
              }`}>
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${
                      feature.highlight ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
                    }`}>
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                      <p className="text-muted-foreground">{feature.description}</p>
                      {feature.highlight && (
                        <div className="flex items-center mt-3 text-sm text-primary">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          <span className="font-medium">Privacy Guaranteed</span>
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

      {/* Team Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Our Expert Teams
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Dedicated professionals working to make the internet a safer place for everyone
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <Card key={index} className="text-center hover:shadow-elegant transition-smooth">
                <CardContent className="p-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-primary text-white flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{member.name}</h3>
                  <p className="text-primary font-medium mb-3">{member.role}</p>
                  <p className="text-muted-foreground">{member.description}</p>
                </CardContent>
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
            Join the Movement
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Be part of the solution. Help us build safer digital communities for everyone.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 max-w-md border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-2">Ready to get started?</h3>
              <p className="text-white/80 text-sm">Join thousands of users protecting their communities</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;