// services/contentModerationService.js
const { DETECTION_PATTERNS, FLAG_REASONS, SEVERITY_LEVELS } = require('../config/constants');

class ContentModerationService {
  constructor() {
    this.profanityPatterns = this.loadProfanityPatterns();
    this.harassmentPatterns = this.loadHarassmentPatterns();
    this.spamPatterns = this.loadSpamPatterns();
    this.threatPatterns = this.loadThreatPatterns();
    this.hatePatterns = this.loadHatePatterns();
  }

  // Main content analysis method
  async analyzeContent(content, context = {}) {
    if (!content || typeof content !== 'string') {
      return {
        isViolation: false,
        confidence: 0,
        detectedViolations: [],
        suggestions: []
      };
    }

    const normalizedContent = this.normalizeContent(content);
    const detectedViolations = [];

    // Run all detection algorithms
    const harassmentResult = this.detectHarassment(normalizedContent, context);
    const profanityResult = this.detectProfanity(normalizedContent);
    const spamResult = this.detectSpam(normalizedContent, context);
    const threatResult = this.detectThreats(normalizedContent);
    const hateResult = this.detectHateSpeech(normalizedContent);
    const toxicityResult = this.detectToxicity(normalizedContent);

    // Collect all violations
    if (harassmentResult.detected) detectedViolations.push(harassmentResult);
    if (profanityResult.detected) detectedViolations.push(profanityResult);
    if (spamResult.detected) detectedViolations.push(spamResult);
    if (threatResult.detected) detectedViolations.push(threatResult);
    if (hateResult.detected) detectedViolations.push(hateResult);
    if (toxicityResult.detected) detectedViolations.push(toxicityResult);

    // Calculate overall confidence and severity
    const overallConfidence = this.calculateOverallConfidence(detectedViolations);
    const severity = this.determineSeverity(detectedViolations);
    const suggestions = this.generateSuggestions(detectedViolations, normalizedContent);

    return {
      isViolation: detectedViolations.length > 0,
      confidence: overallConfidence,
      severity,
      detectedViolations,
      suggestions,
      metadata: {
        contentLength: content.length,
        wordCount: normalizedContent.split(/\s+/).length,
        analysisTimestamp: new Date().toISOString()
      }
    };
  }

