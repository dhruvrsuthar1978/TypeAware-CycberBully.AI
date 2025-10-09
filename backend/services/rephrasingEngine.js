/**
 * RephrasingEngine - JavaScript port of Python rephrasing engine
 * Generates positive, constructive alternatives to potentially harmful messages
 */

class ReframingStrategy {
  static SOFTEN_TONE = "soften_tone";
  static ADD_EMPATHY = "add_empathy";
  static CONSTRUCTIVE_CRITICISM = "constructive_criticism";
  static QUESTION_REFRAME = "question_reframe";
  static POSITIVE_SUGGESTION = "positive_suggestion";
  static PERSPECTIVE_SHIFT = "perspective_shift";
  static COLLABORATIVE_APPROACH = "collaborative_approach";
  static ACKNOWLEDGE_FEELINGS = "acknowledge_feelings";
  static SET_BOUNDARY = "set_boundary"; // New strategy for direct insults
}

class MessageType {
  static INSULT = "insult";
  static CRITICISM = "criticism";
  static DISAGREEMENT = "disagreement";
  static FRUSTRATION = "frustration";
  static THREAT = "threat";
  static DISMISSAL = "dismissal";
  static SARCASM = "sarcasm";
  static EXCLUSION = "exclusion";
  static NONE = "none";
}

class RephrasingSuggestion {
  constructor(originalText, suggestedText, strategyUsed, explanation, toneImprovement, appropriatenessScore, contextPreserved) {
    this.original_text = originalText;
    this.suggested_text = suggestedText;
    this.strategy_used = strategyUsed;
    this.explanation = explanation;
    this.tone_improvement = toneImprovement;
    this.appropriateness_score = appropriatenessScore;
    this.context_preserved = contextPreserved;
  }
}

class RephrasingResult {
  constructor(originalMessage, messageType, suggestions, educationalNote, confidence) {
    this.original_message = originalMessage;
    this.message_type = messageType;
    this.suggestions = suggestions;
    this.educational_note = educationalNote;
    this.confidence = confidence;
  }
}

class RephrasingEngine {
  constructor() {
    this.toneSofteners = this._loadToneSofteners();
    this.empathyPhrases = this._loadEmpathyPhrases();
    this.constructiveStarters = this._loadConstructiveStarters();
    this.questionReframers = this._loadQuestionReframers();
    this.positiveAlternatives = this._loadPositiveAlternatives();
    this.perspectiveShifters = this._loadPerspectiveShifters();
    this.messagePatterns = this._loadMessagePatterns();
    this.educationalMessages = this._loadEducationalMessages();

    this.stats = {
      total_processed: 0,
      successful_rephrasings: 0,
      strategy_usage: {},
      error_count: 0
    };

    console.log('RephrasingEngine initialized');
  }

  _loadToneSofteners() {
    return {
      'you are': ['you might be', 'you seem to be', 'it appears you are'],
      'you\'re': ['you might be', 'you seem', 'it appears you\'re'],
      'obviously': ['it seems that', 'perhaps', 'it appears that'],
      'clearly': ['it seems', 'perhaps', 'it might be that'],
      'stupid': ['not well thought out', 'confusing', 'unclear'],
      'dumb': ['not clear', 'confusing', 'hard to understand'],
      'idiotic': ['not well planned', 'unclear', 'confusing'],
      'ridiculous': ['surprising', 'unexpected', 'unusual'],
      'pathetic': ['disappointing', 'concerning', 'unfortunate'],
      'terrible': ['not ideal', 'challenging', 'difficult'],
      'awful': ['not great', 'challenging', 'difficult'],
      'hate': ['strongly dislike', 'find frustrating', 'have concerns about'],
      'disgusting': ['concerning', 'troubling', 'problematic'],
      'never': ['rarely', 'seldom', 'not often'],
      'always': ['often', 'frequently', 'usually'],
      'shut up': ['let me share my thoughts', 'I\'d like to add', 'here\'s another perspective'],
      'you\'re wrong': ['I see it differently', 'I have a different view', 'from my perspective']
    };
  }

