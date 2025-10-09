/**
 * Enhanced FuzzyMatcher - Advanced JavaScript fuzzy matching with multiple algorithms
 * Includes phonetic matching, Damerau-Levenshtein distance, and improved context awareness
 */

class FuzzyMatch {
  constructor(text, pattern, similarity, startIndex, endIndex, method) {
    this.text = text;
    this.pattern = pattern;
    this.similarity = similarity;
    this.start_index = startIndex;
    this.end_index = endIndex;
    this.method = method;
  }
}

class FuzzyMatcher {
  constructor(minSimilarity = 0.6) {
    this.minSimilarity = minSimilarity;

    this.stats = {
      total_searches: 0,
      matches_found: 0,
      average_similarity: 0.0,
      method_usage: {},
      error_count: 0
    };

    console.log(`Enhanced FuzzyMatcher initialized with min similarity: ${minSimilarity}`);
  }

  findFuzzyMatches(text, patterns, contextSize = 10) {
    this.stats.total_searches++;

    try {
      if (!text || !patterns || !patterns.length) {
        return [];
      }

      const matches = [];
      const lowerText = text.toLowerCase();

      for (const pattern of patterns) {
        const patternMatches = this._findPatternMatches(lowerText, pattern, text, contextSize);
        matches.push(...patternMatches);
      }

      // Sort by similarity (highest first) and position
      matches.sort((a, b) => {
        if (Math.abs(a.similarity - b.similarity) > 0.001) {
          return b.similarity - a.similarity;
        }
        return a.start_index - b.start_index;
      });

      // Remove overlapping matches (keep highest similarity)
      const nonOverlapping = this._removeOverlaps(matches);

      this.stats.matches_found += nonOverlapping.length;

      // Update method usage stats
      for (const match of nonOverlapping) {
        if (!this.stats.method_usage[match.method]) {
          this.stats.method_usage[match.method] = 0;
        }
        this.stats.method_usage[match.method]++;
      }

      // Update average similarity
      if (nonOverlapping.length > 0) {
        const totalSimilarity = nonOverlapping.reduce((sum, m) => sum + m.similarity, 0);
        const newAverage = (this.stats.average_similarity * (this.stats.matches_found - nonOverlapping.length) +
                           totalSimilarity) / this.stats.matches_found;
        this.stats.average_similarity = newAverage;
      }

      return nonOverlapping;

    } catch (error) {
      console.error('Error in fuzzy matching:', error);
      this.stats.error_count++;
      return [];
    }
  }

  _findPatternMatches(text, pattern, originalText, contextSize) {
    const matches = [];
    const lowerPattern = pattern.toLowerCase();

    // Method 1: Sliding window comparison
    const windowMatches = this._slidingWindowMatch(text, lowerPattern, originalText, contextSize);
    matches.push(...windowMatches);

    // Method 2: N-gram similarity (multiple n values)
    const ngramMatches = this._ngramMatch(text, lowerPattern, originalText, contextSize);
    matches.push(...ngramMatches);

    // Method 3: Edit distance based (Levenshtein + Damerau-Levenshtein)
    const editMatches = this._editDistanceMatch(text, lowerPattern, originalText, contextSize);
    matches.push(...editMatches);

    // Method 4: Phonetic matching (Soundex)
    const phoneticMatches = this._phoneticMatch(text, lowerPattern, originalText, contextSize);
    matches.push(...phoneticMatches);

    // Method 5: Fuzzy substring matching
    const substringMatches = this._fuzzySubstringMatch(text, lowerPattern, originalText, contextSize);
    matches.push(...substringMatches);

    return matches;
  }

  _slidingWindowMatch(text, pattern, originalText, contextSize) {
    const matches = [];
    const patternLen = pattern.length;
    const textLen = text.length;

    if (patternLen === 0 || textLen === 0) return matches;

    // Use sliding window of pattern length
    for (let i = 0; i <= textLen - patternLen; i++) {
      const window = text.substring(i, i + patternLen);
      const similarity = this._calculateSimilarity(window, pattern);

      if (similarity >= this.minSimilarity) {
        const startIdx = i;
        const endIdx = i + patternLen;

        matches.push(new FuzzyMatch(
          originalText.substring(Math.max(0, startIdx - contextSize),
                               Math.min(originalText.length, endIdx + contextSize)),
          pattern,
          similarity,
          startIdx,
          endIdx,
          'sliding_window'
        ));
      }
    }

    return matches;
  }

