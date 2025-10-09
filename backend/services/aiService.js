/**
 * AIService - Integrated AI service combining all detection engines
 * Provides comprehensive content moderation and analysis
 */

const { ContentDetectionEngine } = require('./contentDetectionEngine');
const { ObfuscationDetector } = require('./obfuscationDetector');
const { FuzzyMatcher } = require('./fuzzyMatcher_enhanced');
const { PatternAnalyzer } = require('./patternAnalyzer_enhanced');
const { RephrasingEngine } = require('./rephrasingEngine');

class AIService {
  constructor() {
    this.contentEngine = new ContentDetectionEngine();
    this.obfuscationDetector = new ObfuscationDetector();
    this.fuzzyMatcher = new FuzzyMatcher();
    this.patternAnalyzer = new PatternAnalyzer();
    this.rephrasingEngine = new RephrasingEngine();

    this.stats = {
      total_requests: 0,
      processing_times: [],
      error_count: 0,
      cache_hits: 0,
      cache_misses: 0
    };

    console.log('AIService initialized with all detection engines');
  }

  /**
   * Comprehensive content analysis
   * @param {string} text - Text to analyze
   * @param {Object} context - Context information (platform, user history, etc.)
   * @returns {Object} Analysis results
   */
  async analyzeContent(text, context = {}) {
    const startTime = Date.now();
    this.stats.total_requests++;

    try {
      if (!text || typeof text !== 'string') {
        return this._createEmptyAnalysis();
      }

      // Step 1: Basic content detection
      const contentResult = this.contentEngine.detectAbusiveContent(text, context);

      // Step 2: Obfuscation detection
      const abusiveWords = this._extractAbusiveWords(contentResult);
      const obfuscationMatches = this.obfuscationDetector.detectObfuscatedWords(text, abusiveWords);

      // Step 3: Pattern analysis
      const patternAnalysis = this.patternAnalyzer.analyzeMessagePatterns(text, context);

      // Step 4: Fuzzy matching for additional detection
      const fuzzyMatches = this.fuzzyMatcher.findContextAwareMatches(text, abusiveWords, context);

      // Step 5: Generate rephrasing suggestions if content is problematic
      let rephrasingSuggestions = null;
      if (contentResult.is_abusive || patternAnalysis.overall_risk > 30) {
        rephrasingSuggestions = this.rephrasingEngine.generateSuggestions(text, context);
      }

      // Combine results
      const combinedResult = this._combineAnalysisResults(
        contentResult,
        obfuscationMatches,
        patternAnalysis,
        fuzzyMatches,
        rephrasingSuggestions,
        startTime
      );

      this.stats.processing_times.push(Date.now() - startTime);

      return combinedResult;

    } catch (error) {
      console.error('Error in AI content analysis:', error);
      this.stats.error_count++;
      return this._createErrorAnalysis(text, error.message);
    }
  }

  /**
   * Real-time content analysis for streaming/live content
   * @param {string} text - Text to analyze
   * @param {Object} context - Context information
   * @returns {Object} Simplified analysis for real-time use
   */
  async analyzeRealtime(text, context = {}) {
    const startTime = Date.now();

    try {
      // Quick content detection only for real-time performance
      const contentResult = this.contentEngine.detectAbusiveContent(text, context);

      // Basic pattern check
      const patternAnalysis = this.patternAnalyzer.analyzeMessagePatterns(text, context);

      const isAbusive = contentResult.is_abusive || patternAnalysis.overall_risk > 50;
      const riskScore = Math.max(contentResult.risk_score, patternAnalysis.overall_risk / 10);

      return {
        is_abusive: isAbusive,
        risk_score: riskScore,
        risk_level: this._calculateRiskLevel(riskScore),
        categories: [...new Set([...contentResult.categories, ...patternAnalysis.patterns.map(p => p.pattern_type)])],
        processing_time: Date.now() - startTime,
        suggestions: isAbusive ? this._getQuickSuggestions(contentResult, patternAnalysis) : []
      };

    } catch (error) {
      console.error('Error in real-time analysis:', error);
      return {
        is_abusive: false,
        risk_score: 0,
        risk_level: 'UNKNOWN',
        categories: [],
        processing_time: Date.now() - startTime,
        error: error.message
      };
    }
  }

