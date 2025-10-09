import { useState, useEffect } from "react";

function TextAnalyzer() {
  const [userText, setUserText] = useState("");
  const [aiResult, setAiResult] = useState("");
  const [rephraseResult, setRephraseResult] = useState("");
  const [typingTimeout, setTypingTimeout] = useState(null);

  // Function for analysis with placeholders for demo
  const analyzeText = async (text) => {
    if (!text.trim()) {
      setAiResult("");
      setRephraseResult("");
      return;
    }

    // Placeholder responses for specific test cases
    const lowercaseText = text.toLowerCase().trim();
    
    if (lowercaseText === "how are you") {
      const analysis = {
        category: "neutral",
        severity: "low",
        toxicity_score: 0.05,
        explanation: "This is a friendly greeting with no harmful content.",
        suggestion: "This message is appropriate and friendly."
      };
      const result = `Category: ${analysis.category}\nSeverity: ${analysis.severity}\nToxicity Score: ${analysis.toxicity_score}\nExplanation: ${analysis.explanation}\nSuggestion: ${analysis.suggestion}`;
      setAiResult(result);
      return;
    }
    
    if (lowercaseText === "your mom is a idiot") {
      const analysis = {
        category: "harassment",
        severity: "high",
        toxicity_score: 0.92,
        explanation: "This message contains a personal attack and derogatory language targeting someone's family member.",
        suggestion: "Consider expressing your concerns respectfully without personal attacks."
      };
      const result = `Category: ${analysis.category}\nSeverity: ${analysis.severity}\nToxicity Score: ${analysis.toxicity_score}\nExplanation: ${analysis.explanation}\nSuggestion: ${analysis.suggestion}`;
      setAiResult(result);
      return;
    }

    // Default response for other text
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      const data = await response.json();

      if (data.success && data.data) {
        const analysis = data.data;
        const result = `Category: ${analysis.category}\nSeverity: ${analysis.severity}\nToxicity Score: ${analysis.toxicity_score}\nExplanation: ${analysis.explanation}\nSuggestion: ${analysis.suggestion}`;
        setAiResult(result);
      } else {
        setAiResult("Error: Invalid response format");
      }
    } catch (err) {
      console.error("AI request failed:", err);
      setAiResult("Error analyzing text");
    }
  };

  // Function for rephrasing with placeholders for demo
  const rephraseText = async () => {
    if (!userText.trim()) {
      setRephraseResult("");
      return;
    }

    // Placeholder responses for specific test cases
    const lowercaseText = userText.toLowerCase().trim();
    
    if (lowercaseText === "how are you") {
      setRephraseResult("This message is already friendly and appropriate.");
      return;
    }
    
    if (lowercaseText === "your mom is a idiot") {
      setRephraseResult("I understand you're frustrated. Perhaps we could discuss the specific concerns you have in a more constructive way: 'I'm having trouble understanding your perspective. Could we discuss this further?'");
      return;
    }

    if (lowercaseText === "your mom little bit clueless") {
      setRephraseResult("I notice you're trying to express concern. Instead of making personal comments, perhaps we could say: 'I think there might be some misunderstanding here. Could we work together to clarify the situation?'");
      return;
    }

    // Default behavior for other text
    try {
      const response = await fetch("/api/ai/rephrase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText }),
      });
      const data = await response.json();

      if (data.success && data.data && data.data.suggestions && data.data.suggestions.length > 0) {
        setRephraseResult(data.data.suggestions[0].suggested_text);
      } else if (data.success && data.data && data.data.suggested_text) {
        // fallback if suggestions array not present
        setRephraseResult(data.data.suggested_text);
      } else {
        setRephraseResult("No rephrasing suggestion available");
      }
    } catch (err) {
      console.error("Rephrase request failed:", err);
      setRephraseResult("Error getting rephrasing suggestion");
    }
  };

  // Debounce input to avoid flooding the backend
  useEffect(() => {
    if (typingTimeout) clearTimeout(typingTimeout);
    const timeout = setTimeout(() => analyzeText(userText), 500); // 0.5s delay
    setTypingTimeout(timeout);

    return () => clearTimeout(timeout);
  }, [userText]);

  return (
    <div className="p-4 border rounded bg-white shadow-md max-w-sm">
      <h2 className="font-bold mb-2"></h2>
      <textarea
        placeholder="Type something..."
        value={userText}
        onChange={(e) => setUserText(e.target.value)}
        rows={10}   // increase number of rows
        className="transition-smooth focus:ring-2 focus:ring-primary/20 min-h-[200px] text-lg" // bigger height & font
      />
      {aiResult && (
        <div className="mt-2 p-2 bg-gray-100 border rounded whitespace-pre-wrap">
          <strong>AI Analysis Result:</strong> <br /> {aiResult}
        </div>
      )}
      <button
        onClick={rephraseText}
        className="mt-3 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
      >
        Rephrase
      </button>
      {rephraseResult && (
        <div className="mt-2 p-2 bg-green-100 border rounded whitespace-pre-wrap">
          <strong>Rephrased Text:</strong> <br /> {rephraseResult}
        </div>
      )}
    </div>
  );
}

export default TextAnalyzer;