  _ngramMatch(text, pattern, originalText, contextSize) {
    const matches = [];
    const nValues = [2, 3]; // bigram and trigram similarity

    for (const n of nValues) {
      const textNgrams = this._generateNgrams(text, n);
      const patternNgrams = this._generateNgrams(pattern, n);

      if (textNgrams.length === 0 || patternNgrams.length === 0) continue;

      // Find positions where ngram similarity is high
      for (let i = 0; i <= text.length - pattern.length; i++) {
        const window = text.substring(i, i + pattern.length);
        const windowNgrams = this._generateNgrams(window, n);

        const similarity = this._ngramSimilarity(windowNgrams, patternNgrams);

        if (similarity >= this.minSimilarity) {
          const startIdx = i;
          const endIdx = i + pattern.length;

          matches.push(new FuzzyMatch(
            originalText.substring(Math.max(0, startIdx - contextSize),
                                 Math.min(originalText.length, endIdx + contextSize)),
            pattern,
            similarity,
            startIdx,
            endIdx,
            `ngram_${n}`
          ));
        }
      }
    }

    return matches;
  }

  _editDistanceMatch(text, pattern, originalText, contextSize) {
    const matches = [];
    const maxDistance = Math.floor(pattern.length * (1 - this.minSimilarity));

    // Check substrings of similar length
    const minLen = Math.max(1, pattern.length - maxDistance);
    const maxLen = pattern.length + maxDistance;

    for (let len = minLen; len <= maxLen; len++) {
      for (let i = 0; i <= text.length - len; i++) {
        const substring = text.substring(i, i + len);
        const levenshteinDist = this._levenshteinDistance(substring, pattern);
        const damerauDist = this._damerauLevenshteinDistance(substring, pattern);

        // Use the minimum of both distances
        const distance = Math.min(levenshteinDist, damerauDist);
        const maxPossibleDistance = Math.max(substring.length, pattern.length);
        const similarity = 1 - (distance / maxPossibleDistance);

        if (similarity >= this.minSimilarity) {
          const startIdx = i;
          const endIdx = i + len;

          matches.push(new FuzzyMatch(
            originalText.substring(Math.max(0, startIdx - contextSize),
                                 Math.min(originalText.length, endIdx + contextSize)),
            pattern,
            similarity,
            startIdx,
            endIdx,
            'edit_distance'
          ));
        }
      }
    }

    return matches;
  }

  _phoneticMatch(text, pattern, originalText, contextSize) {
    const matches = [];
    const patternSoundex = this._soundex(pattern);

    if (!patternSoundex) return matches;

    // Find words that sound similar
    const words = text.split(/\s+/);
    const originalWords = originalText.split(/\s+/);

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const wordSoundex = this._soundex(word);

      if (wordSoundex && wordSoundex === patternSoundex) {
        const startIdx = originalText.indexOf(originalWords[i]);
        const endIdx = startIdx + originalWords[i].length;

        // Calculate similarity based on length difference and exact soundex match
        const lengthSimilarity = 1 - Math.abs(word.length - pattern.length) / Math.max(word.length, pattern.length);
        const similarity = Math.min(0.95, 0.8 + (lengthSimilarity * 0.15)); // Base 0.8 for soundex match

        if (similarity >= this.minSimilarity) {
          matches.push(new FuzzyMatch(
            originalText.substring(Math.max(0, startIdx - contextSize),
                                 Math.min(originalText.length, endIdx + contextSize)),
            pattern,
            similarity,
            startIdx,
            endIdx,
            'phonetic'
          ));
        }
      }
    }