  _loadEmpathyPhrases() {
    return [
      "I don't appreciate comments that mock or insult others",
      "Personal insults and body-shaming are never okay",
      "I believe in treating everyone with respect and dignity",
      "Let's maintain a respectful conversation",
      "I prefer to communicate with kindness and respect",
      "Making fun of others isn't acceptable",
      "Everyone deserves to be treated with respect",
      "I'd rather have a respectful dialogue",
      "Kindness and respect are important to me",
      "Let's keep our conversation respectful and constructive"
    ];
  }

  _loadConstructiveStarters() {
    return [
      "What if we tried",
      "Have you considered",
      "Maybe we could explore",
      "Another approach might be",
      "It might help to",
      "One option could be",
      "Perhaps we could",
      "What do you think about",
      "How about we",
      "Could we try",
      "It might be worth",
      "Let's consider"
    ];
  }

  _loadQuestionReframers() {
    return {
      'criticism': [
        "What do you think about trying {suggestion}?",
        "How would you feel about {suggestion}?",
        "What if we approached this by {suggestion}?",
        "Could we consider {suggestion}?",
        "Would it help to {suggestion}?"
      ],
      'disagreement': [
        "I'm curious about your thoughts on {topic}",
        "How do you see {topic}?",
        "What's your perspective on {topic}?",
        "Can you help me understand {topic}?",
        "What am I missing about {topic}?"
      ],
      'frustration': [
        "What would make this situation better?",
        "How can we improve this?",
        "What would be most helpful right now?",
        "What changes would you like to see?",
        "How can we work together on this?"
      ]
    };
  }

  _loadPositiveAlternatives() {
    return {
      'insults': {
        'stupid': ['I prefer respectful discussion', 'let\'s keep things respectful', 'I value treating each other with respect'],
        'dumb': ['I believe in respectful communication', 'let\'s maintain a respectful dialogue', 'I prefer discussing things respectfully'],
        'idiot': ['everyone deserves respect', 'let\'s treat each other with respect', 'I value respectful communication'],
        'moron': ['I prefer kind and respectful dialogue', 'let\'s keep our conversation respectful', 'respect is important to me'],
        'loser': ['everyone deserves to be treated with dignity', 'let\'s maintain mutual respect', 'I believe in treating others with respect'],
        'pathetic': ['I prefer positive and respectful discussion', 'let\'s focus on respectful communication', 'respect is essential in our conversations'],
        'worthless': ['everyone has value and deserves respect', 'let\'s communicate with mutual respect', 'I believe in treating everyone with dignity'],
        'fatty': [ // <-- IMPROVED SUGGESTIONS
          "Comments about anyone's body are hurtful and not okay. Let's be respectful.",
          "That's a hurtful thing to say. I'd appreciate it if you'd stop.",
          "Personal attacks about appearance aren't acceptable. Let's focus on the conversation kindly."
        ],
        'ugly': ['appearance-based insults are hurtful', 'let\'s maintain respectful communication', 'everyone deserves to be treated with dignity']
      },
      'dismissive': {
        'whatever': ['I understand', 'I see', 'okay'],
        'who cares': ['this might not be important to everyone', 'people may have different priorities'],
        'so what': ['I see your point', 'I understand'],
        'big deal': ['this seems important to you']
      },
      'aggressive': {
        'shut up': ['let me share my thoughts', 'I\'d like to add something'],
        'go away': ['I need some space right now', 'I\'d prefer to talk later'],
        'leave me alone': ['I need some time to think', 'I\'d like some space'],
        'mind your own business': ['this is personal for me', 'I\'d rather not discuss this']
      }
    };
  }

  _loadPerspectiveShifters() {
    return [
      "From another angle",
      "Looking at it differently",
      "Another way to see this",
      "From a different perspective",
      "Considering another viewpoint",
      "If we look at this another way",
      "From where I stand",
      "In my experience",
      "From what I've seen",
      "Based on my understanding"
    ];
  }