  /**
   * Batch analysis for multiple texts
   * @param {string[]} texts - Array of texts to analyze
   * @param {Object[]} contexts - Array of context objects
   * @returns {Object[]} Array of analysis results
   */
  async batchAnalyze(texts, contexts = []) {
    if (!Array.isArray(texts)) {
      throw new Error('Texts must be an array');
    }

    const results = [];
    const batchSize = 10; // Process in batches to avoid memory issues

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchContexts = contexts.slice(i, i + batchSize);

      const batchPromises = batch.map((text, index) =>
        this.analyzeContent(text, batchContexts[index] || {})
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Get rephrasing suggestions for a message
   * @param {string} text - Text to generate suggestions for
   * @param {Object} context - Context information
   * @returns {Object} Rephrasing suggestions
   */
  async getRephrasingSuggestions(text, context = {}) {
    try {
      const result = this.rephrasingEngine.generateSuggestions(text, context);
      return {
        original_message: result.original_message,
        message_type: result.message_type,
        suggestions: result.suggestions.map(s => ({
          suggested_text: s.suggested_text,
          strategy: s.strategy_used,
          explanation: s.explanation,
          tone_improvement: s.tone_improvement,
          appropriateness_score: s.appropriateness_score
        })),
        educational_note: result.educational_note,
        confidence: result.confidence
      };
    } catch (error) {
      console.error('Error generating rephrasing suggestions:', error);
      return {
        original_message: text,
        suggestions: [],
        educational_note: "Unable to generate suggestions at this time.",
        confidence: 0,
        error: error.message
      };
    }
  }

  /**
   * Get comprehensive statistics
   * @returns {Object} Service statistics
   */
  getStats() {
    const avgProcessingTime = this.stats.processing_times.length > 0 ?
      this.stats.processing_times.reduce((sum, time) => sum + time, 0) / this.stats.processing_times.length : 0;

    return {
      total_requests: this.stats.total_requests,
      average_processing_time: Math.round(avgProcessingTime),
      error_count: this.stats.error_count,
      error_rate: this.stats.total_requests > 0 ?
        Math.round((this.stats.error_count / this.stats.total_requests) * 100) / 100 : 0,
      cache_hit_rate: this.stats.total_requests > 0 ?
        Math.round((this.stats.cache_hits / this.stats.total_requests) * 100) / 100 : 0,
      engine_stats: {
        content_engine: this.contentEngine.getStats(),
        obfuscation_detector: this.obfuscationDetector.getStats(),
        fuzzy_matcher: this.fuzzyMatcher.getStats(),
        pattern_analyzer: this.patternAnalyzer.getStats(),
        rephrasing_engine: this.rephrasingEngine.getStats()
      }
    };
  }

  /**
   * Reset all statistics
   */
  resetStats() {
    this.stats = {
      total_requests: 0,
      processing_times: [],
      error_count: 0,
      cache_hits: 0,
      cache_misses: 0
    };

    this.contentEngine.resetStats();
    this.obfuscationDetector.resetStats();
    this.fuzzyMatcher.resetStats();
    this.patternAnalyzer.resetStats();
    this.rephrasingEngine.resetStats();
  }

  /**
   * Add custom patterns to detection engines
   * @param {string} category - Category to add pattern to
   * @param {string} pattern - Regex pattern
   * @param {string} description - Pattern description
   * @param {number} severity - Pattern severity (1-6)
   */
  addCustomPattern(category, pattern, description, severity) {
    // Add to content detection engine
    this.contentEngine.abusivePatterns[category] = this.contentEngine.abusivePatterns[category] || {
      words: [],
      patterns: [],
      severity: severity
    };

    if (this.contentEngine.addCustomPattern) {
      this.contentEngine.addCustomPattern(category, pattern, severity);
    }

    // Add to pattern analyzer
    if (this.patternAnalyzer.addCustomPattern) {
      this.patternAnalyzer.addCustomPattern(category, pattern, description, severity);
    }

    console.log(`Added custom pattern to category: ${category}`);
  }

  // Private helper methods

  _extractAbusiveWords(contentResult) {
    const abusiveWords = new Set();

    // Extract from detections
    if (contentResult.detections) {
      contentResult.detections.forEach(detection => {
        if (detection.match) {
          // Split and clean words
          const words = detection.match.toLowerCase().split(/\s+/);
          words.forEach(word => {
            if (word.length > 2) {
              abusiveWords.add(word.replace(/[^\w]/g, ''));
            }
          });
        }
      });
    }

    // Add common abusive words
    const commonAbusive = [
      'stupid', 'dumb', 'idiot', 'moron', 'loser', 'pathetic', 'worthless',
      'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'cunt', 'dick', 'pussy'
    ];

    commonAbusive.forEach(word => abusiveWords.add(word));

    return Array.from(abusiveWords);
  }

  _combineAnalysisResults(contentResult, obfuscationMatches, patternAnalysis, fuzzyMatches, rephrasingSuggestions, startTime) {
    // Combine risk scores
    const contentRisk = contentResult.risk_score || 0;
    const patternRisk = (patternAnalysis.overall_risk || 0) / 10; // Normalize to 0-100
    const obfuscationRisk = obfuscationMatches.length * 5; // Each obfuscation adds 5 points
    const fuzzyRisk = fuzzyMatches.length * 3; // Each fuzzy match adds 3 points

    const combinedRiskScore = Math.min(100, contentRisk + patternRisk + obfuscationRisk + fuzzyRisk);
    const isAbusive = combinedRiskScore > 20 || contentResult.is_abusive;

    // Combine categories
    const allCategories = new Set([
      ...(contentResult.categories || []),
      ...(patternAnalysis.patterns ? patternAnalysis.patterns.map(p => p.pattern_type) : [])
    ]);

    // Combine detections
    const allDetections = [
      ...(contentResult.detections || []),
      ...obfuscationMatches.map(match => ({
        detection_type: 'obfuscation',
        category: 'obfuscation',
        severity: 3,
        match: match.obfuscated_form,
        position: match.position,
        confidence: match.confidence,
        method: 'obfuscation_detection',
        actual_word: match.word
      })),
      ...fuzzyMatches.map(match => ({
        detection_type: 'fuzzy_match',
        category: 'content',
        severity: 2,
        match: match.text,
        position: match.start_index,
        confidence: match.similarity,
        method: 'fuzzy_matching'
      }))
    ];

    // Combine suggestions
    const allSuggestions = [
      ...(contentResult.suggestions || []),
      ...(patternAnalysis.context?.suggestions || [])
    ];

    if (rephrasingSuggestions && rephrasingSuggestions.suggestions) {
      allSuggestions.push(...rephrasingSuggestions.suggestions.map(s => s.suggested_text));
    }

    return {
      is_abusive: isAbusive,
      risk_score: Math.round(combinedRiskScore * 100) / 100,
      risk_level: this._calculateRiskLevel(combinedRiskScore),
      detections: allDetections,
      suggestions: [...new Set(allSuggestions)], // Remove duplicates
      categories: Array.from(allCategories),
      confidence: Math.max(contentResult.confidence || 0, patternAnalysis.confidence || 0),
      processing_time: Date.now() - startTime,
      analysis_breakdown: {
        content_analysis: {
          risk_score: contentResult.risk_score,
          categories: contentResult.categories,
          detection_count: contentResult.detections?.length || 0
        },
        pattern_analysis: {
          risk_score: patternAnalysis.overall_risk,
          patterns_detected: patternAnalysis.patterns?.length || 0
        },
        obfuscation_detection: {
          matches_found: obfuscationMatches.length
        },
        fuzzy_matching: {
          matches_found: fuzzyMatches.length
        }
      },
      rephrasing_available: !!(rephrasingSuggestions && rephrasingSuggestions.suggestions?.length > 0)
    };
  }

  _calculateRiskLevel(riskScore) {
    if (riskScore >= 80) return 'CRITICAL';
    if (riskScore >= 60) return 'HIGH';
    if (riskScore >= 30) return 'MEDIUM';
    if (riskScore >= 10) return 'LOW';
    return 'NONE';
  }

  _getQuickSuggestions(contentResult, patternAnalysis) {
    const suggestions = [];

    if (contentResult.suggestions) {
      suggestions.push(...contentResult.suggestions.slice(0, 2));
    }

    if (patternAnalysis.context?.suggestions) {
      suggestions.push(...patternAnalysis.context.suggestions.slice(0, 2));
    }

    return [...new Set(suggestions)].slice(0, 3);
  }

  _createEmptyAnalysis() {
    return {
      is_abusive: false,
      risk_score: 0,
      risk_level: 'NONE',
      detections: [],
      suggestions: [],
      categories: [],
      confidence: 1.0,
      processing_time: 0,
      analysis_breakdown: {
        content_analysis: { risk_score: 0, categories: [], detection_count: 0 },
        pattern_analysis: { risk_score: 0, patterns_detected: 0 },
        obfuscation_detection: { matches_found: 0 },
        fuzzy_matching: { matches_found: 0 }
      },
      rephrasing_available: false
    };
  }

  _createErrorAnalysis(text, errorMessage) {
    return {
      is_abusive: false,
      risk_score: 0,
      risk_level: 'UNKNOWN',
      detections: [],
      suggestions: [],
      categories: [],
      confidence: 0,
      processing_time: 0,
      error: errorMessage,
      analysis_breakdown: {
        content_analysis: { risk_score: 0, categories: [], detection_count: 0 },
        pattern_analysis: { risk_score: 0, patterns_detected: 0 },
        obfuscation_detection: { matches_found: 0 },
        fuzzy_matching: { matches_found: 0 }
      },
      rephrasing_available: false
    };
  }
}

module.exports = AIService;
