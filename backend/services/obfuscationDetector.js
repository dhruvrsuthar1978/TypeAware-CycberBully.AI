/**
 * ObfuscationDetector - JavaScript port of Python obfuscation detector
 * Detects attempts to hide abusive language through various obfuscation techniques
 */

class ObfuscationMatch {
  constructor(word, obfuscatedForm, confidence, technique, position) {
    this.word = word;
    this.obfuscated_form = obfuscatedForm;
    this.confidence = confidence;
    this.technique = technique;
    this.position = position;
  }
}

class ObfuscationDetector {
  constructor() {
    this.obfuscationTechniques = this._initializeTechniques();

    this.stats = {
      total_scanned: 0,
      obfuscations_detected: 0,
      techniques_used: {},
      error_count: 0
    };

    console.log('ObfuscationDetector initialized');
  }

  _initializeTechniques() {
    return {
      // Character substitution (leet speak)
      leet_speak: {
        patterns: [
          { original: 'a', obfuscated: ['4', '@', '/\\', '/-\\'] },
          { original: 'e', obfuscated: ['3', '€', '£'] },
          { original: 'i', obfuscated: ['1', '!', '|'] },
          { original: 'o', obfuscated: ['0', '()', '[]'] },
          { original: 's', obfuscated: ['5', '$', 'z'] },
          { original: 't', obfuscated: ['7', '+'] },
          { original: 'g', obfuscated: ['9', '6'] },
          { original: 'b', obfuscated: ['8', '|3'] },
          { original: 'l', obfuscated: ['1', '|'] }
        ]
      },

      // Character repetition
      repetition: {
        patterns: [
          { original: 'a', obfuscated: ['aa', 'aaa', 'aaaa'] },
          { original: 'e', obfuscated: ['ee', 'eee', 'eeee'] },
          { original: 'i', obfuscated: ['ii', 'iii', 'iiii'] },
          { original: 'o', obfuscated: ['oo', 'ooo', 'oooo'] },
          { original: 'u', obfuscated: ['uu', 'uuu', 'uuuu'] }
        ]
      },

      // Spacing and punctuation
      spacing: {
        patterns: [
          { original: 'ass', obfuscated: ['a s s', 'a-s-s', 'a_s_s'] },
          { original: 'fuck', obfuscated: ['f u c k', 'f-u-c-k', 'f_u_c_k'] },
          { original: 'shit', obfuscated: ['s h i t', 's-h-i-t', 's_h_i_t'] },
          { original: 'bitch', obfuscated: ['b i t c h', 'b-i-t-c-h', 'b_i_t_c_h'] }
        ]
      },

      // Homoglyphs (similar-looking characters)
      homoglyphs: {
        patterns: [
          { original: 'a', obfuscated: ['а', 'ɑ', 'α'] }, // Cyrillic, Latin extended
          { original: 'e', obfuscated: ['е', 'ɛ'] },
          { original: 'i', obfuscated: ['і', 'ɩ'] },
          { original: 'o', obfuscated: ['о', 'ο'] },
          { original: 'u', obfuscated: ['υ'] },
          { original: 's', obfuscated: ['ѕ'] },
          { original: 'c', obfuscated: ['с'] },
          { original: 'p', obfuscated: ['р'] },
          { original: 'h', obfuscated: ['һ'] }
        ]
      },

      // Case variations
      case_variation: {
        patterns: [
          { original: 'asshole', obfuscated: ['AssHole', 'aSsHoLe', 'ASSHOLE'] },
          { original: 'fuck', obfuscated: ['FuCk', 'fUcK', 'FUCK'] },
          { original: 'shit', obfuscated: ['ShIt', 'sHiT', 'SHIT'] }
        ]
      },

      // Word fragmentation
      fragmentation: {
        patterns: [
          { original: 'motherfucker', obfuscated: ['mother fucker', 'mother-fucker'] },
          { original: 'asshole', obfuscated: ['ass hole', 'ass-hole'] },
          { original: 'bastard', obfuscated: ['bas tard', 'bas-tard'] }
        ]
      }
    };
  }

  detectObfuscatedWords(text, targetWords = []) {
    this.stats.total_scanned++;

    try {
      if (!text || !targetWords.length) {
        return [];
      }

      const matches = [];
      const lowerText = text.toLowerCase();

      for (const targetWord of targetWords) {
        const wordMatches = this._detectWordObfuscations(lowerText, targetWord, text);
        matches.push(...wordMatches);
      }

      this.stats.obfuscations_detected += matches.length;

      // Update technique statistics
      for (const match of matches) {
        if (!this.stats.techniques_used[match.technique]) {
          this.stats.techniques_used[match.technique] = 0;
        }
        this.stats.techniques_used[match.technique]++;
      }

      return matches;

    } catch (error) {
      console.error('Error in obfuscation detection:', error);
      this.stats.error_count++;
      return [];
    }
  }

  _detectWordObfuscations(text, targetWord, originalText) {
    const matches = [];
    const targetLower = targetWord.toLowerCase();

    // Try each obfuscation technique
    for (const [technique, config] of Object.entries(this.obfuscationTechniques)) {
      const techniqueMatches = this._applyTechnique(text, originalText, targetLower, technique, config);
      matches.push(...techniqueMatches);
    }

    // Remove duplicates based on position and keep highest confidence
    const uniqueMatches = this._deduplicateMatches(matches);

    return uniqueMatches;
  }