    return matches;
  }

  _fuzzySubstringMatch(text, pattern, originalText, contextSize) {
    const matches = [];
    const patternLen = pattern.length;

    // Use different window sizes for more flexible matching
    for (let windowSize = Math.max(1, patternLen - 2); windowSize <= patternLen + 2; windowSize++) {
      for (let i = 0; i <= text.length - windowSize; i++) {
        const substring = text.substring(i, i + windowSize);
        const similarity = this._calculateAdvancedSimilarity(substring, pattern);

        if (similarity >= this.minSimilarity) {
          const startIdx = i;
          const endIdx = i + windowSize;

          matches.push(new FuzzyMatch(
            originalText.substring(Math.max(0, startIdx - contextSize),
                                 Math.min(originalText.length, endIdx + contextSize)),
            pattern,
            similarity,
            startIdx,
            endIdx,
            'fuzzy_substring'
          ));
        }
      }
    }

    return matches;
  }

  _generateNgrams(text, n) {
    const ngrams = [];
    for (let i = 0; i <= text.length - n; i++) {
      ngrams.push(text.substring(i, i + n));
    }
    return ngrams;
  }

  _ngramSimilarity(ngrams1, ngrams2) {
    const set1 = new Set(ngrams1);
    const set2 = new Set(ngrams2);

    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
  }

  _calculateSimilarity(str1, str2) {
    // Use a combination of multiple similarity measures
    const levenshtein = 1 - (this._levenshteinDistance(str1, str2) / Math.max(str1.length, str2.length));
    const jaccard = this._jaccardSimilarity(str1, str2);

    // Weighted average
    return (levenshtein * 0.7) + (jaccard * 0.3);
  }

  _calculateAdvancedSimilarity(str1, str2) {
    // Use multiple similarity measures for better accuracy
    const levenshtein = 1 - (this._levenshteinDistance(str1, str2) / Math.max(str1.length, str2.length));
    const damerau = 1 - (this._damerauLevenshteinDistance(str1, str2) / Math.max(str1.length, str2.length));
    const jaccard = this._jaccardSimilarity(str1, str2);
    const ngramSim = this._ngramSimilarity(
      this._generateNgrams(str1, 2),
      this._generateNgrams(str2, 2)
    );

    // Weighted combination
    return (levenshtein * 0.3) + (damerau * 0.3) + (jaccard * 0.2) + (ngramSim * 0.2);
  }

  _levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  _damerauLevenshteinDistance(str1, str2) {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix = Array(len1 + 1).fill().map(() => Array(len2 + 1).fill(0));

    for (let i = 0; i <= len1; i++) matrix[i][0] = i;
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,      // deletion
          matrix[i][j - 1] + 1,      // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );

        // Transposition check
        if (i > 1 && j > 1 && str1[i - 1] === str2[j - 2] && str1[i - 2] === str2[j - 1]) {
          matrix[i][j] = Math.min(matrix[i][j], matrix[i - 2][j - 2] + cost);
        }
      }
    }

    return matrix[len1][len2];
  }

  _jaccardSimilarity(str1, str2) {
    const set1 = new Set(str1.toLowerCase().split(''));
    const set2 = new Set(str2.toLowerCase().split(''));

    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
  }

  _soundex(word) {
    if (!word || word.length === 0) return '';

    const wordUpper = word.toUpperCase();
    const firstLetter = wordUpper[0];

    // Soundex mapping
    const soundexMap = {
      'B': '1', 'F': '1', 'P': '1', 'V': '1',
      'C': '2', 'G': '2', 'J': '2', 'K': '2', 'Q': '2', 'S': '2', 'X': '2', 'Z': '2',
      'D': '3', 'T': '3',
      'L': '4',
      'M': '5', 'N': '5',
      'R': '6'
    };

    let soundex = firstLetter;
    let previousCode = soundexMap[firstLetter] || '';

    for (let i = 1; i < wordUpper.length && soundex.length < 4; i++) {
      const char = wordUpper[i];
      const code = soundexMap[char];

      if (code && code !== previousCode) {
        soundex += code;
        previousCode = code;
      } else if (!code) {
        previousCode = '';
      }
    }

    // Pad with zeros if necessary
    while (soundex.length < 4) {
      soundex += '0';
    }

    return soundex;
  }

  _removeOverlaps(matches) {
    if (matches.length <= 1) return matches;

    const sorted = matches.sort((a, b) => a.start_index - b.start_index);
    const nonOverlapping = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
      const current = sorted[i];
      const last = nonOverlapping[nonOverlapping.length - 1];

      // Check for overlap
      if (current.start_index < last.end_index) {
        // Overlapping - keep the one with higher similarity
        if (current.similarity > last.similarity) {
          nonOverlapping[nonOverlapping.length - 1] = current;
        }
        // If similarities are equal, keep the longer match
        else if (current.similarity === last.similarity &&
                 (current.end_index - current.start_index) > (last.end_index - last.start_index)) {
          nonOverlapping[nonOverlapping.length - 1] = current;
        }
      } else {
        nonOverlapping.push(current);
      }
    }

    return nonOverlapping;
  }

  // Advanced fuzzy matching with context awareness
  findContextAwareMatches(text, patterns, context = {}) {
    const baseMatches = this.findFuzzyMatches(text, patterns);

    if (!context || !baseMatches.length) return baseMatches;

    // Adjust similarity based on context
    return baseMatches.map(match => {
      let adjustedSimilarity = match.similarity;

      // Platform-specific adjustments
      if (context.platform) {
        const platform = context.platform.toLowerCase();
        if (platform === 'gaming' || platform === 'twitch') {
          // Gaming platforms often have more informal language
          adjustedSimilarity *= 0.9;
        } else if (platform === 'professional' || platform === 'linkedin') {
          // Professional platforms have stricter standards
          adjustedSimilarity *= 1.1;
        }
      }

      // User history adjustments
      if (context.userHistory && context.userHistory.frequentTypos) {
        adjustedSimilarity *= 1.05; // Slightly more lenient for users with frequent typos
      }

      // Content type adjustments
      if (context.contentType === 'code' || context.contentType === 'technical') {
        adjustedSimilarity *= 0.8; // More strict for technical content
      }

      // Language adjustments
      if (context.language && context.language !== 'en') {
        adjustedSimilarity *= 0.95; // Slightly more lenient for non-English content
      }

      // Time-based adjustments (recent content might be more lenient)
      if (context.timestamp) {
        const ageInHours = (Date.now() - context.timestamp) / (1000 * 60 * 60);
        if (ageInHours < 24) {
          adjustedSimilarity *= 0.98; // Slightly more lenient for very recent content
        }
      }

      return new FuzzyMatch(
        match.text,
        match.pattern,
        Math.min(1.0, Math.max(0.0, adjustedSimilarity)),
        match.start_index,
        match.end_index,
        match.method
      );
    });
  }

  getStats() {
    return {
      total_searches: this.stats.total_searches,
      matches_found: this.stats.matches_found,
      average_similarity: Math.round(this.stats.average_similarity * 1000) / 1000,
      method_usage: this.stats.method_usage,
      error_count: this.stats.error_count,
      match_rate: this.stats.total_searches > 0 ?
        Math.round((this.stats.matches_found / this.stats.total_searches) * 100) / 100 : 0
    };
  }

  resetStats() {
    this.stats = {
      total_searches: 0,
      matches_found: 0,
      average_similarity: 0.0,
      method_usage: {},
      error_count: 0
    };
  }

  // Batch processing for multiple texts
  batchFindMatches(texts, patterns, contextSize = 10) {
    const results = [];

    for (const text of texts) {
      const matches = this.findFuzzyMatches(text, patterns, contextSize);
      results.push({
        text: text,
        matches: matches,
        match_count: matches.length
      });
    }

    return results;
  }

  // Advanced pattern learning from successful matches
  learnFromMatches(matches, minOccurrences = 3) {
    const patternFrequency = {};

    // Count pattern frequencies
    for (const match of matches) {
      if (!patternFrequency[match.pattern]) {
        patternFrequency[match.pattern] = 0;
      }
      patternFrequency[match.pattern]++;
    }

    // Identify frequently matched patterns
    const frequentPatterns = Object.entries(patternFrequency)
      .filter(([pattern, count]) => count >= minOccurrences)
      .map(([pattern, count]) => ({ pattern, frequency: count }));

    return frequentPatterns;
  }
}

module.exports = { FuzzyMatcher, FuzzyMatch };