  // Normalize content for analysis
  normalizeContent(content) {
    return content
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  // Detect harassment patterns
  detectHarassment(content, context) {
    const patterns = this.harassmentPatterns;
    const detectedPatterns = [];
    let maxConfidence = 0;

    for (const pattern of patterns) {
      const match = this.fuzzyMatch(content, pattern.pattern);
      if (match.score > 0.7) {
        detectedPatterns.push({
          pattern: pattern.pattern,
          confidence: match.score,
          severity: pattern.severity
        });
        maxConfidence = Math.max(maxConfidence, match.score);
      }
    }

    // Context-based detection (repeated targeting)
    if (context.previousInteractions && context.previousInteractions > 3) {
      maxConfidence = Math.min(1.0, maxConfidence + 0.2);
    }

    return {
      detected: detectedViolations.length > 0,
      type: FLAG_REASONS.HARASSMENT.code,
      confidence: maxConfidence,
      severity: this.getSeverityFromPatterns(detectedPatterns),
      patterns: detectedPatterns,
      reason: 'Content contains harassment patterns'
    };
  }

  // Detect profanity
  detectProfanity(content) {
    const patterns = this.profanityPatterns;
    const detectedWords = [];
    let maxSeverity = 'low';
    let totalConfidence = 0;

    for (const category of Object.keys(patterns)) {
      for (const word of patterns[category]) {
        const match = this.fuzzyMatch(content, word);
        if (match.score > 0.8) {
          detectedWords.push({
            word: word,
            confidence: match.score,
            severity: category
          });
          totalConfidence += match.score;
          if (this.compareSeverity(category, maxSeverity) > 0) {
            maxSeverity = category;
          }
        }
      }
    }

    const avgConfidence = detectedWords.length > 0 ? totalConfidence / detectedWords.length : 0;

    return {
      detected: detectedWords.length > 0,
      type: 'profanity',
      confidence: avgConfidence,
      severity: maxSeverity,
      detectedWords,
      reason: `Content contains ${detectedWords.length} profane word(s)`
    };
  }

  // Detect spam patterns
  detectSpam(content, context) {
    const patterns = this.spamPatterns;
    const indicators = [];
    let confidence = 0;

    // Pattern matching
    for (const pattern of patterns) {
      if (content.includes(pattern.toLowerCase())) {
        indicators.push(pattern);
        confidence += 0.3;
      }
    }

    // Repetition detection
    const words = content.split(/\s+/);
    const repetitionScore = this.calculateRepetitionScore(words);
    if (repetitionScore > 0.5) {
      indicators.push('excessive_repetition');
      confidence += repetitionScore;
    }

    // URL spam detection
    const urlCount = (content.match(/https?:\/\/[^\s]+/g) || []).length;
    if (urlCount > 2) {
      indicators.push('multiple_urls');
      confidence += Math.min(0.4, urlCount * 0.1);
    }

    // Context-based (frequency)
    if (context.recentSubmissions && context.recentSubmissions > 10) {
      confidence += 0.3;
      indicators.push('high_frequency');
    }

    confidence = Math.min(1.0, confidence);

    return {
      detected: indicators.length > 0 && confidence > 0.4,
      type: FLAG_REASONS.SPAM.code,
      confidence,
      severity: SEVERITY_LEVELS.LOW,
      indicators,
      reason: `Content shows spam characteristics: ${indicators.join(', ')}`
    };
  }

  // Detect threats
  detectThreats(content) {
    const patterns = this.threatPatterns;
    const detectedThreats = [];
    let maxConfidence = 0;

    for (const pattern of patterns) {
      const match = this.fuzzyMatch(content, pattern.pattern);
      if (match.score > 0.7) {
        detectedThreats.push({
          pattern: pattern.pattern,
          confidence: match.score,
          severity: pattern.severity
        });
        maxConfidence = Math.max(maxConfidence, match.score);
      }
    }

    return {
      detected: detectedThreats.length > 0,
      type: FLAG_REASONS.THREAT.code,
      confidence: maxConfidence,
      severity: SEVERITY_LEVELS.HIGH,
      threats: detectedThreats,
      reason: 'Content contains threatening language'
    };
  }

  // Detect hate speech
  detectHateSpeech(content) {
    const patterns = this.hatePatterns;
    const detectedHate = [];
    let maxConfidence = 0;

    for (const pattern of patterns) {
      const match = this.fuzzyMatch(content, pattern.pattern);
      if (match.score > 0.75) {
        detectedHate.push({
          pattern: pattern.pattern,
          confidence: match.score,
          category: pattern.category
        });
        maxConfidence = Math.max(maxConfidence, match.score);
      }
    }

    return {
      detected: detectedHate.length > 0,
      type: FLAG_REASONS.HATE_SPEECH.code,
      confidence: maxConfidence,
      severity: SEVERITY_LEVELS.HIGH,
      categories: detectedHate,
      reason: 'Content contains hate speech patterns'
    };
  }

  // Detect overall toxicity
  detectToxicity(content) {
    // Simple toxicity scoring based on multiple factors
    let toxicityScore = 0;
    const factors = [];

    // Aggressive language
    const aggressiveWords = ['stupid', 'idiot', 'moron', 'pathetic', 'loser', 'worthless'];
    const aggressiveCount = aggressiveWords.filter(word => content.includes(word)).length;
    if (aggressiveCount > 0) {
      toxicityScore += aggressiveCount * 0.2;
      factors.push(`aggressive_language (${aggressiveCount} instances)`);
    }

    // All caps (shouting)
    const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
    if (capsRatio > 0.3 && content.length > 20) {
      toxicityScore += 0.3;
      factors.push('excessive_caps');
    }

    // Excessive punctuation
    const punctuationRatio = (content.match(/[!?]{2,}/g) || []).length;
    if (punctuationRatio > 0) {
      toxicityScore += Math.min(0.2, punctuationRatio * 0.1);
      factors.push('excessive_punctuation');
    }

    toxicityScore = Math.min(1.0, toxicityScore);

    return {
      detected: toxicityScore > 0.4,
      type: 'toxicity',
      confidence: toxicityScore,
      severity: toxicityScore > 0.7 ? SEVERITY_LEVELS.HIGH : SEVERITY_LEVELS.MEDIUM,
      factors,
      reason: `Content toxicity score: ${(toxicityScore * 100).toFixed(1)}%`
    };
  }

  // Fuzzy string matching for pattern detection
  fuzzyMatch(text, pattern) {
    const words = text.split(/\s+/);
    const patternWords = pattern.split(/\s+/);
    
    let maxScore = 0;
    
    // Check for exact matches first
    if (text.includes(pattern)) {
      return { score: 1.0, type: 'exact' };
    }

    // Check for partial matches
    for (let i = 0; i <= words.length - patternWords.length; i++) {
      const segment = words.slice(i, i + patternWords.length).join(' ');
      const score = this.calculateSimilarity(segment, pattern);
      maxScore = Math.max(maxScore, score);
    }

    return { score: maxScore, type: maxScore > 0.8 ? 'fuzzy' : 'none' };
  }

  // Calculate string similarity (Levenshtein-based)
  calculateSimilarity(str1, str2) {
    const len1 = str1.length;
    const len2 = str2.length;

    if (len1 === 0) return len2 === 0 ? 1 : 0;
    if (len2 === 0) return 0;

    const matrix = Array(len2 + 1).fill().map(() => Array(len1 + 1).fill(0));

    for (let i = 0; i <= len1; i++) matrix[0][i] = i;
    for (let j = 0; j <= len2; j++) matrix[j][0] = j;

    for (let j = 1; j <= len2; j++) {
      for (let i = 1; i <= len1; i++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + cost
        );
      }
    }

    const maxLen = Math.max(len1, len2);
    return (maxLen - matrix[len2][len1]) / maxLen;
  }

