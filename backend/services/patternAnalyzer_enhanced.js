/**
 * Enhanced PatternAnalyzer - Advanced JavaScript pattern analyzer with modern cyberbullying detection
 * Includes comprehensive patterns for various harassment types and contextual analysis
 */

class MessagePattern {
  constructor(patternType, confidence, description, severity, metadata = {}) {
    this.pattern_type = patternType;
    this.confidence = confidence;
    this.description = description;
    this.severity = severity;
    this.metadata = metadata;
  }
}

class PatternAnalysis {
  constructor(patterns, overallRisk, context) {
    this.patterns = patterns;
    this.overall_risk = overallRisk;
    this.context = context;
  }
}

class PatternAnalyzer {
  constructor() {
    this.patterns = this._initializePatterns();

    this.stats = {
      total_analyzed: 0,
      patterns_detected: 0,
      risk_assessments: {},
      error_count: 0
    };

    console.log('Enhanced PatternAnalyzer initialized');
  }

  _initializePatterns() {
    return {
      // Repetition patterns
      repetition: {
        patterns: [
          { regex: /(.)\1{3,}/gi, description: "Character repetition (4+)", severity: 2 },
          { regex: /\b(\w+)\s+\1\b/gi, description: "Word repetition", severity: 1 },
          { regex: /(!{3,}|\?{3,})/gi, description: "Punctuation repetition", severity: 1 }
        ]
      },

      // Caps patterns
      caps: {
        patterns: [
          { regex: /\b[A-Z]{4,}\b/g, description: "All caps words (4+ letters)", severity: 3 },
          { regex: /[A-Z]{10,}/g, description: "Long caps sequences", severity: 4 },
          { regex: /^[A-Z\s!?.]+$/, description: "All caps message", severity: 5 }
        ]
      },

      // Spam patterns
      spam: {
        patterns: [
          { regex: /(buy now|click here|free money|guaranteed)/gi, description: "Spam keywords", severity: 4 },
          { regex: /\$\d+.*(?:per|for|daily|hourly)/gi, description: "Money offers", severity: 4 },
          { regex: /(http|https|www\.)\S+/gi, description: "URLs in message", severity: 2 },
          { regex: /@\w+/g, description: "Multiple mentions", severity: 1 }
        ]
      },

      // Harassment patterns
      harassment: {
        patterns: [
          { regex: /\b(you|u)\s+(suck|are\s+(stupid|dumb|ugly|fat|gay))/gi, description: "Personal attacks", severity: 5 },
          { regex: /\b(go\s+)?kill\s+yourself/gi, description: "Self-harm encouragement", severity: 6 },
          { regex: /\b(no\s+one|nobody)\s+likes\s+you/gi, description: "Social isolation", severity: 4 },
          { regex: /\byou\s+(should\s+)?die/gi, description: "Death threats", severity: 6 }
        ]
      },

      // Cyberbullying patterns
      cyberbullying: {
        patterns: [
          { regex: /\beveryone\s+hates\s+you/gi, description: "Group exclusion", severity: 4 },
          { regex: /\byou\s+have\s+no\s+friends/gi, description: "Friendship attacks", severity: 4 },
          { regex: /\b(why\s+don'?t\s+you|just)\s+leave/gi, description: "Exclusion pressure", severity: 4 }
        ]
      },

      // Sexual harassment patterns
      sexual_harassment: {
        patterns: [
          { regex: /\bsend\s+(me\s+)?pics/gi, description: "Request for images", severity: 5 },
          { regex: /\bwhat\s+are\s+you\s+wearing/gi, description: "Clothing questions", severity: 3 },
          { regex: /\bwanna\s+(hook\s+up|meet)/gi, description: "Meeting proposals", severity: 4 }
        ]
      },

      // Threat patterns
      threats: {
        patterns: [
          { regex: /\bi\s+will\s+(kill|hurt|find|destroy)/gi, description: "Direct threats", severity: 6 },
          { regex: /\bwatch\s+your\s+back/gi, description: "Implied threats", severity: 5 },
          { regex: /\byou'?re\s+dead/gi, description: "Death threats", severity: 6 },
          { regex: /\bi\s+know\s+where\s+you\s+live/gi, description: "Location threats", severity: 6 }
        ]
      },

      // Hate speech patterns
      hate_speech: {
        patterns: [
          { regex: /\ball\s+\w+\s+(are|people\s+are)\s+(bad|evil|stupid|inferior)/gi, description: "Group generalizations", severity: 5 },
          { regex: /\bi\s+hate\s+all\s+\w+/gi, description: "Group hatred", severity: 5 },
          { regex: /\bdeath\s+to\s+all\s+\w+/gi, description: "Genocidal language", severity: 6 }
        ]
      },

      // Modern cyberbullying patterns
      modern_bullying: {
        patterns: [
          { regex: /\b(ghost|ignore)\s+(him|her|them|you)/gi, description: "Ghosting encouragement", severity: 4 },
          { regex: /\b(report|flag)\s+(him|her|them|you)/gi, description: "False reporting encouragement", severity: 4 },
          { regex: /\b(everyone|all)\s+(block|unfriend)/gi, description: "Coordinated blocking", severity: 4 },
          { regex: /\b(spread|share)\s+(this|it|rumor)/gi, description: "Rumor spreading", severity: 4 },
          { regex: /\b(expose|reveal)\s+(secret|truth|lie)/gi, description: "Exposure threats", severity: 5 }
        ]
      },

      // Gaslighting patterns
      gaslighting: {
        patterns: [
          { regex: /\byou'?re\s+(crazy|insane|mad|paranoid)/gi, description: "Mental health invalidation", severity: 4 },
          { regex: /\b(that\s+)?never\s+happened/gi, description: "Event denial", severity: 3 },
          { regex: /\byou'?re\s+(imagining|making\s+it\s+up)/gi, description: "Reality questioning", severity: 4 },
          { regex: /\b(it'?s\s+all\s+in\s+your\s+head)/gi, description: "Internalization blame", severity: 4 }
        ]
      },

      // Sextortion patterns
      sextortion: {
        patterns: [
          { regex: /\b(send\s+me|show\s+me)\s+(nude|naked|pic|photo)/gi, description: "Nude image requests", severity: 6 },
          { regex: /\b(i\s+will\s+)?leak\s+(your|the)\s+(pic|photo|nude)/gi, description: "Image leakage threats", severity: 6 },
          { regex: /\b(blackmail|extort)\s+(you|him|her)/gi, description: "Explicit extortion", severity: 6 },
          { regex: /\b(pay\s+me|send\s+money)\s+(or\s+else|or\s+i\s+will)/gi, description: "Payment demands", severity: 6 }
        ]
      },

      // Identity-based harassment
      identity_harassment: {
        patterns: [
          { regex: /\b(faggot|queer|homo)\b/gi, description: "Homophobic slurs", severity: 5 },
          { regex: /\b(nigger|coon|spook)\b/gi, description: "Racial slurs", severity: 5 },
          { regex: /\b(kike|heeb|christ-killer)\b/gi, description: "Anti-Semitic slurs", severity: 5 },
          { regex: /\b(chink|gook|slant-eye)\b/gi, description: "Anti-Asian slurs", severity: 5 },
          { regex: /\b(wetback|spic|anchor\s+baby)\b/gi, description: "Anti-Latino slurs", severity: 5 }
        ]
      },

      // Online radicalization patterns
      radicalization: {
        patterns: [
          { regex: /\b(join\s+us|fight\s+back|rise\s+up)/gi, description: "Call to action", severity: 4 },
          { regex: /\b(the\s+system|they|government)\s+(is\s+)?corrupt/gi, description: "Anti-system rhetoric", severity: 3 },
          { regex: /\b(wake\s+up|red\s+pill|truth\s+bomb)/gi, description: "Conspiracy awakening", severity: 3 },
          { regex: /\b(we\s+must|you\s+should)\s+(fight|resist|rebel)/gi, description: "Resistance encouragement", severity: 4 }
        ]
      },

      // Financial scam patterns
      financial_scam: {
        patterns: [
          { regex: /\b(invest|investment|crypto|bitcoin)\s+(now|today|opportunity)/gi, description: "Investment scams", severity: 4 },
          { regex: /\b(guaranteed|risk-free|double\s+your\s+money)/gi, description: "Guaranteed returns", severity: 4 },
          { regex: /\b(send\s+money|wire\s+transfer|paypal)\s+(to|for)/gi, description: "Money transfer requests", severity: 5 },
          { regex: /\b(lottery|prize|winner|won)\s+\$\d+/gi, description: "Fake winnings", severity: 4 }
        ]
      },

      // Catfishing patterns
      catfishing: {
        patterns: [
          { regex: /\b(i\s+love\s+you|i\s+miss\s+you)\b.*\b(send\s+money|help\s+me)/gi, description: "Love bombing + money request", severity: 5 },
          { regex: /\b(stuck|trapped|emergency)\s+(in|at)\s+(airport|hospital|abroad)/gi, description: "Emergency abroad", severity: 5 },
          { regex: /\b(rich|wealthy|millionaire)\s+(but|and)\s+(need|want)\s+(help|assistant)/gi, description: "Rich person needing help", severity: 4 },
          { regex: /\b(secret|confidential|private)\s+(account|fortune|inheritance)/gi, description: "Secret wealth", severity: 4 }
        ]
      },

      // Trolling patterns
      trolling: {
        patterns: [
          { regex: /\b(just\s+kidding|jk|lol)\b.*\b(you'?re\s+(stupid|ugly|fat))/gi, description: "JK insults", severity: 3 },
          { regex: /\b(trigger|triggered|troll)\s+(you|him|her)/gi, description: "Trolling admission", severity: 2 },
          { regex: /\b(autist|retard|special)\b/gi, description: "Disability mockery", severity: 4 },
          { regex: /\b(virgin|incel|neckbeard)\b/gi, description: "Involuntary celibate insults", severity: 3 }
        ]
      },

      // Revenge porn patterns
      revenge_porn: {
        patterns: [
          { regex: /\b(i\s+will\s+)?post\s+(your|the)\s+(nude|sex|porn)/gi, description: "Image posting threats", severity: 6 },
          { regex: /\b(send\s+more|more\s+pics)\s+(or\s+else|or\s+i\s+will)/gi, description: "Continued extortion", severity: 6 },
          { regex: /\b(everyone|school|work)\s+(will\s+see|sees)/gi, description: "Public exposure threats", severity: 6 },
          { regex: /\b(delete|remove)\s+(the\s+)?pic\s+(now|immediately)/gi, description: "Urgent deletion demands", severity: 5 }
        ]
      },

      // Workplace harassment patterns
      workplace_harassment: {
        patterns: [
          { regex: /\b(you'?re\s+fired|quit\s+your\s+job)/gi, description: "Job threats", severity: 5 },
          { regex: /\b(i\s+will\s+)?tell\s+(your\s+boss|hr|manager)/gi, description: "Reporting threats", severity: 4 },
          { regex: /\b(sexual\s+harassment|hostile\s+work\s+environment)/gi, description: "Workplace accusations", severity: 3 },
          { regex: /\b(performance|competence|ability)\s+(is\s+)?lacking/gi, description: "Professional discredit", severity: 3 }
        ]
      },

      // Academic harassment patterns
      academic_harassment: {
        patterns: [
          { regex: /\b(you'?re\s+(dumb|stupid|idiot))\s+(in\s+school|at\s+college)/gi, description: "Academic insults", severity: 4 },
          { regex: /\b(i\s+will\s+)?tell\s+(your\s+teacher|professor|principal)/gi, description: "Authority reporting", severity: 4 },
          { regex: /\b(cheater|liar|thief)\s+(in\s+class|at\s+school)/gi, description: "Academic dishonesty accusations", severity: 3 },
          { regex: /\b(you\s+will\s+)?fail\s+(the\s+class|school|exam)/gi, description: "Failure predictions", severity: 3 }
        ]
      },

      // Contextual patterns
      context: {
        patterns: [
          { regex: /\b(please|sorry|thank\s+you)\b/gi, description: "Polite language", severity: -1 },
          { regex: /\b(help|support|assist)\b/gi, description: "Help requests", severity: -1 },
          { regex: /\b(love|care|support)\b/gi, description: "Positive emotions", severity: -1 }
        ]
      }
    };
  }

  analyzeMessagePatterns(text, context = {}) {
    this.stats.total_analyzed++;

    try {
      if (!text || typeof text !== 'string') {
        return new PatternAnalysis([], 0, context);
      }

      const detectedPatterns = [];
      let totalRisk = 0;
      let patternCount = 0;

      // Analyze each pattern category
      for (const [category, config] of Object.entries(this.patterns)) {
        const categoryPatterns = this._analyzeCategory(text, category, config, context);
        detectedPatterns.push(...categoryPatterns);

        // Calculate risk contribution
        for (const pattern of categoryPatterns) {
          totalRisk += pattern.severity * pattern.confidence;
          patternCount++;
        }
      }

      // Contextual adjustments
      const adjustedRisk = this._adjustForContext(totalRisk, detectedPatterns, context);

      // Normalize risk score (0-100)
      const normalizedRisk = Math.max(0, Math.min(100, adjustedRisk));

      this.stats.patterns_detected += detectedPatterns.length;

      // Update risk assessment stats
      const riskLevel = this._getRiskLevel(normalizedRisk);
      if (!this.stats.risk_assessments[riskLevel]) {
        this.stats.risk_assessments[riskLevel] = 0;
      }
      this.stats.risk_assessments[riskLevel]++;

      return new PatternAnalysis(detectedPatterns, normalizedRisk, context);

    } catch (error) {
      console.error('Error in pattern analysis:', error);
      this.stats.error_count++;
      return new PatternAnalysis([], 0, context);
    }
  }

  _analyzeCategory(text, category, config, context) {
    const patterns = [];

    for (const patternConfig of config.patterns) {
      const matches = text.match(patternConfig.regex);

      if (matches) {
        // Calculate confidence based on match frequency and context
        const confidence = this._calculateConfidence(matches, text, patternConfig, context);

        if (confidence > 0) {
          patterns.push(new MessagePattern(
            category,
            confidence,
            patternConfig.description,
            patternConfig.severity,
            {
              match_count: matches.length,
              matches: matches.slice(0, 5), // Store first 5 matches
              regex: patternConfig.regex.source
            }
          ));
        }
      }
    }

    return patterns;
  }

  _calculateConfidence(matches, text, patternConfig, context) {
    if (!matches || matches.length === 0) return 0;

    let confidence = 0.5; // Base confidence

    // Frequency factor
    const frequency = matches.length / (text.length / 100); // Matches per 100 characters
    confidence += Math.min(0.3, frequency * 0.1);

    // Length factor - longer matches are more significant
    const avgMatchLength = matches.join('').length / matches.length;
    confidence += Math.min(0.2, avgMatchLength / 50);

    // Context adjustments
    if (context.platform) {
      const platform = context.platform.toLowerCase();
      if (platform === 'gaming' || platform === 'twitch') {
        // More tolerant of caps and repetition in gaming
        if (patternConfig.description.includes('caps') || patternConfig.description.includes('repetition')) {
          confidence *= 0.7;
        }
      } else if (platform === 'professional' || platform === 'linkedin') {
        // Stricter standards for professional platforms
        confidence *= 1.2;
      }
    }

    // Time context
    if (context.timestamp) {
      const hour = new Date(context.timestamp).getHours();
      // Messages at odd hours might be more suspicious
      if (hour < 6 || hour > 22) {
        confidence *= 1.1;
      }
    }

    return Math.min(1.0, confidence);
  }

  _adjustForContext(baseRisk, patterns, context) {
    let adjustedRisk = baseRisk;

    // Positive context reduces risk
    const positivePatterns = patterns.filter(p => p.severity < 0);
    if (positivePatterns.length > 0) {
      const positiveReduction = positivePatterns.reduce((sum, p) => sum + Math.abs(p.severity * p.confidence), 0);
      adjustedRisk = Math.max(0, adjustedRisk - positiveReduction);
    }

    // Platform adjustments
    if (context.platform) {
      const platform = context.platform.toLowerCase();
      const adjustments = {
        'gaming': -10,
        'twitch': -8,
        'discord': -5,
        'twitter': 5,
        'facebook': 0,
        'linkedin': 15,
        'professional': 20
      };

      if (adjustments[platform] !== undefined) {
        adjustedRisk += adjustments[platform];
      }
    }

    // User history adjustments
    if (context.userHistory) {
      const history = context.userHistory;
      if (history.previousViolations > 0) {
        adjustedRisk += history.previousViolations * 5;
      }
      if (history.isNewUser) {
        adjustedRisk += 10; // New users get higher scrutiny
      }
    }

    // Message length adjustments
    if (context.messageLength) {
      const length = context.messageLength;
      if (length < 10) {
        adjustedRisk += 5; // Very short messages can be more aggressive
      } else if (length > 500) {
        adjustedRisk -= 5; // Very long messages are less likely to be harassment
      }
    }

    return Math.max(0, adjustedRisk);
  }

  _getRiskLevel(riskScore) {
    if (riskScore >= 80) return 'CRITICAL';
    if (riskScore >= 60) return 'HIGH';
    if (riskScore >= 30) return 'MEDIUM';
    if (riskScore >= 10) return 'LOW';
    return 'MINIMAL';
  }

  // Advanced pattern analysis
  analyzeAdvancedPatterns(text, context = {}) {
    const advancedPatterns = {
      // Emotional manipulation
      emotional_manipulation: [
        { regex: /\b(please|begging|desperate)\b.*\b(help|money|support)/gi, severity: 3 },
        { regex: /\b(alone|lonely|depressed)\b.*\b(talk|speak)/gi, severity: 2 }
      ],

      // Impersonation attempts
      impersonation: [
        { regex: /\bi\s+am\s+(god|admin|moderator|police)/gi, severity: 5 },
        { regex: /\b(official|verified|trusted)\s+(account|user)/gi, severity: 4 }
      ],

      // Coordinated attacks
      coordinated: [
        { regex: /(everyone|all)\s+(attack|report|spam)/gi, severity: 5 },
        { regex: /\b(join|follow)\s+(me|us)\s+(to|for)\s+(revenge|justice)/gi, severity: 4 }
      ],

      // Doxxing attempts
      doxxing: [
        { regex: /\b(address|phone|email|location)\s+(is|was)/gi, severity: 6 },
        { regex: /\b(real\s+name|full\s+name)\s+(is|was)/gi, severity: 5 }
      ]
    };

    const advancedResults = [];

    for (const [category, patterns] of Object.entries(advancedPatterns)) {
      for (const pattern of patterns) {
        const matches = text.match(pattern.regex);
        if (matches) {
          advancedResults.push(new MessagePattern(
            `advanced_${category}`,
            0.8,
            `Advanced pattern: ${category}`,
            pattern.severity,
            { matches: matches.slice(0, 3) }
          ));
        }
      }
    }

    return advancedResults;
  }

  // Batch analysis for multiple messages
  batchAnalyzePatterns(texts, context = {}) {
    const results = [];

    for (const text of texts) {
      const analysis = this.analyzeMessagePatterns(text, { ...context, messageLength: text.length });
      results.push({
        text: text,
        analysis: analysis,
        risk_level: this._getRiskLevel(analysis.overall_risk)
      });
    }

    return results;
  }

  getStats() {
    return {
      total_analyzed: this.stats.total_analyzed,
      patterns_detected: this.stats.patterns_detected,
      risk_assessments: this.stats.risk_assessments,
      error_count: this.stats.error_count,
      average_patterns_per_message: this.stats.total_analyzed > 0 ?
        Math.round((this.stats.patterns_detected / this.stats.total_analyzed) * 100) / 100 : 0
    };
  }

  resetStats() {
    this.stats = {
      total_analyzed: 0,
      patterns_detected: 0,
      risk_assessments: {},
      error_count: 0
    };
  }

  // Add custom pattern
  addCustomPattern(category, regex, description, severity) {
    try {
      const compiledRegex = new RegExp(regex, 'gi');

      if (!this.patterns[category]) {
        this.patterns[category] = { patterns: [] };
      }

      this.patterns[category].patterns.push({
        regex: compiledRegex,
        description: description,
        severity: severity
      });

      console.log(`Added custom pattern to ${category}: ${description}`);
      return true;
    } catch (error) {
      console.error(`Invalid regex pattern: ${error.message}`);
      return false;
    }
  }
}

module.exports = { PatternAnalyzer, MessagePattern, PatternAnalysis };
