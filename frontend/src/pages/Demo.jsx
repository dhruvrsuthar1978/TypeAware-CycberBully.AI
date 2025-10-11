import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Sparkles, AlertTriangle, Info, Zap, TrendingUp, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

function Demo() {
  const navigate = useNavigate();
  const [userText, setUserText] = useState("");
  const [aiResult, setAiResult] = useState("");
  const [rephraseResult, setRephraseResult] = useState("");
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Function to call backend API for rephrasing
  const getRephraseSuggestions = async (text) => {
    try {
      const response = await fetch("/api/ai/rephrase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await response.json();

      if (data.success && data.data && data.data.suggestions && data.data.suggestions.length > 0) {
        const suggestion = data.data.suggestions[0].suggested_text;
        setRephraseResult(suggestion);
        return suggestion;
      } else {
        setRephraseResult("No rephrasing suggestion available");
        return null;
      }
    } catch (err) {
      console.error("Rephrase request failed:", err);
      setRephraseResult("Error getting rephrasing suggestion");
      return null;
    }
  };

  // Function to call backend API for analysis
  const analyzeText = async (text) => {
    if (!text.trim()) {
      setAiResult("");
      setRephraseResult("");
      return;
    }
    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      const data = await response.json();

      if (data.success && data.data) {
        const analysis = data.data;
        let result = `Category: ${analysis.category}\nSeverity: ${analysis.severity}\nToxicity Score: ${analysis.toxicity_score}\nExplanation: ${analysis.explanation}\nSuggestion: ${analysis.suggestion}`;

        // Check if bullying is detected and suggest rephrase
        const category = analysis.category?.toLowerCase() || "";
        const severity = analysis.severity?.toLowerCase() || "";
        if (category.includes("bullying") || category.includes("harassment") || severity === "high") {
          const rephrase = await getRephraseSuggestions(text);
          if (rephrase) {
            // Removed rephrase suggestion from result
          }
        } else {
          setRephraseResult("");
        }

        setAiResult(result);
      } else {
        setAiResult("Error: Invalid response format");
        setRephraseResult("");
      }
    } catch (err) {
      console.error("AI request failed:", err);
      setAiResult("Error analyzing text");
      setRephraseResult("");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Debounce input to avoid flooding the backend
  useEffect(() => {
    if (typingTimeout) clearTimeout(typingTimeout);
    const timeout = setTimeout(() => {
      analyzeText(userText);
    }, 500); // 0.5s delay
    setTypingTimeout(timeout);

    return () => clearTimeout(timeout);
  }, [userText]);

  const features = [
    { icon: Shield, text: 'Real-time threat detection', color: 'from-purple-500 to-pink-500' },
    { icon: Zap, text: 'Instant AI analysis', color: 'from-blue-500 to-cyan-500' },
    { icon: Sparkles, text: 'Smart rephrasing suggestions', color: 'from-green-500 to-emerald-500' },
    { icon: CheckCircle, text: 'Privacy-first processing', color: 'from-orange-500 to-red-500' }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section - Aurora Gradient */}
      <section className="relative py-20 px-4 bg-gradient-aurora overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-transparent"></div>
        
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 bg-pattern-dots opacity-20"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-10 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-8">
            <div className="relative group">
              <Shield className="h-16 w-16 text-white relative z-10 group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute inset-0 bg-white/40 rounded-full blur-2xl animate-pulse-glow"></div>
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-display font-bold text-white mb-6 animate-fade-in leading-tight">
            TypeAware Demo Center
          </h1>
          
          <p className="text-xl md:text-2xl text-white/95 max-w-3xl mx-auto mb-8 animate-fade-in leading-relaxed font-light">
            Test our advanced AI-powered content moderation technology. Analyze text for toxicity, harassment, and safety threats in real-time.
          </p>
        </div>
      </section>

      {/* Features Bar */}
      <section className="py-8 px-4 -mt-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {features.map((feature, index) => (
              <Card key={index} className="glass-card-strong border-white/30 hover-lift text-center">
                <CardContent className="p-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <p className="text-sm font-medium text-foreground pt-3">{feature.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Column: Input */}
            <Card className="hover-lift-strong border-0 bg-gradient-card shadow-elegant overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-3 text-2xl font-display">
                  <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-lg">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  Text Input & Analysis
                </CardTitle>
                <CardDescription className="text-base">
                  Type or paste text to analyze and get AI-powered insights
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 relative z-10">
                <div className="relative">
                  <textarea
                    placeholder="Type or paste text here to analyze for toxicity, harassment, or harmful content..."
                    value={userText}
                    onChange={(e) => setUserText(e.target.value)}
                    rows={14}
                    className="w-full p-4 border-2 border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-base resize-none bg-background/50 backdrop-blur-sm transition-all duration-300"
                  />
                  {userText && (
                    <div className="absolute bottom-4 right-4 text-xs font-medium text-muted-foreground bg-muted/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-border/50">
                      {userText.length} characters
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Right Column: Results */}
            <Card className="hover-lift-strong border-0 bg-gradient-card shadow-elegant overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-security/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-3 text-2xl font-display">
                  <div className="w-12 h-12 rounded-xl bg-gradient-security flex items-center justify-center shadow-lg">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  Analysis Results
                </CardTitle>
                <CardDescription className="text-base">
                  Real-time AI analysis of content safety and toxicity levels
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                {isAnalyzing ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <div className="relative">
                      <Shield className="h-16 w-16 text-primary animate-pulse" />
                      <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl animate-pulse"></div>
                    </div>
                    <p className="text-muted-foreground font-semibold">Analyzing content...</p>
                  </div>
                ) : aiResult ? (
                  <Card className="border-2 border-primary/30 bg-primary/5 animate-fade-in hover-lift">
                    <CardContent className="p-6">
                      <pre className="whitespace-pre-wrap text-foreground text-sm leading-relaxed">
                        {aiResult}
                      </pre>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 space-y-4 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center">
                      <Info className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-foreground font-semibold mb-2">
                        No analysis yet
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Start typing to see real-time analysis results
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="py-12 px-4 bg-muted/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-pattern-grid opacity-10"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <Card className="hover-lift border-0 bg-gradient-card shadow-elegant overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <CardContent className="p-8 relative z-10">
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Info className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-2xl mb-3 text-foreground">
                    How It Works
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-lg">
                    Our AI analyzes text in real-time using advanced machine learning models trained on millions of data points. 
                    The system detects toxicity, harassment, hate speech, and other harmful content while providing constructive 
                    suggestions for rephrasing problematic text. All processing happens instantly with sub-second response times.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-aurora relative overflow-hidden">
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
            Ready to Get Started?
          </h2>
          <p className="text-xl md:text-2xl text-white/95 mb-12 max-w-2xl mx-auto leading-relaxed font-light">
            Join thousands of users protecting their online communities with TypeAware
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-white text-primary hover:bg-white/90 shadow-2xl hover-scale text-lg px-8 py-6 rounded-xl font-bold" onClick={() => navigate('/signup')}>
              <Shield className="w-5 h-5 mr-2" />
              Get Started Free
            </Button>
            <Button variant="outline" className="border-white/50 text-white bg-white/10 hover:bg-white/20 backdrop-blur-xl shadow-lg hover-scale text-lg px-8 py-6 rounded-xl font-bold" onClick={() => navigate('/learn-more')}>
              Learn More
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Demo;