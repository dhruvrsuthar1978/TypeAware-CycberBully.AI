import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { TestTube, Zap, Sparkles } from 'lucide-react';

const AiTools = () => {
  const [testText, setTestText] = useState('');
  const [aiResults, setAiResults] = useState(null);
  const [rephraseSuggestions, setRephraseSuggestions] = useState([]);
  const [testing, setTesting] = useState(false);

  const testAI = async () => {
    if (!testText.trim()) {
      alert('Please enter some text to test');
      return;
    }

    setTesting(true);
    try {
      // Call real AI analysis API
      const analyzeResponse = await fetch('http://localhost:5000/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: testText }),
      });

      if (!analyzeResponse.ok) {
        throw new Error(`Analysis failed: ${analyzeResponse.status}`);
      }

      const analyzeData = await analyzeResponse.json();

      // Call rephrase suggestions API
      const rephraseResponse = await fetch('http://localhost:5000/api/ai/rephrase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: testText }),
      });

      let rephraseData = [];
      if (rephraseResponse.ok) {
        const rephraseResult = await rephraseResponse.json();
        rephraseData = rephraseResult.suggestions || rephraseResult.data?.suggestions || [];
      }

      setAiResults(analyzeData);
      setRephraseSuggestions(rephraseData);
    } catch (error) {
      console.error('AI test failed:', error);
      alert(`Failed to test AI: ${error.message}. Ensure the backend server is running on port 5000.`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="hover-lift border-0 bg-gradient-card shadow-elegant">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <TestTube className="h-6 w-6 text-primary" />
          AI Testing Tools
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <label className="block text-sm font-semibold mb-3 text-foreground">Test Text</label>
          <Textarea
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            placeholder="Enter text to test AI detection..."
            rows={5}
            className="bg-background/50 backdrop-blur-sm border-border/50 focus:border-primary transition-colors resize-none"
          />
        </div>
        <Button
          onClick={testAI}
          disabled={testing}
          className="w-full md:w-auto bg-gradient-primary hover:opacity-90 transition-opacity shadow-lg hover-scale"
          size="lg"
        >
          {testing ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Testing AI...
            </>
          ) : (
            <>
              <Zap className="h-5 w-5 mr-2" />
              Test AI Detection
            </>
          )}
        </Button>

        {aiResults && (
          <div className="p-6 bg-muted/30 backdrop-blur-sm rounded-xl border border-border/50 animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-primary" />
              <h4 className="font-semibold text-lg text-foreground">AI Results</h4>
            </div>
            <pre className="text-sm bg-background/80 p-4 rounded-lg border border-border/50 overflow-x-auto font-mono">
              {JSON.stringify(aiResults, null, 2)}
            </pre>
          </div>
        )}

        {rephraseSuggestions.length > 0 && (
          <div className="p-6 bg-gradient-to-br from-primary/5 to-transparent backdrop-blur-sm rounded-xl border border-primary/20 animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-primary" />
              <h4 className="font-semibold text-lg text-foreground">Rephrase Suggestions</h4>
            </div>
            <ul className="space-y-3">
              {rephraseSuggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start gap-3 text-sm">
                  <div className="w-6 h-6 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">{index + 1}</span>
                  </div>
                  <span className="text-muted-foreground leading-relaxed">{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AiTools;
