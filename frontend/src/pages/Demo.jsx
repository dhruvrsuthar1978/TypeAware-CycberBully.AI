import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Shield, AlertTriangle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const Demo = () => {
  const [testText, setTestText] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(true);
  const [rephrasingMode, setRephrasingMode] = useState(false);
  const [rephrasingSuggestions, setRephrasingSuggestions] = useState([]);
  const [selectedText, setSelectedText] = useState('');
  const { toast } = useToast();
  const { getAuthHeaders } = useAuth();

  // Get rephrasing suggestions
  const getRephrasingSuggestions = async (text) => {
    try {
      const response = await fetch('http://localhost:8000/rephrase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error('Failed to get rephrasing suggestions');
      }

      const data = await response.json();
      return data.rephrased_suggestions || [];
    } catch (error) {
      console.error('Rephrasing error:', error);
      return [];
    }
  };

  // Perform final analysis
  const performAnalysis = async (text) => {
    try {
      const response = await fetch('http://localhost:5000/api/ai/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ content: text }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze text');
      }

      const data = await response.json();

      // Transform AI response to match UI expectations
      const threats = [];
      if (data.flagged) {
        data.reasons.forEach(reason => {
          let severity = 'medium';
          if (reason.includes('High toxicity')) severity = 'high';
          if (reason.includes('Harassment') || reason.includes('critical')) severity = 'critical';

          threats.push({
            type: reason.toLowerCase().includes('toxicity') ? 'toxicity' : 'other',
            severity,
            word: reason,
            context: reason
          });
        });
      }

      setAnalysisResult({
        threats,
        safetyScore: Math.round((1 - data.toxicity_score) * 100),
        suggestions: data.flagged ? [
          'Consider using more respectful language',
          'Focus on constructive communication',
          'Take a moment before posting'
        ] : ['Your message looks great!']
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: "Unable to analyze text. Please try again."
      });
      console.error('AI analysis error:', error);
    }
  };

  // Demo analysis function
  const analyzeText = async (text) => {
    if (!text.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter some text to analyze"
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);
    setRephrasingMode(false);
    setRephrasingSuggestions([]);

    try {
      // Always get rephrasing suggestions first for demo purposes
      const suggestions = await getRephrasingSuggestions(text);
      if (suggestions.length > 0) {
        setRephrasingSuggestions(suggestions);
        setRephrasingMode(true);
        setIsAnalyzing(false);
        return;
      }

      // If no rephrasing suggestions available, proceed directly to analysis
      await performAnalysis(text);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: "Unable to analyze text. Please try again."
      });
      console.error('AI analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle rephrasing selection
  const selectRephrasedText = async (rephrasedText) => {
    setSelectedText(rephrasedText);
    setRephrasingMode(false);
    setIsAnalyzing(true);

    try {
      await performAnalysis(rephrasedText);
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Proceed with original text
  const proceedWithOriginal = async () => {
    setRephrasingMode(false);
    setIsAnalyzing(true);

    try {
      await performAnalysis(testText);
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };



  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-danger text-danger-foreground';
      case 'high': return 'bg-warning text-warning-foreground';
      case 'medium': return 'bg-accent text-accent-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getSafetyScoreColor = (score) => {
    if (score >= 80) return 'text-security';
    if (score >= 60) return 'text-warning';
    return 'text-danger';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/30 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              TypeAware Demo Center
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Test our advanced AI-powered content moderation technology. Analyze text for toxicity, harassment, and safety threats.
            </p>
          </div>
          {/* Removed Demo Credentials section as per user request */}



        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Text Testing Area */}
          <Card className="hover-lift">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                Text Analysis Demo
              </CardTitle>
              <CardDescription>
                Enter any text to see how our AI detection system works
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Type your message here... (try words like 'hate', 'stupid', or 'YOU SUCK' to see detection in action)"
                value={testText}
                onChange={async (e) => {
                  const newText = e.target.value;
                  setTestText(newText);
                  // Automatically analyze text on input change
                  if (newText.trim()) {
                    await analyzeText(newText);
                  } else {
                    setAnalysisResult(null);
                    setRephrasingMode(false);
                    setRephrasingSuggestions([]);
                  }
                }}
                rows={6}
                className="transition-smooth focus:ring-2 focus:ring-primary/20"
              />
              
              <div className="flex gap-3">
                {/* Removed Analyze Text button as analysis is automatic */}
                <Button
                  variant="outline"
                  onClick={() => setShowAnalysis(!showAnalysis)}
                  size="lg"
                >
                  {showAnalysis ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </Button>
              </div>

              {testText && (
                <div className="text-sm text-muted-foreground">
                  Character count: {testText.length}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Analysis Results */}
          <Card className={`hover-lift transition-all duration-500 ${analysisResult && showAnalysis ? 'ring-2 ring-primary/20' : ''}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Analysis Results
              </CardTitle>
              <CardDescription>
                Real-time safety assessment and threat detection
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Rephrasing Mode */}
              {rephrasingMode && (
                <div className="space-y-6 animate-fade-in">
                  <div className="text-center">
                    <AlertTriangle className="w-12 h-12 text-warning mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Potential Issues Detected
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Your message may contain harmful content. Here are some kinder alternatives:
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-foreground">Rephrasing Suggestions:</h4>
                    {rephrasingSuggestions.map((suggestion, index) => (
                      <Card key={index} className="hover-scale cursor-pointer border-2 hover:border-primary/50" onClick={() => selectRephrasedText(suggestion)}>
                        <CardContent className="p-4">
                          <p className="text-foreground">{suggestion}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={proceedWithOriginal}
                      variant="outline"
                      className="flex-1"
                    >
                      Proceed with Original Text
                    </Button>
                    <Button
                      onClick={() => setRephrasingMode(false)}
                      variant="secondary"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {!analysisResult && !rephrasingMode && showAnalysis && (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Enter text and click "Analyze Text" to see results</p>
                </div>
              )}

              {analysisResult && !rephrasingMode && showAnalysis && (
                <div className="space-y-6 animate-fade-in">
                  {/* Safety Score */}
                  <div className="text-center p-4 bg-gradient-card rounded-lg">
                    <div className={`text-3xl font-bold ${getSafetyScoreColor(analysisResult.safetyScore)}`}>
                      {analysisResult.safetyScore}%
                    </div>
                    <div className="text-sm text-muted-foreground">Safety Score</div>
                    <div className="w-full bg-muted rounded-full h-2 mt-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-1000 ${
                          analysisResult.safetyScore >= 80 ? 'bg-security' :
                          analysisResult.safetyScore >= 60 ? 'bg-warning' : 'bg-danger'
                        }`}
                        style={{ width: `${analysisResult.safetyScore}%` }}
                      />
                    </div>
                  </div>

                  {/* Threats Detected */}
                  {analysisResult.threats.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-foreground flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-warning" />
                        Threats Detected ({analysisResult.threats.length})
                      </h4>
                      {analysisResult.threats.map((threat, index) => (
                  <Alert key={index} className="border-l-4 border-l-warning bg-warning/5 hover-scale">
                    <AlertTriangle className="w-4 h-4 text-warning" />
                    <AlertDescription>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-foreground">{threat.word}</span>
                          <p className="text-xs text-muted-foreground mt-1">{threat.context}</p>
                        </div>
                        <Badge className={getSeverityColor(threat.severity)}>
                          {threat.severity}
                        </Badge>
                      </div>
                    </AlertDescription>
                  </Alert>
                      ))}
                    </div>
                  )}

                  {/* Suggestions */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-foreground flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-security" />
                      Suggestions
                    </h4>
                    <ul className="space-y-1">
                      {analysisResult.suggestions.map((suggestion, index) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                          <div className="w-1 h-1 bg-primary rounded-full" />
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {analysisResult.threats.length === 0 && (
                  <Alert className="border-l-4 border-l-security bg-security/5 hover-scale">
                    <CheckCircle className="w-4 h-4 text-security" />
                    <AlertDescription className="text-foreground font-medium">
                      Great! No safety threats detected in your message. It's safe to post.
                    </AlertDescription>
                  </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover-lift text-center">
            <CardContent className="pt-6">
              <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Real-time Detection</h3>
              <p className="text-sm text-muted-foreground">Instant analysis as you type</p>
            </CardContent>
          </Card>
          
          <Card className="hover-lift text-center">
            <CardContent className="pt-6">
              <AlertTriangle className="w-12 h-12 text-warning mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Multi-threat Analysis</h3>
              <p className="text-sm text-muted-foreground">Detects toxicity, harassment & more</p>
            </CardContent>
          </Card>
          
          <Card className="hover-lift text-center">
            <CardContent className="pt-6">
              <CheckCircle className="w-12 h-12 text-security mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Smart Suggestions</h3>
              <p className="text-sm text-muted-foreground">AI-powered improvement tips</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Demo;