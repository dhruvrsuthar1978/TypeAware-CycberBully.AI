import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Shield, Zap, Lock, Globe, CheckCircle, Chrome, Sparkles, TrendingUp, Share, FileText, Bug } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { downloadExtension as downloadExtensionUtil } from '@/utils/extensionDownload';

const Extension = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const downloadExtension = async () => {
    toast({
      title: "Extension Ready",
      description: "Extension files are being prepared for download..."
    });
    
    const success = await downloadExtensionUtil();
    
    if (success) {
      toast({
        title: "Download Started",
        description: "Your extension download has begun. Please check your downloads folder.",
        variant: "success"
      });
    } else {
      toast({
        title: "Download Failed",
        description: "There was a problem downloading the extension. Please try again.",
        variant: "destructive"
      });
    }
  };

  const features = [
    {
      icon: Zap,
      title: 'Real-Time Detection',
      description: 'Instant threat detection as you type across all supported platforms.',
      color: 'from-yellow-500 to-orange-500'
    },
    {
      icon: Lock,
      title: 'Privacy Protected',
      description: 'All processing happens locally in your browser. No data sent to servers.',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Globe,
      title: 'Cross-Platform',
      description: 'Works seamlessly on Twitter, YouTube, Reddit, Facebook, and more.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Shield,
      title: 'Smart Suggestions',
      description: 'Get alternative phrasing suggestions for potentially harmful content.',
      color: 'from-purple-500 to-pink-500'
    }
  ];

  const platforms = [
    { name: 'Twitter/X', supported: true },
    { name: 'YouTube', supported: true },
    { name: 'Reddit', supported: true },
    { name: 'Facebook', supported: true },
    { name: 'Instagram', supported: true },
    { name: 'Discord', supported: false }
  ];

  const steps = [
    { number: '1', title: 'Download', description: 'Click the download button to get the extension' },
    { number: '2', title: 'Install', description: 'Open Chrome extensions and enable developer mode' },
    { number: '3', title: 'Load', description: 'Load the unpacked extension folder' },
    { number: '4', title: 'Enjoy', description: 'Start browsing with real-time protection' }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section - Aurora Gradient */}
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
              <Chrome className="h-20 w-20 text-white relative z-10 group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute inset-0 bg-white/40 rounded-full blur-2xl animate-pulse-glow"></div>
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-display font-bold text-white mb-8 animate-fade-in leading-tight">
            TypeAware Browser Extension
          </h1>
          
          <p className="text-xl md:text-2xl text-white/95 max-w-3xl mx-auto mb-12 animate-fade-in leading-relaxed font-light">
            Enhance your browsing experience with real-time AI-powered content moderation across all websites.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={downloadExtension} 
              className="bg-white text-primary hover:bg-white/90 shadow-2xl hover-scale text-lg px-8 py-6 rounded-xl font-bold"
              size="lg"
            >
              <Download className="w-6 h-6 mr-2" />
              Download Extension
            </Button>
            <Button 
              onClick={() => navigator.share({ title: 'TypeAware Extension', text: 'Check out TypeAware - AI-powered content moderation for safer online spaces', url: window.location.href })}
              className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 shadow-2xl hover-scale text-lg px-8 py-6 rounded-xl font-bold"
              size="lg"
            >
              <Share className="w-6 h-6 mr-2" />
              Share Extension
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 -mt-12 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <Card key={index} className="hover-lift-strong border-0 bg-gradient-card overflow-hidden relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <CardContent className="p-6 relative z-10 text-center">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                      <feature.icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="flex justify-center">
              <Button 
                onClick={() => window.open('/docs', '_blank')}
                variant="outline" 
                size="lg" 
                className="group hover-scale"
              >
                <FileText className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                View Documentation
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Support */}
      <section className="py-20 px-4 bg-muted/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-pattern-grid opacity-10"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
              <Globe className="h-4 w-4" />
              <span className="text-sm font-semibold">Platform Support</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6 bg-gradient-hero bg-clip-text text-transparent">
              Works Everywhere You Browse
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              TypeAware seamlessly integrates with your favorite platforms
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-4xl mx-auto">
            {platforms.map((platform, index) => (
              <Card key={index} className={`hover-lift border-0 bg-gradient-card text-center ${!platform.supported ? 'opacity-50' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex flex-col items-center gap-2">
                    {platform.supported ? (
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    ) : (
                      <div className="h-6 w-6 rounded-full border-2 border-muted-foreground"></div>
                    )}
                    <span className="text-sm font-medium">{platform.name}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="flex justify-center mt-8">
            <Button 
              onClick={() => window.open('/report-issue', '_blank')}
              variant="outline" 
              size="lg" 
              className="group hover-scale"
            >
              <Bug className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
              Report Issue
            </Button>
          </div>
        </div>
      </section>

      {/* Installation Steps */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-semibold">Easy Setup</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6 bg-gradient-hero bg-clip-text text-transparent">
              Get Started in Minutes
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Simple installation process to start protecting yourself online
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <Card key={index} className="hover-lift-strong border-0 bg-gradient-card overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <CardContent className="p-6 relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform">
                    <span className="text-2xl font-bold text-white">{step.number}</span>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
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
            Ready to Browse Safer?
          </h2>
          <p className="text-xl md:text-2xl text-white/95 mb-12 max-w-2xl mx-auto leading-relaxed font-light">
            Download the TypeAware extension and start protecting yourself today
          </p>
          
          <Button 
            onClick={downloadExtension} 
            className="bg-white text-primary hover:bg-white/90 shadow-2xl hover-scale text-lg px-8 py-6 rounded-xl font-bold"
            size="lg"
          >
            <Download className="w-6 h-6 mr-2" />
            Download Now
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Extension;