  _applyTechnique(text, originalText, targetWord, technique, config) {
    const matches = [];

    for (const pattern of config.patterns) {
      const obfuscatedForms = this._generateObfuscatedForms(targetWord, pattern, technique);

      for (const obfuscatedForm of obfuscatedForms) {
        const regex = new RegExp(this._escapeRegex(obfuscatedForm), 'gi');
        const textMatches = [...originalText.matchAll(regex)];

        for (const match of textMatches) {
          const confidence = this._calculateConfidence(targetWord, obfuscatedForm, technique);
          matches.push(new ObfuscationMatch(
            targetWord,
            match[0],
            confidence,
            technique,
            match.index
          ));
        }
      }
    }

    return matches;
  }

  _generateObfuscatedForms(targetWord, pattern, technique) {
    const forms = [];

    switch (technique) {
      case 'leet_speak':
        forms.push(this._applyLeetSpeak(targetWord, pattern));
        break;

      case 'repetition':
        forms.push(this._applyRepetition(targetWord, pattern));
        break;

      case 'spacing':
        forms.push(this._applySpacing(targetWord, pattern));
        break;

      case 'homoglyphs':
        forms.push(this._applyHomoglyphs(targetWord, pattern));
        break;

      case 'case_variation':
        forms.push(this._applyCaseVariation(targetWord, pattern));
        break;

      case 'fragmentation':
        forms.push(this._applyFragmentation(targetWord, pattern));
        break;
    }

    return forms.filter(form => form !== null && form !== targetWord); // Exclude null values and exact matches
  }

  _applyLeetSpeak(word, pattern) {
    let result = word;
    for (const obfuscated of pattern.obfuscated) {
      result = result.replace(new RegExp(pattern.original, 'g'), obfuscated);
    }
    return result;
  }

  _applyRepetition(word, pattern) {
    let result = word;
    for (const obfuscated of pattern.obfuscated) {
      result = result.replace(new RegExp(pattern.original, 'g'), obfuscated);
    }
    return result;
  }

  _applySpacing(word, pattern) {
    return pattern.obfuscated.includes(word) ? word : null;
  }

  _applyHomoglyphs(word, pattern) {
    let result = word;
    for (const obfuscated of pattern.obfuscated) {
      result = result.replace(new RegExp(pattern.original, 'g'), obfuscated);
    }
    return result;
  }

  _applyCaseVariation(word, pattern) {
    return pattern.obfuscated.includes(word) ? word : null;
  }

  _applyFragmentation(word, pattern) {
    return pattern.obfuscated.includes(word) ? word : null;
  }

  _calculateConfidence(targetWord, obfuscatedForm, technique) {
    // Base confidence by technique
    const techniqueWeights = {
      leet_speak: 0.8,
      repetition: 0.6,
      spacing: 0.9,
      homoglyphs: 0.7,
      case_variation: 0.5,
      fragmentation: 0.8
    };

    let confidence = techniqueWeights[technique] || 0.5;

    // Adjust based on similarity
    const similarity = this._calculateStringSimilarity(targetWord, obfuscatedForm);
    confidence *= similarity;

    // Length penalty for very short words
    if (targetWord.length < 3) {
      confidence *= 0.7;
    }

    return Math.min(1.0, confidence);
  }

  _calculateStringSimilarity(str1, str2) {
    // Simple character overlap ratio
    const set1 = new Set(str1.toLowerCase());
    const set2 = new Set(str2.toLowerCase());
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
  }

  _escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  _deduplicateMatches(matches) {
    const positionMap = new Map();

    for (const match of matches) {
      const key = `${match.position}_${match.word}`;
      if (!positionMap.has(key) || positionMap.get(key).confidence < match.confidence) {
        positionMap.set(key, match);
      }
    }

    return Array.from(positionMap.values());
  }

  getStats() {
    return {
      total_scanned: this.stats.total_scanned,
      obfuscations_detected: this.stats.obfuscations_detected,
      techniques_used: this.stats.techniques_used,
      error_count: this.stats.error_count,
      detection_rate: this.stats.total_scanned > 0 ?
        Math.round((this.stats.obfuscations_detected / this.stats.total_scanned) * 100) / 100 : 0
    };
  }

  resetStats() {
    this.stats = {
      total_scanned: 0,
      obfuscations_detected: 0,
      techniques_used: {},
      error_count: 0
    };
  }

  // Advanced obfuscation detection for common patterns
  detectAdvancedObfuscation(text) {
    const advancedPatterns = [
      // Zero-width characters
      /\u200B|\u200C|\u200D|\uFEFF/g,

      // Unicode variations
      /[\u0300-\u036F]/g, // Combining diacritical marks

      // Invisible characters
      /[\u200E\u200F\u202A-\u202E]/g, // Right-to-left marks

      // Mathematical symbols
      /[∑∏∆∇∫]/g
    ];

    const matches = [];
    for (const pattern of advancedPatterns) {
      const found = text.match(pattern);
      if (found) {
        matches.push({
          type: 'advanced_obfuscation',
          matches: found,
          confidence: 0.9
        });
      }
    }

    return matches;
  }
}

module.exports = { ObfuscationDetector, ObfuscationMatch };
