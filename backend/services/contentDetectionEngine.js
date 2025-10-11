/**
 * ContentDetectionEngine - JavaScript port of Python content detection engine
 * Handles real-time content analysis using regex, NLP, and fuzzy matching
 */

const fs = require('fs').promises;
const path = require('path');

class Detection {
  constructor(detectionType, category, severity, match, position, confidence, method, actualWord = null) {
    this.detection_type = detectionType;
    this.category = category;
    this.severity = severity;
    this.match = match;
    this.position = position;
    this.confidence = confidence;
    this.method = method;
    this.actual_word = actualWord;
  }
}

class DetectionResult {
  constructor(isAbusive, riskScore, riskLevel, detections, suggestions, categories, confidence, processingTime) {
    this.is_abusive = isAbusive;
    this.risk_score = riskScore;
    this.risk_level = riskLevel;
    this.detections = detections;
    this.suggestions = suggestions;
    this.categories = categories;
    this.confidence = confidence;
    this.processing_time = processingTime;
  }
}

class ContentDetectionEngine {
  constructor() {
    this.severityLevels = {
      LOW: 1,
      MEDIUM: 2,
      HIGH: 3,
      CRITICAL: 4
    };

    this.abusivePatterns = this._initializePatterns();
    this.detectionCache = new Map();
    this.maxCacheSize = 1000;

    this.stats = {
      total_scanned: 0,
      threats_detected: 0,
      false_positives: 0,
      categories: {},
      cache_hits: 0,
      cache_misses: 0
    };

    console.log('ContentDetectionEngine initialized successfully');
  }