  // Calculate repetition score for spam detection
  calculateRepetitionScore(words) {
    if (words.length < 4) return 0;

    const wordCount = {};
    for (const word of words) {
      wordCount[word] = (wordCount[word] || 0) + 1;
    }

    const repetitions = Object.values(wordCount).filter(count => count > 2);
    return Math.min(1.0, repetitions.length / words.length);
  }

  // Calculate overall confidence from multiple detections
  calculateOverallConfidence(violations) {
    if (violations.length === 0) return 0;

    const weights = {
      [FLAG_REASONS.THREAT.code]: 1.0,
      [FLAG_REASONS.HATE_SPEECH.code]: 0.9,
      [FLAG_REASONS.HARASSMENT.code]: 0.8,
      'profanity': 0.6,
      'toxicity': 0.5,
      [FLAG_REASONS.SPAM.code]: 0.3
    };

    let weightedSum = 0;
    let totalWeight = 0;

    for (const violation of violations) {
      const weight = weights[violation.type] || 0.5;
      weightedSum += violation.confidence * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? Math.min(1.0, weightedSum / totalWeight) : 0;
  }

  // Determine overall severity
  determineSeverity(violations) {
    if (violations.length === 0) return SEVERITY_LEVELS.LOW;

    const severityScores = {
      [SEVERITY_LEVELS.LOW]: 1,
      [SEVERITY_LEVELS.MEDIUM]: 2,
      [SEVERITY_LEVELS.HIGH]: 3,
      [SEVERITY_LEVELS.CRITICAL]: 4
    };

    let maxSeverity = SEVERITY_LEVELS.LOW;
    for (const violation of violations) {
      if (severityScores[violation.severity] > severityScores[maxSeverity]) {
        maxSeverity = violation.severity;
      }
    }

    return maxSeverity;
  }

  // Generate content improvement suggestions
  generateSuggestions(violations, content) {
    const suggestions = [];

    for (const violation of violations) {
      switch (violation.type) {
        case FLAG_REASONS.HARASSMENT.code:
          suggestions.push({
            type: 'rephrase',
            message: 'Consider rephrasing to be more respectful and constructive',
            severity: 'high'
          });
          break;

        case 'profanity':
          suggestions.push({
            type: 'language',
            message: 'Consider using more professional language',
            severity: 'medium'
          });
          break;

        case FLAG_REASONS.SPAM.code:
          suggestions.push({
            type: 'content',
            message: 'Avoid repetitive content and excessive links',
            severity: 'low'
          });
          break;

        case FLAG_REASONS.THREAT.code:
          suggestions.push({
            type: 'safety',
            message: 'This content may be perceived as threatening. Please reconsider',
            severity: 'critical'
          });
          break;

        case 'toxicity':
          suggestions.push({
            type: 'tone',
            message: 'Consider adopting a more positive and constructive tone',
            severity: 'medium'
          });
          break;
      }
    }

    return suggestions;
  }

  // Load detection patterns (in production, these would come from a database or ML model)
  loadProfanityPatterns() {
    return {
      high_severity: [
        // High severity profanity - replace with actual patterns in production
        'extreme_profanity_1',
        'extreme_profanity_2'
      ],
      medium_severity: [
        'moderate_profanity_1',
        'moderate_profanity_2'
      ],
      low_severity: [
        'mild_profanity_1',
        'mild_profanity_2'
      ]
    };
  }

  loadHarassmentPatterns() {
    return [
      { pattern: 'kill yourself', severity: SEVERITY_LEVELS.CRITICAL },
      { pattern: 'you should die', severity: SEVERITY_LEVELS.CRITICAL },
      { pattern: 'nobody likes you', severity: SEVERITY_LEVELS.HIGH },
      { pattern: 'worthless piece', severity: SEVERITY_LEVELS.HIGH },
      { pattern: 'go away forever', severity: SEVERITY_LEVELS.MEDIUM },
      { pattern: 'you are pathetic', severity: SEVERITY_LEVELS.MEDIUM }
    ];
  }

  loadSpamPatterns() {
    return [
      'click here now',
      'limited time offer',
      'make money fast',
      'lose weight quick',
      'free gift',
      'act now',
      'exclusive deal',
      'guaranteed results'
    ];
  }

  loadThreatPatterns() {
    return [
      { pattern: 'i will kill', severity: SEVERITY_LEVELS.CRITICAL },
      { pattern: 'going to hurt', severity: SEVERITY_LEVELS.HIGH },
      { pattern: 'watch your back', severity: SEVERITY_LEVELS.HIGH },
      { pattern: 'you will pay', severity: SEVERITY_LEVELS.MEDIUM },
      { pattern: 'i know where you live', severity: SEVERITY_LEVELS.CRITICAL }
    ];
  }

  loadHatePatterns() {
    return [
      { pattern: 'hate crime pattern 1', category: 'racial', severity: SEVERITY_LEVELS.CRITICAL },
      { pattern: 'hate crime pattern 2', category: 'religious', severity: SEVERITY_LEVELS.CRITICAL },
      // Add actual patterns in production with appropriate categories
    ];
  }

  // Utility methods
  getSeverityFromPatterns(patterns) {
    if (patterns.length === 0) return SEVERITY_LEVELS.LOW;
    
    const severities = patterns.map(p => p.severity);
    return severities.includes(SEVERITY_LEVELS.CRITICAL) ? SEVERITY_LEVELS.CRITICAL :
           severities.includes(SEVERITY_LEVELS.HIGH) ? SEVERITY_LEVELS.HIGH :
           severities.includes(SEVERITY_LEVELS.MEDIUM) ? SEVERITY_LEVELS.MEDIUM :
           SEVERITY_LEVELS.LOW;
  }

  compareSeverity(severity1, severity2) {
    const levels = {
      [SEVERITY_LEVELS.LOW]: 1,
      [SEVERITY_LEVELS.MEDIUM]: 2,
      [SEVERITY_LEVELS.HIGH]: 3,
      [SEVERITY_LEVELS.CRITICAL]: 4
    };
    
    return (levels[severity1] || 1) - (levels[severity2] || 1);
  }

  // Batch analysis for multiple pieces of content
  async analyzeBatch(contentArray, context = {}) {
    const results = [];
    
    for (const content of contentArray) {
      try {
        const analysis = await this.analyzeContent(content, context);
        results.push({
          content: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
          analysis
        });
      } catch (error) {
        results.push({
          content: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
          analysis: { error: error.message }
        });
      }
    }
    
    return results;
  }

  // Get service statistics
  getServiceStats() {
    return {
      patternsLoaded: {
        profanity: Object.keys(this.profanityPatterns).reduce((sum, key) => 
          sum + this.profanityPatterns[key].length, 0),
        harassment: this.harassmentPatterns.length,
        spam: this.spamPatterns.length,
        threats: this.threatPatterns.length,
        hate: this.hatePatterns.length
      },
      version: '1.0.0',
      lastUpdated: new Date().toISOString()
    };
  }

  // Update patterns (for admin use)
  updatePatterns(type, patterns) {
    try {
      switch (type) {
        case 'profanity':
          this.profanityPatterns = patterns;
          break;
        case 'harassment':
          this.harassmentPatterns = patterns;
          break;
        case 'spam':
          this.spamPatterns = patterns;
          break;
        case 'threats':
          this.threatPatterns = patterns;
          break;
        case 'hate':
          this.hatePatterns = patterns;
          break;
        default:
          throw new Error('Invalid pattern type');
      }
      
      return { success: true, message: `${type} patterns updated successfully` };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Test the moderation service with sample content
  async testModerationService() {
    const testCases = [
      {
        content: "This is a normal, friendly message.",
        expectedViolation: false
      },
      {
        content: "You are such an idiot and nobody likes you!",
        expectedViolation: true
      },
      {
        content: "CLICK HERE NOW!!! LIMITED TIME OFFER!!! MAKE MONEY FAST!!!",
        expectedViolation: true
      },
      {
        content: "I will find you and hurt you badly",
        expectedViolation: true
      }
    ];

    const results = [];
    for (const testCase of testCases) {
      const analysis = await this.analyzeContent(testCase.content);
      results.push({
        content: testCase.content,
        expected: testCase.expectedViolation,
        detected: analysis.isViolation,
        confidence: analysis.confidence,
        passed: testCase.expectedViolation === analysis.isViolation
      });
    }

    const passedTests = results.filter(r => r.passed).length;
    const accuracy = (passedTests / results.length) * 100;

    return {
      testResults: results,
      accuracy: `${accuracy.toFixed(1)}%`,
      passed: passedTests,
      total: results.length
    };
  }
}

module.exports = new ContentModerationService();