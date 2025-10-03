import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Zap, Users, BarChart3, Globe, Lock } from 'lucide-react';

const LearnMore = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/30 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Learn More About TypeAware
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Discover how our AI-powered content moderation technology helps create safer online communities.
          </p>
        </div>

        {/* What is TypeAware */}
        <Card className="hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              What is TypeAware?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              TypeAware is an advanced AI-powered content moderation platform designed to detect and prevent harmful content in real-time.
              Our technology analyzes text as users type, providing instant feedback and suggestions to promote positive communication.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="text-center">
                <Shield className="w-12 h-12 text-primary mx-auto mb-2" />
                <h4 className="font-semibold">Real-time Detection</h4>
                <p className="text-sm text-muted-foreground">Analyze content as you type</p>
              </div>
              <div className="text-center">
                <Zap className="w-12 h-12 text-primary mx-auto mb-2" />
                <h4 className="font-semibold">Instant Results</h4>
                <p className="text-sm text-muted-foreground">Get immediate safety scores</p>
              </div>
              <div className="text-center">
                <Users className="w-12 h-12 text-primary mx-auto mb-2" />
                <h4 className="font-semibold">Community Focused</h4>
                <p className="text-sm text-muted-foreground">Build safer online spaces</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card className="hover-lift">
          <CardHeader>
            <CardTitle>How TypeAware Works</CardTitle>
            <CardDescription>
              Our multi-layered approach ensures comprehensive content safety
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Badge className="mt-1">1</Badge>
                  <div>
                    <h4 className="font-semibold">Text Analysis</h4>
                    <p className="text-sm text-muted-foreground">
                      Advanced NLP algorithms analyze text for toxicity, harassment, and harmful patterns.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Badge className="mt-1">2</Badge>
                  <div>
                    <h4 className="font-semibold">Pattern Recognition</h4>
                    <p className="text-sm text-muted-foreground">
                      Machine learning models identify subtle forms of harmful content and obfuscation techniques.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Badge className="mt-1">3</Badge>
                  <div>
                    <h4 className="font-semibold">Context Understanding</h4>
                    <p className="text-sm text-muted-foreground">
                      AI considers context, intent, and cultural nuances for accurate detection.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Badge className="mt-1">4</Badge>
                  <div>
                    <h4 className="font-semibold">Real-time Feedback</h4>
                    <p className="text-sm text-muted-foreground">
                      Users receive instant safety scores and suggestions for improvement.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Badge className="mt-1">5</Badge>
                  <div>
                    <h4 className="font-semibold">Rephrasing Suggestions</h4>
                    <p className="text-sm text-muted-foreground">
                      AI-powered alternatives help users communicate more effectively.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Badge className="mt-1">6</Badge>
                  <div>
                    <h4 className="font-semibold">Continuous Learning</h4>
                    <p className="text-sm text-muted-foreground">
                      Our models improve over time with new data and feedback.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="hover-lift">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Advanced Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Comprehensive reporting and analytics to track content safety metrics and trends.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full" />
                  Real-time dashboards
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full" />
                  Trend analysis
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full" />
                  Custom reporting
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                Multi-Platform Support
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Works across various platforms and integrates seamlessly with existing systems.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full" />
                  Browser extensions
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full" />
                  API integrations
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full" />
                  SDK for developers
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Use Cases */}
        <Card className="hover-lift">
          <CardHeader>
            <CardTitle>Perfect For</CardTitle>
            <CardDescription>
              TypeAware serves various industries and use cases
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <Users className="w-12 h-12 text-primary mx-auto mb-3" />
                <h4 className="font-semibold mb-2">Social Media</h4>
                <p className="text-sm text-muted-foreground">
                  Protect communities and maintain positive engagement on social platforms.
                </p>
              </div>

              <div className="text-center">
                <Lock className="w-12 h-12 text-primary mx-auto mb-3" />
                <h4 className="font-semibold mb-2">Online Gaming</h4>
                <p className="text-sm text-muted-foreground">
                  Create safe gaming environments free from harassment and toxicity.
                </p>
              </div>

              <div className="text-center">
                <Globe className="w-12 h-12 text-primary mx-auto mb-3" />
                <h4 className="font-semibold mb-2">Education</h4>
                <p className="text-sm text-muted-foreground">
                  Foster positive learning environments in online classrooms and forums.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <Card className="hover-lift bg-gradient-card">
          <CardContent className="text-center py-8">
            <h3 className="text-2xl font-bold mb-4">Ready to Get Started?</h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Experience the power of AI-driven content moderation. Try our demo or contact us for a custom solution.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/demo" className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                Try Demo
              </a>
              <a href="/contact" className="inline-flex items-center justify-center px-6 py-3 border border-primary text-primary rounded-md hover:bg-primary hover:text-primary-foreground transition-colors">
                Contact Sales
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LearnMore;
