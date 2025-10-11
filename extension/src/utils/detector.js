

export class AdvancedDetector {
  constructor() {
    this.toxicityThreshold = 0.7;
    this.sentimentThreshold = -0.5;
  }
  

  // Enhanced pattern matching with context awareness
  detectWithContext(text, context = {}) {
    const result = {
      isAbusive: false,
      types: [],
      confidence: 0,
      severity: 'low',
      suggestions: []
    };

    // Basic pattern detection
    const basicDetection = this.basicPatternDetection(text);
    Object.assign(result, basicDetection);

    // Sentiment analysis (simplified)
    const sentiment = this.analyzeSentiment(text);
    if (sentiment.score < this.sentimentThreshold && sentiment.magnitude > 0.6) {
      result.isAbusive = true;
      result.types.push('negative');
      result.confidence = Math.max(result.confidence, sentiment.magnitude);
    }

    // Context-aware detection
    if (context.platform) {
      const platformSpecific = this.platformSpecificDetection(text, context.platform);
      if (platformSpecific.isAbusive) {
        result.isAbusive = true;
        result.types.push(...platformSpecific.types);
        result.confidence = Math.max(result.confidence, platformSpecific.confidence);
      }
    }

    // Determine severity
    result.severity = this.calculateSeverity(result.confidence, result.types);
    
    // Generate suggestions based on detected types
    result.suggestions = this.generateContextualSuggestions(result.types, text);

    return result;
  }

  basicPatternDetection(text) {
    const patterns = {
      harassment: {
        patterns: [
          /\b(kill\s+yourself|kys|end\s+it)\b/gi,
          /\b(nobody\s+likes\s+you|everyone\s+hates\s+you)\b/gi,
          /\b(you\s+should\s+die|go\s+die)\b/gi,
          /\b(worthless|pathetic|disgusting)\s+(piece\s+of\s+)?(\w+)/gi
        ],
        weight: 0.9
      },
      hate: {
        patterns: [
          /\b(i\s+hate\s+you|hate\s+your\s+guts)\b/gi,
          /\b(racist|homophobic|transphobic)\s+(\w+)/gi,
          /\b(you\s+people|your\s+kind)\b/gi
        ],
        weight: 0.85
      },
      threats: {
        patterns: [
          /\b(i'll\s+find\s+you|gonna\s+get\s+you)\b/gi,
          /\b(you're\s+dead|watch\s+your\s+back)\b/gi,
          /\b(beat\s+you\s+up|kick\s+your\s+ass)\b/gi
        ],
        weight: 0.95
      },
      spam: {
        patterns: [
          /\b(buy\s+now|limited\s+time|act\s+fast)\b/gi,
          /\b(click\s+here|visit\s+our\s+site)\b/gi,
          /\$\d+|\d+%\s+off|free\s+\$\d+/gi
        ],
        weight: 0.6
      }
    };

    const result = {
      isAbusive: false,
      types: [],
      confidence: 0
    };

    for (const [type, config] of Object.entries(patterns)) {
      for (const pattern of config.patterns) {
        if (pattern.test(text)) {
          result.isAbusive = true;
          if (!result.types.includes(type)) {
            result.types.push(type);
          }
          result.confidence = Math.max(result.confidence, config.weight);
        }
      }
    }

    return result;
  }

  analyzeSentiment(text) {
    // Simplified sentiment analysis
    const positiveWords = ['good', 'great', 'awesome', 'amazing', 'wonderful', 'excellent', 'fantastic', 'love', 'like', 'happy'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'disgusting', 'hate', 'stupid', 'dumb', 'ugly', 'worst'];
    
    const words = text.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;

    words.forEach(word => {
      if (positiveWords.includes(word)) positiveCount++;
      if (negativeWords.includes(word)) negativeCount++;
    });

    const totalSentimentWords = positiveCount + negativeCount;
    const score = totalSentimentWords > 0 ? (positiveCount - negativeCount) / totalSentimentWords : 0;
    const magnitude = totalSentimentWords / words.length;

    return { score, magnitude };
  }

  platformSpecificDetection(text, platform) {
    const result = {
      isAbusive: false,
      types: [],
      confidence: 0
    };

    switch (platform) {
      case 'twitter.com':
      case 'x.com':
        // Twitter-specific patterns
        if (/@\w+\s+(is\s+)?stupid|@\w+\s+sucks/gi.test(text)) {
          result.isAbusive = true;
          result.types.push('harassment');
          result.confidence = 0.7;
        }
        break;
        
      case 'youtube.com':
        // YouTube-specific patterns
        if (/first|thumbs\s+up\s+if/gi.test(text) && text.length < 20) {
          result.isAbusive = true;
          result.types.push('spam');
          result.confidence = 0.5;
        }
        break;
        
      case 'reddit.com':
        // Reddit-specific patterns
        if (/downvoted|karma\s+whore/gi.test(text)) {
          result.isAbusive = true;
          result.types.push('harassment');
          result.confidence = 0.6;
        }
        break;
    }

    return result;
  }

  calculateSeverity(confidence, types) {
    if (confidence >= 0.8 || types.includes('threats')) {
      return 'high';
    } else if (confidence >= 0.6 || types.includes('harassment')) {
      return 'medium';
    }
    return 'low';
  }

  generateContextualSuggestions(types, originalText) {
    const suggestionMap = {
      harassment: [
        "I respectfully disagree with your perspective",
        "I see this differently and would like to discuss",
        "Perhaps we can find common ground on this topic"
      ],
      hate: [
        "I understand we have different viewpoints",
        "Let's focus on the issue rather than personal attacks",
        "I appreciate your passion, but let's keep this constructive"
      ],
      threats: [
        "I'm really frustrated with this situation",
        "This is disappointing and concerning to me",
        "I strongly disagree with this approach"
      ],
      spam: [
        "I'd like to share something relevant with you",
        "Here's an interesting resource on this topic",
        "You might find this information helpful"
      ],
      negative: [
        "I'm having trouble with this",
        "This situation is challenging for me",
        "I'm not satisfied with how this is going"
      ]
    };

    const suggestions = [];
    types.forEach(type => {
      if (suggestionMap[type]) {
        suggestions.push(...suggestionMap[type]);
      }
    });

    // Remove duplicates and limit to 3 suggestions
    return [...new Set(suggestions)].slice(0, 3);
  }

  // Fuzzy matching for creative spelling of offensive words
  fuzzyMatch(text, pattern) {
    // Simple fuzzy matching - replace with more sophisticated algorithm if needed
    const fuzzyPattern = pattern.replace(/[aeiou]/gi, '[aeiou@3!0*]');
    return new RegExp(fuzzyPattern, 'gi').test(text);
  }

  // Check for leetspeak and character substitution
  normalizeLeetspeak(text) {
    const substitutions = {
      '3': 'e', '1': 'i', '0': 'o', '4': 'a', '5': 's',
      '7': 't', '8': 'b', '@': 'a', '$': 's', '!': 'i'
    };

    let normalized = text.toLowerCase();
    for (const [leet, normal] of Object.entries(substitutions)) {
      normalized = normalized.replace(new RegExp(leet, 'g'), normal);
    }

    return normalized;
  }
}