  _loadMessagePatterns() {
    return {
      [MessageType.INSULT]: [
        /\b(stupid|dumb|idiot|moron|loser|pathetic|worthless|fatty|ugly|weird|creepy)\b/gi,
        /you\s+(are|'re)\s+(so\s+)?(stupid|dumb|pathetic)/gi,
        /what\s+an?\s+(idiot|moron|loser)/gi,
        /your\s+(?:mom|mother|dad|father|parent)\s+(?:is|looks?)\s+(.+)/gi,
        /\b(?:fat|ugly|stupid|dumb)\s+(?:mom|mother|dad|father|parent)\b/gi
      ],
      [MessageType.CRITICISM]: [
        /you\s+(always|never)\s+\w+/gi,
        /you\s+(can't|cannot)\s+do\s+anything/gi,
        /you\s+suck\s+at/gi,
        /you're\s+(terrible|awful|bad)\s+at/gi
      ],
      [MessageType.DISAGREEMENT]: [
        /you're\s+(wrong|mistaken|incorrect)/gi,
        /that's\s+(not\s+true|false|wrong)/gi,
        /absolutely\s+not/gi,
        /no\s+way/gi
      ],
      [MessageType.FRUSTRATION]: [
        /this\s+is\s+(stupid|ridiculous|insane)/gi,
        /i\s+(hate|can't\s+stand)\s+this/gi,
        /this\s+makes\s+no\s+sense/gi,
        /what\s+the\s+(hell|fuck)/gi
      ],
      [MessageType.THREAT]: [
        /i'll\s+\w+\s+you/gi,
        /you're\s+gonna\s+pay/gi,
        /watch\s+out/gi,
        /you'll\s+regret/gi
      ],
      [MessageType.DISMISSAL]: [
        /\b(whatever|who\s+cares|so\s+what|big\s+deal)\b/gi,
        /don't\s+care/gi,
        /not\s+my\s+problem/gi
      ],
      [MessageType.EXCLUSION]: [
        /you\s+don't\s+belong/gi,
        /go\s+back\s+to/gi,
        /not\s+welcome\s+here/gi,
        /get\s+out/gi
      ]
    };
  }

  _loadEducationalMessages() {
    return {
      [MessageType.INSULT]: "Personal insults and family-related comments can be deeply hurtful. Let's communicate with respect and kindness instead.",
      [MessageType.CRITICISM]: "Constructive feedback focuses on specific behaviors rather than personal attacks or family members.",
      [MessageType.DISAGREEMENT]: "It's okay to disagree! Try expressing your different viewpoint respectfully.",
      [MessageType.FRUSTRATION]: "When frustrated, taking a moment to breathe can help you communicate more clearly.",
      [MessageType.THREAT]: "Threatening language can be harmful and is never appropriate. Consider expressing your feelings differently.",
      [MessageType.DISMISSAL]: "Everyone's thoughts and feelings matter. Try to engage more thoughtfully.",
      [MessageType.EXCLUSION]: "Including others creates a more positive environment for everyone."
    };
  }

  generateSuggestions(message, context = {}) {
    this.stats.total_processed++;

    try {
      if (!message || typeof message !== 'string') {
        return this._createEmptyResult(message || "");
      }

      // Check for benign messages
      const benignPhrases = new Set(['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'thanks', 'thank you']);
      if (benignPhrases.has(message.toLowerCase().trim())) {
        return new RephrasingResult(
          message,
          MessageType.NONE,
          [],
          "This message appears to be a normal greeting or common phrase.",
          1.0
        );
      }

      const messageType = this._identifyMessageType(message);
      const suggestions = [];

      // --- MODIFIED STRATEGY LOGIC ---

      // **Priority 1: Direct Boundary Setting for Insults**
      if (messageType === MessageType.INSULT) {
        const boundarySuggestion = this._applyDirectBoundarySetting(message, context);
        if (boundarySuggestion) {
          suggestions.push(boundarySuggestion);
        }
      }

      // Strategy 1: Soften tone (still useful)
      const softened = this._applyToneSoftening(message, context);
      if (softened) suggestions.push(softened);

      // Strategy 2: Add empathy (can be helpful)
      const empathetic = this._applyEmpathyAddition(message, context);
      if (empathetic) suggestions.push(empathetic);

      // Strategy 3: Constructive criticism (ONLY for criticism, NOT insults)
      if (messageType === MessageType.CRITICISM) {
        const constructive = this._applyConstructiveReframing(message, context);
        if (constructive) suggestions.push(constructive);
      }

      // Strategy 4: Question reframing (still useful)
      const questionBased = this._applyQuestionReframing(message, messageType, context);
      if (questionBased) suggestions.push(questionBased);

      // Strategy 5: Perspective shift (can be okay, but lower priority)
      const perspective = this._applyPerspectiveShifting(message, context);
      if (perspective) suggestions.push(perspective);

      // Strategy 6: Collaborative approach (AVOID for insults)
      if (messageType !== MessageType.INSULT) {
        const collaborative = this._applyCollaborativeApproach(message, context);
        if (collaborative) suggestions.push(collaborative);
      }

      // --- END OF MODIFICATION ---

      // Sort by appropriateness score
      suggestions.sort((a, b) => b.appropriateness_score - a.appropriateness_score);

      // Take top 3-5 suggestions
      const finalSuggestions = suggestions.slice(0, 5);

      // Get educational message
      const educationalNote = this.educationalMessages[messageType] ||
        "Consider how your message might affect others and try to communicate more positively.";

      // Calculate confidence
      const confidence = Math.min(1.0, finalSuggestions.length * 0.2 +
        (finalSuggestions.length > 0 ?
          finalSuggestions.reduce((sum, s) => sum + s.appropriateness_score, 0) / finalSuggestions.length : 0));

      this.stats.successful_rephrasings += finalSuggestions.length > 0 ? 1 : 0;

      return new RephrasingResult(
        message,
        messageType,
        finalSuggestions,
        educationalNote,
        confidence
      );

    } catch (error) {
      console.error('Error in rephrasing generation:', error);
      this.stats.error_count++;
      return this._createEmptyResult(message);
    }
  }

  _identifyMessageType(message) {
    const messageLower = message.toLowerCase();

    // Check each message type pattern
    for (const [msgType, patterns] of Object.entries(this.messagePatterns)) {
      for (const pattern of patterns) {
        if (pattern.test(messageLower)) {
          return msgType;
        }
      }
    }

    // Default categorization based on keywords
    if (/\b(stupid|idiot|moron|loser)\b/gi.test(messageLower)) {
      return MessageType.INSULT;
    } else if (/\b(always|never|can't do)\b/gi.test(messageLower)) {
      return MessageType.CRITICISM;
    } else if (/\b(wrong|incorrect|false)\b/gi.test(messageLower)) {
      return MessageType.DISAGREEMENT;
    } else if (/\b(hate|ridiculous|insane)\b/gi.test(messageLower)) {
      return MessageType.FRUSTRATION;
    } else if (/\b(whatever|who cares|so what)\b/gi.test(messageLower)) {
      return MessageType.DISMISSAL;
    }

    return MessageType.NONE;
  }

  _applyToneSoftening(message, context) {
    let softenedMessage = message;
    let changesMade = 0;

    // Apply tone softeners
    for (const [harshWord, softAlternatives] of Object.entries(this.toneSofteners)) {
      const pattern = new RegExp('\\b' + this._escapeRegex(harshWord) + '\\b', 'gi');
      if (pattern.test(softenedMessage)) {
        const replacement = softAlternatives[Math.floor(Math.random() * softAlternatives.length)];
        softenedMessage = softenedMessage.replace(pattern, replacement);
        changesMade++;
      }
    }

    if (changesMade === 0) return null;

    return new RephrasingSuggestion(
      message,
      softenedMessage,
      ReframingStrategy.SOFTEN_TONE,
      "Softened harsh language to make the message less aggressive",
      Math.min(1.0, changesMade * 0.3),
      0.8,
      true
    );
  }

  _applyEmpathyAddition(message, context) {
    const empathyPhrase = this.empathyPhrases[Math.floor(Math.random() * this.empathyPhrases.length)];

    let empatheticMessage;
    if (message.trim().endsWith('.') || message.trim().endsWith('!')) {
      empatheticMessage = `${empathyPhrase}, but ${message.toLowerCase()}`;
    } else {
      empatheticMessage = `${empathyPhrase}. ${message}`;
    }

    return new RephrasingSuggestion(
      message,
      empatheticMessage,
      ReframingStrategy.ADD_EMPATHY,
      "Added empathy to acknowledge the other person's perspective",
      0.6,
      0.7,
      true
    );
  }

  _applyConstructiveReframing(message, context) {
    const starter = this.constructiveStarters[Math.floor(Math.random() * this.constructiveStarters.length)];
    const coreIssue = this._extractCoreIssue(message);

    if (!coreIssue) return null;

    const constructiveMessage = `${starter} ${coreIssue}`;

    return new RephrasingSuggestion(
      message,
      constructiveMessage,
      ReframingStrategy.CONSTRUCTIVE_CRITICISM,
      "Reframed as constructive feedback focusing on solutions",
      0.8,
      0.9,
      true
    );
  }

  _applyQuestionReframing(message, messageType, context) {
    let questionTemplates = this.questionReframers.criticism;

    if (messageType === MessageType.DISAGREEMENT) {
      questionTemplates = this.questionReframers.disagreement;
    } else if (messageType === MessageType.FRUSTRATION) {
      questionTemplates = this.questionReframers.frustration;
    }

    if (!questionTemplates) return null;

    const template = questionTemplates[Math.floor(Math.random() * questionTemplates.length)];
    const topic = this._extractTopic(message);
    const suggestion = this._generateSuggestionFromCriticism(message);

    let questionMessage;
    if (template.includes('{suggestion}') && suggestion) {
      questionMessage = template.replace('{suggestion}', suggestion);
    } else if (template.includes('{topic}') && topic) {
      questionMessage = template.replace('{topic}', topic);
    } else {
      questionMessage = template;
    }

    return new RephrasingSuggestion(
      message,
      questionMessage,
      ReframingStrategy.QUESTION_REFRAME,
      "Reframed as a question to encourage dialogue",
      0.7,
      0.8,
      true
    );
  }

  _applyPerspectiveShifting(message, context) {
    const shifter = this.perspectiveShifters[Math.floor(Math.random() * this.perspectiveShifters.length)];
    const cleanedMessage = this._cleanMessageForPerspective(message);

    const perspectiveMessage = `${shifter}, ${cleanedMessage}`;

    return new RephrasingSuggestion(
      message,
      perspectiveMessage,
      ReframingStrategy.PERSPECTIVE_SHIFT,
      "Added perspective to show this is your viewpoint",
      0.5,
      0.7,
      true
    );
  }

  _applyCollaborativeApproach(message, context) {
    const collaborativeStarters = [
      "I prefer to communicate with",
      "I believe in using",
      "Let's focus on",
      "I'd appreciate if we could use",
      "Could we please maintain"
    ];

    const starter = collaborativeStarters[Math.floor(Math.random() * collaborativeStarters.length)];
    const goal = this._extractDesiredOutcome(message);

    const collaborativeMessage = goal ? `${starter} ${goal}` : `${starter} find a solution that works for both of us`;

    return new RephrasingSuggestion(
      message,
      collaborativeMessage,
      ReframingStrategy.COLLABORATIVE_APPROACH,
      "Reframed to encourage working together",
      0.8,
      0.9,
      false
    );
  }

  // --- NEW BOUNDARY SETTING FUNCTION ---
  _applyDirectBoundarySetting(message, context) {
    const messageLower = message.toLowerCase();

    for (const [insult, suggestions] of Object.entries(this.positiveAlternatives.insults)) {
      const pattern = new RegExp('\\b' + this._escapeRegex(insult) + '\\b', 'gi');
      if (pattern.test(messageLower)) {
        const suggestion = suggestions[Math.floor(Math.random() * suggestions.length)];

        return new RephrasingSuggestion(
          message,
          suggestion,
          ReframingStrategy.SET_BOUNDARY,
          "Replaced a direct insult with a clear and respectful boundary statement.",
          0.9, // High tone improvement
          0.95, // Very high appropriateness score
          false // Context is changed from attacking to defending
        );
      }
    }

    return null; // Return null if no specific insult keyword is found
  }
  // --- END OF NEW FUNCTION ---

  _extractCoreIssue(message) {
    const patterns = [
      /(?:stupid|dumb|bad|terrible|awful)\s+(.+)/gi,
      /you\s+(?:can't|cannot|never)\s+(.+)/gi,
      /this\s+(?:doesn't|won't|isn't)\s+(.+)/gi
    ];

    for (const pattern of patterns) {
      const match = message.toLowerCase().match(pattern);
      if (match && match[1]) {
        return `improve ${match[1].trim()}`;
      }
    }

    return "find a better approach";
  }

  _extractTopic(message) {
    const words = message.toLowerCase().split(' ');
    const filteredWords = words.filter(w =>
      !['stupid', 'dumb', 'wrong', 'terrible', 'awful', 'hate', 'you', 'your', 'this', 'that'].includes(w)
    );

    return filteredWords.length >= 2 ? filteredWords.slice(0, 3).join(' ') : "this topic";
  }

  _generateSuggestionFromCriticism(message) {
    const suggestionsMap = {
      'stupid': 'finding a clearer approach',
      'wrong': 'exploring different options',
      'bad': 'improving this',
      'terrible': 'making this better',
      'awful': 'finding a better way',
      'useless': 'making this more effective'
    };

    const messageLower = message.toLowerCase();
    for (const [negativeWord, suggestion] of Object.entries(suggestionsMap)) {
      if (messageLower.includes(negativeWord)) {
        return suggestion;
      }
    }

    return "working on this together";
  }

  _cleanMessageForPerspective(message) {
    let cleaned = message;

    for (const [harshWord, alternatives] of Object.entries(this.toneSofteners)) {
      const pattern = new RegExp('\\b' + this._escapeRegex(harshWord) + '\\b', 'gi');
      if (pattern.test(cleaned)) {
        cleaned = cleaned.replace(pattern, alternatives[0]);
      }
    }

    return cleaned.toLowerCase();
  }

  _extractDesiredOutcome(message) {
    const outcomePatterns = [
      /want\s+(.+)/gi,
      /need\s+(.+)/gi,
      /should\s+(.+)/gi,
      /have\s+to\s+(.+)/gi
    ];

    for (const pattern of outcomePatterns) {
      const match = message.toLowerCase().match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return null;
  }

  _escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  _createEmptyResult(original) {
    return new RephrasingResult(
      original,
      MessageType.CRITICISM,
      [],
      "No suggestions available for this message.",
      0.0
    );
  }

  getSuggestionForEmotion(emotion, message) {
    const emotionStrategies = {
      'anger': ReframingStrategy.SOFTEN_TONE,
      'frustration': ReframingStrategy.CONSTRUCTIVE_CRITICISM,
      'sadness': ReframingStrategy.ADD_EMPATHY,
      'dismissive': ReframingStrategy.ACKNOWLEDGE_FEELINGS,
      'aggressive': ReframingStrategy.COLLABORATIVE_APPROACH
    };

    if (!(emotion in emotionStrategies)) return null;

    const strategy = emotionStrategies[emotion];

    switch (strategy) {
      case ReframingStrategy.SOFTEN_TONE:
        return this._applyToneSoftening(message, {});
      case ReframingStrategy.ADD_EMPATHY:
        return this._applyEmpathyAddition(message, {});
      case ReframingStrategy.CONSTRUCTIVE_CRITICISM:
        return this._applyConstructiveReframing(message, {});
      case ReframingStrategy.COLLABORATIVE_APPROACH:
        return this._applyCollaborativeApproach(message, {});
      default:
        return null;
    }
  }

  batchGenerateSuggestions(messages, contexts = null) {
    if (!contexts) {
      contexts = new Array(messages.length).fill({});
    }

    const results = [];
    for (let i = 0; i < messages.length; i++) {
      try {
        const result = this.generateSuggestions(messages[i], contexts[i]);
        results.push(result);
      } catch (error) {
        console.error(`Error generating suggestions for '${messages[i].substring(0, 50)}...':`, error);
        results.push(this._createEmptyResult(messages[i]));
      }
    }

    return results;
  }

  getRephrasingStatistics(results) {
    if (!results || results.length === 0) return {};

    const totalResults = results.length;
    const successfulRephrasings = results.filter(r => r.suggestions && r.suggestions.length > 0).length;

    // Message type distribution
    const messageTypes = results.map(r => r.message_type);
    const typeDistribution = {};
    messageTypes.forEach(type => {
      typeDistribution[type] = (typeDistribution[type] || 0) + 1;
    });

    // Strategy usage
    const strategiesUsed = [];
    results.forEach(result => {
      if (result.suggestions) {
        result.suggestions.forEach(suggestion => {
          strategiesUsed.push(suggestion.strategy_used);
        });
      }
    });

    const strategyDistribution = {};
    strategiesUsed.forEach(strategy => {
      strategyDistribution[strategy] = (strategyDistribution[strategy] || 0) + 1;
    });

    // Average scores
    const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / totalResults;

    const toneImprovements = [];
    const appropriatenessScores = [];
    results.forEach(result => {
      if (result.suggestions) {
        result.suggestions.forEach(suggestion => {
          toneImprovements.push(suggestion.tone_improvement);
          appropriatenessScores.push(suggestion.appropriateness_score);
        });
      }
    });

    const avgToneImprovement = toneImprovements.length > 0 ?
      toneImprovements.reduce((sum, t) => sum + t, 0) / toneImprovements.length : 0;
    const avgAppropriateness = appropriatenessScores.length > 0 ?
      appropriatenessScores.reduce((sum, a) => sum + a, 0) / appropriatenessScores.length : 0;

    return {
      total_processed: totalResults,
      successful_rephrasings: successfulRephrasings,
      success_rate: successfulRephrasings / totalResults,
      message_type_distribution: typeDistribution,
      strategy_usage: strategyDistribution,
      average_confidence: Math.round(avgConfidence * 1000) / 1000,
      average_tone_improvement: Math.round(avgToneImprovement * 1000) / 1000,
      average_appropriateness_score: Math.round(avgAppropriateness * 1000) / 1000
    };
  }

  getStats() {
    return {
      total_processed: this.stats.total_processed,
      successful_rephrasings: this.stats.successful_rephrasings,
      strategy_usage: this.stats.strategy_usage,
      error_count: this.stats.error_count,
      success_rate: this.stats.total_processed > 0 ?
        Math.round((this.stats.successful_rephrasings / this.stats.total_processed) * 100) / 100 : 0
    };
  }

  resetStats() {
    this.stats = {
      total_processed: 0,
      successful_rephrasings: 0,
      strategy_usage: {},
      error_count: 0
    };
  }
}

module.exports = {
  RephrasingEngine,
  RephrasingSuggestion,
  RephrasingResult,
  ReframingStrategy,
  MessageType
};