  _initializePatterns() {
    return {
      harassment: {
        words: [
          'idiot', 'stupid', 'moron', 'loser', 'pathetic', 'worthless',
          'disgusting', 'horrible', 'terrible', 'awful', 'useless', 'trash',
          'garbage', 'scum', 'pig', 'animal', 'freak', 'weirdo'
        ],
        patterns: [
          /you\s+(are|r)\s+(so\s+)?(stupid|dumb|idiotic|pathetic)/gi,
          /kill\s+yourself/gi,
          /go\s+die/gi,
          /nobody\s+likes\s+you/gi,
          /you\s+should\s+die/gi,
          /end\s+your\s+life/gi,
          /waste\s+of\s+space/gi,
          /you\s+suck\s+at\s+everything/gi
        ],
        severity: this.severityLevels.HIGH
      },

      hate_speech: {
        words: [
          'racist', 'bigot', 'nazi', 'supremacist', 'fascist',
          'terrorist', 'radical', 'extremist', 'discrimination'
        ],
        patterns: [
          /all\s+\w+\s+are\s+(bad|evil|stupid|inferior)/gi,
          /i\s+hate\s+all\s+\w+/gi,
          /\w+\s+people\s+are\s+(inferior|superior|dangerous)/gi,
          /death\s+to\s+all\s+\w+/gi,
          /\w+\s+don\'t\s+belong\s+here/gi,
          /go\s+back\s+to\s+your\s+country/gi
        ],
        severity: this.severityLevels.CRITICAL
      },

      spam: {
        words: [
          'buy now', 'click here', 'free money', 'guaranteed win',
          'limited time', 'act now', 'special offer', 'earn fast',
          'work from home', 'make money', 'get rich', 'no experience',
          'miracle cure', 'lose weight fast'
        ],
        patterns: [
          /click\s+here\s+to\s+(win|earn|get)/gi,
          /free\s+\$\d+/gi,
          /guaranteed\s+(income|money|win)/gi,
          /work\s+from\s+home\s+\$\d+/gi,
          /(bit\.ly|tinyurl|goo\.gl|t\.co)\/\w+/gi,
          /earn\s+\$\d+\s+per\s+(day|hour|week)/gi,
          /lose\s+\d+\s+pounds\s+in\s+\d+\s+days/gi
        ],
        severity: this.severityLevels.LOW
      },

      threats: {
        words: [
          'kill', 'murder', 'destroy', 'hurt', 'harm', 'attack',
          'violence', 'weapon', 'bomb', 'shoot', 'stab', 'beat',
          'torture', 'eliminate', 'annihilate', 'crush', 'demolish'
        ],
        patterns: [
          /i\s+will\s+(kill|hurt|harm|destroy)/gi,
          /gonna\s+(kill|hurt|destroy|attack)/gi,
          /watch\s+your\s+back/gi,
          /you\s+(will|gonna)\s+pay/gi,
          /i\s+know\s+where\s+you\s+live/gi,
          /meet\s+me\s+(outside|irl)/gi,
          /i\'ll\s+find\s+you/gi,
          /you\'re\s+dead/gi
        ],
        severity: this.severityLevels.CRITICAL
      },

      cyberbullying: {
        words: [
          'ugly', 'fat', 'weird', 'freak', 'reject', 'outcast',
          'loner', 'embarrassing', 'shameful', 'cringe', 'pathetic',
          'failure', 'disappointment', 'nobody', 'worthless'
        ],
        patterns: [
          /everyone\s+hates\s+you/gi,
          /you\s+have\s+no\s+friends/gi,
          /why\s+don\'t\s+you\s+just\s+leave/gi,
          /nobody\s+wants\s+you\s+here/gi,
          /you\'re\s+such\s+a\s+(loser|failure)/gi,
          /go\s+back\s+to\s+your\s+cave/gi,
          /you\s+don\'t\s+belong/gi
        ],
        severity: this.severityLevels.HIGH
      },

      sexual_harassment: {
        words: [
          'sexy', 'hot', 'beautiful', 'gorgeous', 'attractive'
        ],
        patterns: [
          /send\s+me\s+(pics|photos)/gi,
          /what\s+are\s+you\s+wearing/gi,
          /you\s+look\s+(hot|sexy)/gi,
          /wanna\s+(hook\s+up|meet)/gi,
          /dtf\?/gi,
          /netflix\s+and\s+chill/gi
        ],
        severity: this.severityLevels.HIGH
      },

      profanity: {
        words: [
          'fuck', 'shit', 'damn', 'bitch', 'asshole', 'bastard', 'cunt', 'dick',
          'pussy', 'cock', 'fucker', 'motherfucker', 'bullshit', 'crap', 'hell',
          'piss', 'suck', 'tits', 'boobs', 'ass', 'nigga', 'nigger', 'faggot',
          'retard', 'spastic', 'chink', 'gook', 'wetback', 'beaner', 'kike'
        ],
        patterns: [
          /f[u\*@#\$%\^&\(\)]ck/gi,
          /s[h\*@#\$%\^&\(\)]t/gi,
          /b[i\*@#\$%\^&\(\)]tch/gi,
          /c[u\*@#\$%\^&\(\)]nt/gi,
          /d[i\*@#\$%\^&\(\)]ck/gi,
          /p[u\*@#\$%\^&\(\)]ssy/gi,
          /c[o\*@#\$%\^&\(\)]ck/gi,
          /f[u\*@#\$%\^&\(\)]cker/gi,
          /m[o\*@#\$%\^&\(\)]therf[u\*@#\$%\^&\(\)]cker/gi,
          /b[u\*@#\$%\^&\(\)]llsh[i\*@#\$%\^&\(\)]t/gi,
          /a[s\*@#\$%\^&\(\)]sh[o\*@#\$%\^&\(\)]le/gi,
          /b[a\*@#\$%\^&\(\)]st[a\*@#\$%\^&\(\)]rd/gi,
          /d[a\*@#\$%\^&\(\)]mn/gi,
          /h[e\*@#\$%\^&\(\)]ll/gi,
          /p[i\*@#\$%\^&\(\)]ss/gi,
          /s[u\*@#\$%\^&\(\)]ck/gi,
          /t[i\*@#\$%\^&\(\)]ts/gi,
          /b[o\*@#\$%\^&\(\)]obs/gi,
          /a[s\*@#\$%\^&\(\)]s/gi,
          /n[i\*@#\$%\^&\(\)]gg[e\*@#\$%\^&\(\)]r/gi,
          /f[a\*@#\$%\^&\(\)]gg[o\*@#\$%\^&\(\)]t/gi,
          /r[e\*@#\$%\^&\(\)]t[a\*@#\$%\^&\(\)]rd/gi
        ],
        severity: this.severityLevels.MEDIUM
      },

      doxxing: {
        words: [
          'address', 'phone', 'email', 'location', 'home', 'workplace',
          'school', 'personal', 'private', 'expose', 'reveal', 'leak'
        ],
        patterns: [
          /lives\s+(at|in)\s+\d+/gi,
          /phone\s+(number|is)\s*\d+/gi,
          /email\s+(is|address)\s*\w+@\w+\.\w+/gi,
          /works\s+(at|for)\s+\w+/gi,
          /school\s+(is|at)\s+\w+/gi,
          /i\s+know\s+where\s+you\s+(live|work)/gi,
          /your\s+(real\s+)?name\s+is/gi,
          /exposing\s+your\s+(identity|info)/gi
        ],
        severity: this.severityLevels.CRITICAL
      },

      revenge_porn: {
        words: [
          'nude', 'naked', 'porn', 'sex', 'intimate', 'private', 'photos',
          'videos', 'leak', 'share', 'distribute', 'blackmail', 'extort'
        ],
        patterns: [
          /i\s+(have|will)\s+(send|share|post)\s+(your\s+)?(nude|naked|porn)/gi,
          /pay\s+me\s+or\s+i\s+(leak|share|post)/gi,
          /your\s+(nude|naked|sex)\s+(pics|photos|videos)/gi,
          /i\s+recorded\s+(our\s+)?sex/gi,
          /blackmail\s+with\s+(nude|porn)/gi,
          /revenge\s+(porn|pics)/gi
        ],
        severity: this.severityLevels.CRITICAL
      },

      slut_shaming: {
        words: [
          'slut', 'whore', 'hoe', 'skank', 'loose', 'easy', 'promiscuous',
          'sleeps around', 'bed hopper', 'man eater', 'gold digger'
        ],
        patterns: [
          /you\s+(are|r)\s+a\s+(slut|whore|hoe)/gi,
          /sleeps\s+with\s+everyone/gi,
          /loose\s+woman/gi,
          /promiscuous\s+(girl|woman)/gi,
          /gold\s+digging\s+(bitch|slut)/gi,
          /man\s+eater/gi,
          /easy\s+lay/gi
        ],
        severity: this.severityLevels.HIGH
      },

      body_shaming: {
        words: [
          'fat', 'ugly', 'disgusting', 'gross', 'obese', 'skinny', 'anorexic',
          'bulimic', 'deformed', 'hideous', 'repulsive', 'unattractive'
        ],
        patterns: [
          /you\s+(are|r)\s+(so\s+)?(fat|ugly|disgusting)/gi,
          /lose\s+(some\s+)?weight/gi,
          /you\s+look\s+(awful|terrible|hideous)/gi,
          /nobody\s+would\s+(want|fuck)\s+you/gi,
          /your\s+body\s+is\s+(gross|repulsive)/gi,
          /eat\s+less/gi,
          /you\s+(need|should)\s+(diet|exercise)/gi
        ],
        severity: this.severityLevels.HIGH
      },

      gaslighting: {
        words: [
          'crazy', 'insane', 'delusional', 'paranoid', 'psycho', 'mad',
          'lying', 'liar', 'made up', 'imagining', 'hallucinating'
        ],
        patterns: [
          /you\'re\s+(crazy|insane|delusional)/gi,
          /that\s+(never\s+)?happened/gi,
          /you\s+(made|are\s+making)\s+it\s+up/gi,
          /you\'re\s+(lying|being\s+paranoid)/gi,
          /i\s+never\s+said\s+that/gi,
          /you\s+misremember/gi,
          /you\'re\s+(hallucinating|imagining)/gi,
          /stop\s+(being\s+)?dramatic/gi
        ],
        severity: this.severityLevels.MEDIUM
      },

      homophobia: {
        words: [
          'fag', 'faggot', 'homo', 'queer', 'gay', 'sodomite', 'fruit',
          'pillow biter', 'cocksucker', 'butt pirate'
        ],
        patterns: [
          /you\s+(are|r)\s+(gay|fag|homo)/gi,
          /gay\s+people\s+are\s+(disgusting|wrong)/gi,
          /homosexuality\s+is\s+(sin|wrong|disease)/gi,
          /turn\s+straight/gi,
          /pray\s+the\s+gay\s+away/gi,
          /fag\s+hag/gi,
          /fruit\s+loop/gi
        ],
        severity: this.severityLevels.CRITICAL
      },

      transphobia: {
        words: [
          'tranny', 'shemale', 'ladyboy', 'chick with dick', 'man in dress',
          'confused', 'delusional', 'mentally ill', 'autogynephile'
        ],
        patterns: [
          /you\s+(are|r)\s+(not\s+)?a\s+(real\s+)?(man|woman)/gi,
          /biological\s+(man|woman)/gi,
          /born\s+in\s+the\s+wrong\s+body/gi,
          /tranny\s+chaser/gi,
          /shemale\s+porn/gi,
          /ladyboy/gi,
          /chick\s+with\s+dick/gi
        ],
        severity: this.severityLevels.CRITICAL
      },

      religious_intolerance: {
        words: [
          'infidel', 'heathen', 'pagan', 'heretic', 'apostate', 'blasphemer',
          'godless', 'atheist', 'sinner', 'devil worshipper'
        ],
        patterns: [
          /you\s+(are|r)\s+going\s+to\s+(hell|burn)/gi,
          /god\s+hates\s+you/gi,
          /pray\s+for\s+forgiveness/gi,
          /repent\s+or\s+(die|burn)/gi,
          /your\s+religion\s+is\s+(wrong|false)/gi,
          /convert\s+or\s+(die|leave)/gi,
          /infidel/gi,
          /heathen/gi
        ],
        severity: this.severityLevels.HIGH
      },

      ageism: {
        words: [
          'old', 'senile', 'dementia', 'outdated', 'obsolete', 'fossil',
          'boomer', 'millennial', 'gen z', 'cringe', 'lame', 'uncool'
        ],
        patterns: [
          /you\'re\s+(too\s+)?old\s+(for\s+that|to\s+understand)/gi,
          /boomer\s+logic/gi,
          /millennial\s+snowflake/gi,
          /gen\s+z\s+(is\s+)?ruining/gi,
          /get\s+off\s+my\s+lawn/gi,
          /kids\s+these\s+days/gi,
          /back\s+in\s+my\s+day/gi,
          /you\s+(wouldn\'t|don\'t)\s+get\s+it/gi
        ],
        severity: this.severityLevels.MEDIUM
      },

      ableism: {
        words: [
          'retard', 'spastic', 'cripple', 'lame', 'deaf', 'blind', 'dumb',
          'stupid', 'idiot', 'moron', 'imbecile', 'feeble minded'
        ],
        patterns: [
          /you\s+(are|r)\s+(retarded|spastic|crippled)/gi,
          /mentally\s+(disabled|challenged|handicapped)/gi,
          /physically\s+(disabled|challenged)/gi,
          /wheelchair\s+bound/gi,
          /special\s+needs/gi,
          /slow\s+learner/gi,
          /learning\s+disability/gi
        ],
        severity: this.severityLevels.HIGH
      },

      gaming_harassment: {
        words: [
          'noob', 'scrub', 'tryhard', 'sweat', 'boosted', 'smurf', 'cheater',
          'hacker', 'script kiddie', 'rage quit', 'tilt', 'camp', 'grief'
        ],
        patterns: [
          /you\s+(are|r)\s+a\s+(noob|scrub|cheater)/gi,
          /get\s+good/gi,
          /uninstall\s+(the\s+game|lol)/gi,
          /go\s+back\s+to\s+(kindergarten|school)/gi,
          /your\s+mom/gi,
          /ez\s+pz/gi,
          /gg\s+no\s+re/gi,
          /report\s+for\s+(cheating|hacking)/gi
        ],
        severity: this.severityLevels.MEDIUM
      },

      political_extremism: {
        words: [
          'liberal', 'conservative', 'leftist', 'right wing', 'fascist',
          'communist', 'socialist', 'capitalist', 'snowflake', 'sheep',
          'brainwashed', 'propaganda', 'fake news'
        ],
        patterns: [
          /all\s+(liberals|conservatives|leftists)\s+are\s+(stupid|evil)/gi,
          /you\s+(are|r)\s+a\s+(liberal|conservative|leftist)/gi,
          /wake\s+up\s+(sheep|sheeple)/gi,
          /red\s+pill/gi,
          /blue\s+pilled/gi,
          /controlled\s+opposition/gi,
          /deep\s+state/gi,
          /conspiracy\s+theorist/gi
        ],
        severity: this.severityLevels.MEDIUM
      },

      cancel_culture: {
        words: [
          'cancel', 'canceled', 'ratio', 'ratioed', 'clout', 'influencer',
          'woke', 'problematic', 'offensive', 'triggering', 'unsafe',
          'harmful', 'toxic', 'abusive', 'predator'
        ],
        patterns: [
          /cancel\s+(this\s+)?\w+/gi,
          /ratio\s+(this\s+)?tweet/gi,
          /this\s+is\s+(problematic|offensive|harmful)/gi,
          /you\s+(are|r)\s+(canceled|finished|done)/gi,
          /expose\s+(this\s+)?\w+/gi,
          /call\s+out/gi,
          /accountability/gi,
          /justice/gi
        ],
        severity: this.severityLevels.MEDIUM
      }
    };
  }

  detectAbusiveContent(text, context = {}) {
    const startTime = Date.now();

    // Input validation
    if (!text || typeof text !== 'string') {
      return this._createEmptyResult(Date.now() - startTime);
    }

    // Check cache first
    const cacheKey = this._generateCacheKey(text, context);
    if (this.detectionCache.has(cacheKey)) {
      this.stats.cache_hits++;
      const cachedResult = this.detectionCache.get(cacheKey);
      cachedResult.processing_time = Date.now() - startTime;
      return cachedResult;
    }

    this.stats.cache_misses++;

    // Preprocess text
    const preprocessedText = this._preprocessText(text);

    // Run detection for each category
    const detections = [];
    for (const [category, config] of Object.entries(this.abusivePatterns)) {
      const categoryDetections = this._detectCategory(
        preprocessedText, text, category, config, context
      );
      detections.push(...categoryDetections);
    }

    // Calculate risk score and create result
    const result = this._calculateRiskScore(detections, text, context);
    result.processing_time = Date.now() - startTime;

    // Update statistics
    this._updateStats(result);

    // Cache the result
    this._cacheResult(cacheKey, result);

    return result;
  }

  _preprocessText(text) {
    // Convert to lowercase
    text = text.toLowerCase();

    // Replace common obfuscation techniques
    const obfuscationMap = {
      '@': 'a', '3': 'e', '1': 'i', '0': 'o', '5': 's',
      '$': 's', '4': 'a', '7': 't', '+': 't'
    };

    for (const [char, replacement] of Object.entries(obfuscationMap)) {
      text = text.replace(new RegExp(char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement);
    }

    // Remove excessive punctuation but keep some structure
    text = text.replace(/[^\w\s]/g, ' ');

    // Normalize whitespace
    text = text.replace(/\s+/g, ' ').trim();

    return text;
  }

  _detectCategory(preprocessedText, originalText, category, config, context) {
    const detections = [];

    // Word-based detection with fuzzy matching
    const wordDetections = this._detectWords(
      preprocessedText, config.words, category, config.severity
    );
    detections.push(...wordDetections);

    // Pattern-based detection using regex
    const patternDetections = this._detectPatterns(
      originalText, config.patterns, category, config.severity
    );
    detections.push(...patternDetections);

    // Adjust detections based on context
    const adjustedDetections = this._adjustForContext(detections, context);

    return adjustedDetections;
  }

  _detectWords(text, words, category, severity) {
    const detections = [];
    const textWords = text.split(' ');

    for (const word of words) {
      for (let i = 0; i < textWords.length; i++) {
        const textWord = textWords[i];

        // Exact match
        if (textWord === word) {
          detections.push(new Detection(
            'word',
            category,
            severity,
            word,
            i,
            1.0,
            'exact'
          ));
        }
        // Fuzzy match
        else if (this._fuzzyMatch(textWord, word)) {
          const similarity = this._calculateSimilarity(textWord, word);
          detections.push(new Detection(
            'word',
            category,
            Math.max(2, severity - 1),
            word,
            i,
            similarity,
            'fuzzy',
            textWord
          ));
        }
      }
    }

    return detections;
  }

  _detectPatterns(text, patterns, category, severity) {
    const detections = [];

    for (const pattern of patterns) {
      const matches = [...text.matchAll(pattern)];
      for (const match of matches) {
        detections.push(new Detection(
          'pattern',
          category,
          severity,
          match[0],
          match.index,
          0.9,
          'regex'
        ));
      }
    }

    return detections;
  }

  _fuzzyMatch(str1, str2, threshold = 0.9) {
    if (str1.length < 3 || str2.length < 3) {
      return false;
    }

    const similarity = this._calculateSimilarity(str1, str2);
    return similarity >= threshold;
  }

  _calculateSimilarity(str1, str2) {
    // Simple Levenshtein distance-based similarity
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const distance = this._levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
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

  _adjustForContext(detections, context) {
    if (!context) return detections;

    return detections.map(detection => {
      const adjustedDetection = { ...detection };

      // Platform-specific adjustments
      if (context.platform) {
        const platform = context.platform.toLowerCase();
        if (platform === 'twitter' && detection.category === 'harassment') {
          adjustedDetection.severity = Math.max(1, Math.floor(detection.severity * 0.8));
        } else if (platform === 'linkedin') {
          adjustedDetection.severity = Math.min(4, Math.floor(detection.severity * 1.2));
        } else if (['gaming', 'twitch', 'discord'].includes(platform)) {
          if (['harassment', 'cyberbullying'].includes(detection.category)) {
            adjustedDetection.severity = Math.max(1, Math.floor(detection.severity * 0.7));
          }
        }
      }

      return adjustedDetection;
    });
  }

  _calculateRiskScore(detections, text, context) {
    if (!detections.length) {
      return this._createEmptyResult(0);
    }

    // Calculate base risk score
    const totalSeverity = detections.reduce((sum, d) => sum + (d.severity * d.confidence), 0);
    const maxPossibleSeverity = detections.length * 4;
    const baseScore = maxPossibleSeverity > 0 ? (totalSeverity / maxPossibleSeverity) * 100 : 0;

    // Adjust for detection density
    const textLength = text.split(' ').length;
    const detectionDensity = detections.length / textLength;
    const densityMultiplier = Math.min(1.5, 1 + (detectionDensity * 2));

    const finalScore = Math.min(100, baseScore * densityMultiplier);

    // Determine risk level
    let riskLevel;
    if (finalScore >= 80) riskLevel = 'CRITICAL';
    else if (finalScore >= 60) riskLevel = 'HIGH';
    else if (finalScore >= 30) riskLevel = 'MEDIUM';
    else if (finalScore > 0) riskLevel = 'LOW';
    else riskLevel = 'NONE';

    // Extract unique categories
    const categories = [...new Set(detections.map(d => d.category))];

    // Calculate overall confidence
    const avgConfidence = detections.reduce((sum, d) => sum + d.confidence, 0) / detections.length;

    // Generate suggestions
    const suggestions = this._generateSuggestions(detections, text);

    return new DetectionResult(
      finalScore > 0,
      Math.round(finalScore * 100) / 100,
      riskLevel,
      detections,
      suggestions,
      categories,
      Math.round(avgConfidence * 100) / 100,
      0 // Will be set by caller
    );
  }

  _generateSuggestions(detections, text) {
    const suggestions = [];
    const categories = new Set(detections.map(d => d.category));

    const suggestionMap = {
      harassment: "Consider using more respectful language when expressing disagreement.",
      hate_speech: "Please avoid language that targets or discriminates against groups of people.",
      spam: "Focus on genuine communication rather than promotional content.",
      threats: "Express your feelings without threatening language or implications of harm.",
      cyberbullying: "Try to communicate constructively rather than attacking the person.",
      sexual_harassment: "Keep your communication appropriate and professional.",
      profanity: "Consider using alternative words that are less offensive.",
      doxxing: "Never share personal information about others without their consent.",
      revenge_porn: "Sharing intimate images without consent is illegal and harmful.",
      slut_shaming: "Avoid judging others based on their personal choices or relationships.",
      body_shaming: "Everyone deserves respect regardless of their appearance.",
      gaslighting: "Be honest and respectful in your communications.",
      homophobia: "Respect all individuals regardless of their sexual orientation.",
      transphobia: "Respect all individuals regardless of their gender identity.",
      religious_intolerance: "Respect diverse beliefs and avoid religious discrimination.",
      ageism: "Value people of all ages and life experiences.",
      ableism: "Respect all individuals regardless of physical or mental abilities.",
      gaming_harassment: "Keep gaming fun and respectful for everyone.",
      political_extremism: "Engage in civil discourse even on political topics.",
      cancel_culture: "Focus on constructive dialogue rather than public shaming."
    };

    for (const category of categories) {
      if (suggestionMap[category]) {
        suggestions.push(suggestionMap[category]);
      }
    }

    return suggestions;
  }

  _createEmptyResult(processingTime) {
    return new DetectionResult(
      false,
      0.0,
      'NONE',
      [],
      [],
      [],
      1.0,
      processingTime
    );
  }

  _generateCacheKey(text, context) {
    const contextStr = context ? JSON.stringify(context) : "{}";
    return `${text.substring(0, 100).split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0)}_${contextStr.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0)}`;
  }

  _cacheResult(key, result) {
    if (this.detectionCache.size >= this.maxCacheSize) {
      // Remove oldest entry (simple FIFO)
      const firstKey = this.detectionCache.keys().next().value;
      this.detectionCache.delete(firstKey);
    }

    this.detectionCache.set(key, result);
  }

  _updateStats(result) {
    if (result.is_abusive) {
      this.stats.threats_detected++;

      for (const category of result.categories) {
        if (!this.stats.categories[category]) {
          this.stats.categories[category] = 0;
        }
        this.stats.categories[category]++;
      }
    }
  }

  getStats() {
    const totalRequests = this.stats.cache_hits + this.stats.cache_misses;
    const cacheHitRate = totalRequests > 0 ? (this.stats.cache_hits / totalRequests * 100) : 0;

    return {
      total_scanned: this.stats.total_scanned,
      threats_detected: this.stats.threats_detected,
      false_positives: this.stats.false_positives,
      categories: this.stats.categories,
      cache_hit_rate: Math.round(cacheHitRate * 100) / 100,
      detection_rate: this.stats.total_scanned > 0 ?
        Math.round((this.stats.threats_detected / this.stats.total_scanned * 100) * 100) / 100 : 0
    };
  }

  resetStats() {
    this.stats = {
      total_scanned: 0,
      threats_detected: 0,
      false_positives: 0,
      categories: {},
      cache_hits: 0,
      cache_misses: 0
    };
  }

  clearCache() {
    this.detectionCache.clear();
  }

  addCustomPattern(category, pattern, severity) {
    try {
      if (!this.abusivePatterns[category]) {
        this.abusivePatterns[category] = {
          words: [],
          patterns: [],
          severity: severity
        };
      }

      // Test if pattern is valid regex
      new RegExp(pattern);
      this.abusivePatterns[category].patterns.push(new RegExp(pattern, 'gi'));
      console.log(`Added custom pattern to ${category}: ${pattern}`);
      return true;
    } catch (e) {
      console.error(`Invalid regex pattern '${pattern}': ${e.message}`);
      return false;
    }
  }

  removePattern(category, pattern) {
    if (this.abusivePatterns[category] &&
        this.abusivePatterns[category].patterns.includes(pattern)) {
      const index = this.abusivePatterns[category].patterns.indexOf(pattern);
      if (index > -1) {
        this.abusivePatterns[category].patterns.splice(index, 1);
        console.log(`Removed pattern from ${category}: ${pattern}`);
        return true;
      }
    }
    return false;
  }
}

module.exports = { ContentDetectionEngine, Detection, DetectionResult };
