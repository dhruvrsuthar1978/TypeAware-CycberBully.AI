import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/enhanced-button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Shield, 
  Eye, 
  Ban,
  CheckCircle,
  Lightbulb,
  BarChart3,
  RefreshCw
} from 'lucide-react';

const ToxicityDemo = () => {
  const [inputText, setInputText] = useState('');
  const [detections, setDetections] = useState([]);
  const [isBlocked, setIsBlocked] = useState(false);
  const [stats, setStats] = useState({
    totalChecks: 0,
    detectionsFound: 0,
    blockedAttempts: 0
  });

  // Mock detection patterns
  const patterns = {
    hate: {
      keywords: ['hate', 'stupid', 'idiot', 'moron', 'dumb'],
      severity: 'high',
      suggestions: [
        "Try saying: 'I disagree with your opinion.'",
        "Consider: 'I have a different perspective.'",
        "Maybe: 'I see this differently.'"
      ]
    },
    harassment: {
      keywords: ['shut up', 'get lost', 'nobody asked', 'loser'],
      severity: 'medium',
      suggestions: [
        "Try: 'I'd prefer to end this conversation.'",
        "Consider: 'Let's agree to disagree.'",
        "Maybe: 'I think we should move on.'"
      ]
    },
    profanity: {
      keywords: ['damn', 'hell', 'crap', 'stupid'],
      severity: 'low',
      suggestions: [
        "Try: 'This is frustrating.'",
        "Consider: 'I'm disappointed.'",
        "Maybe: 'This isn't working.'"
      ]
    },
    spam: {
      keywords: ['click here', 'buy now', 'limited time', 'act fast'],
      severity: 'medium',
      suggestions: [
        "Share genuine recommendations instead",
        "Focus on helpful information",
        "Avoid promotional language"
      ]
    },
    threat: {
      keywords: ['kill', 'hurt', 'destroy', 'attack'],
      severity: 'high',
      suggestions: [
        "Express disagreement respectfully",
        "Take a break from the conversation",
        "Report serious threats to authorities"
      ]
    }
  };

  const analyzeText = (text) => {
    const lowerText = text.toLowerCase();
    const foundDetections = [];

    Object.entries(patterns).forEach(([type, pattern]) => {
      const found = pattern.keywords.some(keyword => lowerText.includes(keyword));
      if (found) {
        foundDetections.push({
          type: type,
          severity: pattern.severity,
          confidence: Math.floor(Math.random() * 30) + 70, // 70-99%
          suggestion: pattern.suggestions[Math.floor(Math.random() * pattern.suggestions.length)]
        });
      }
    });

    return foundDetections;
  };

  useEffect(() => {
    if (inputText.trim()) {
      const newDetections = analyzeText(inputText);
      setDetections(newDetections);
      
      const hasHighSeverity = newDetections.some(d => d.severity === 'high');
      setIsBlocked(hasHighSeverity);

      setStats(prev => ({
        totalChecks: prev.totalChecks + 1,
        detectionsFound: prev.detectionsFound + newDetections.length,
        blockedAttempts: prev.blockedAttempts + (hasHighSeverity ? 1 : 0)
      }));
    } else {
      setDetections([]);
      setIsBlocked(false);
    }
  }, [inputText]);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary'; // Using secondary instead of warning
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'hate': return <AlertTriangle className="h-4 w-4" />;
      case 'harassment': return <Ban className="h-4 w-4" />;
      case 'threat': return <Shield className="h-4 w-4" />;
      default: return <Eye className="h-4 w-4" />;
    }
  };

  const resetDemo = () => {
    setInputText('');
    setDetections([]);
    setIsBlocked(false);
    setStats({ totalChecks: 0, detectionsFound: 0, blockedAttempts: 0 });
  };

  const tryExamples = [
    "This is a normal, friendly message!",
    "You're so stupid and dumb",
    "Shut up nobody asked for your opinion",
    "Click here to buy now - limited time offer!",
    "I disagree with your perspective on this topic"
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <Shield className="h-12 w-12 mx-auto text-primary mb-4" />
        <h1 className="text-3xl font-bold mb-2">TypeAware Live Demo</h1>
        <p className="text-muted-foreground">
          Test our AI-powered detection system by typing in the box below
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Section */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Type to Test Detection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  placeholder="Type any message to see real-time detection..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="min-h-[120px] text-base"
                />
                
                {/* Status Indicator */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {detections.length === 0 && inputText.trim() && (
                      <>
                        <CheckCircle className="h-5 w-5 text-secondary" />
                        <span className="text-secondary font-medium">Message looks safe!</span>
                      </>
                    )}
                    {detections.length > 0 && !isBlocked && (
                      <>
                        <AlertTriangle className="h-5 w-5 text-warning" />
                        <span className="text-warning font-medium">Potential issues detected</span>
                      </>
                    )}
                    {isBlocked && (
                      <>
                        <Ban className="h-5 w-5 text-destructive" />
                        <span className="text-destructive font-medium">Message blocked</span>
                      </>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" onClick={resetDemo}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                </div>

                {/* Quick Examples */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Try these examples:</p>
                  <div className="flex flex-wrap gap-2">
                    {tryExamples.map((example, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => setInputText(example)}
                        className="text-xs"
                      >
                        {example.substring(0, 30)}...
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detections */}
          {detections.length > 0 && (
            <Card className="shadow-card border-warning/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-warning">
                  <AlertTriangle className="h-5 w-5" />
                  Detection Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {detections.map((detection, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(detection.type)}
                          <span className="font-medium capitalize">{detection.type}</span>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={getSeverityColor(detection.severity)}>
                            {detection.severity} risk
                          </Badge>
                          <Badge variant="outline">
                            {detection.confidence}% confidence
                          </Badge>
                        </div>
                      </div>
                      {detection.suggestion && (
                        <div className="bg-muted/50 p-3 rounded-md">
                          <div className="flex items-start gap-2">
                            <Lightbulb className="h-4 w-4 text-primary mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">Suggestion:</p>
                              <p className="text-sm text-muted-foreground">{detection.suggestion}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Demo Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{stats.totalChecks}</div>
                  <div className="text-sm text-muted-foreground">Total Checks</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-warning">{stats.detectionsFound}</div>
                  <div className="text-sm text-muted-foreground">Issues Detected</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-destructive">{stats.blockedAttempts}</div>
                  <div className="text-sm text-muted-foreground">Messages Blocked</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Detection Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span>🎯 Hate Speech</span>
                  <Badge variant="destructive">High Risk</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>😠 Harassment</span>
                  <Badge variant="secondary">Medium Risk</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>🤬 Profanity</span>
                  <Badge variant="outline">Low Risk</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>📧 Spam</span>
                  <Badge variant="secondary">Medium Risk</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>⚡ Threats</span>
                  <Badge variant="destructive">High Risk</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card bg-gradient-primary text-white">
            <CardContent className="p-6 text-center">
              <Shield className="h-8 w-8 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Real-time Protection</h3>
              <p className="text-sm opacity-90">
                This demo shows how TypeAware works in real-time across any website
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ToxicityDemo;
