"""
rephrasing_engine.py
Intelligent rephrasing engine for TypeAware
Generates positive, constructive alternatives to potentially harmful messages
"""

import re
import random
from typing import Dict, List, Tuple, Optional, Set
from dataclasses import dataclass
from collections import defaultdict
from enum import Enum
import logging

logger = logging.getLogger(__name__)

class ReframingStrategy(Enum):
    """Different strategies for reframing content"""
    SOFTEN_TONE = "soften_tone"
    ADD_EMPATHY = "add_empathy"
    CONSTRUCTIVE_CRITICISM = "constructive_criticism"
    QUESTION_REFRAME = "question_reframe"
    POSITIVE_SUGGESTION = "positive_suggestion"
    PERSPECTIVE_SHIFT = "perspective_shift"
    COLLABORATIVE_APPROACH = "collaborative_approach"
    ACKNOWLEDGE_FEELINGS = "acknowledge_feelings"

class MessageType(Enum):
    """Types of problematic messages"""
    INSULT = "insult"
    CRITICISM = "criticism"
    DISAGREEMENT = "disagreement"
    FRUSTRATION = "frustration"
    THREAT = "threat"
    DISMISSAL = "dismissal"
    SARCASM = "sarcasm"
    EXCLUSION = "exclusion"

@dataclass
class RephrasingSuggestion:
    """A single rephrasing suggestion"""
    original_text: str
    suggested_text: str
    strategy_used: ReframingStrategy
    explanation: str
    tone_improvement: float  # 0.0 to 1.0
    appropriateness_score: float  # 0.0 to 1.0
    context_preserved: bool

@dataclass
class RephrasingResult:
    """Complete rephrasing result with multiple suggestions"""
    original_message: str
    message_type: MessageType
    suggestions: List[RephrasingSuggestion]
    educational_note: str
    confidence: float

class RephrasingEngine:
    """
    Intelligent engine for generating positive rephrasing suggestions
    Uses multiple strategies to transform harmful content into constructive communication
    """
    
    def __init__(self):
        self.tone_softeners = self._load_tone_softeners()
        self.empathy_phrases = self._load_empathy_phrases()
        self.constructive_starters = self._load_constructive_starters()
        self.question_reframes = self._load_question_reframes()
        self.positive_alternatives = self._load_positive_alternatives()
        self.perspective_shifters = self._load_perspective_shifters()
        
        # Pattern matching for different message types
        self.message_patterns = self._load_message_patterns()
        
        # Educational content
        self.educational_messages = self._load_educational_messages()
        
        logger.info("RephrasingEngine initialized")

    def _load_tone_softeners(self) -> Dict[str, List[str]]:
        """Load tone softening replacements"""
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
        }

    def _load_empathy_phrases(self) -> List[str]:
        """Load empathy-building phrases"""
        return [
            "I understand this might be frustrating",
            "I can see why you might feel that way",
            "I appreciate your perspective",
            "I recognize this is important to you",
            "I hear what you're saying",
            "I can imagine how you feel",
            "Your feelings are valid",
            "I understand your point of view",
            "This seems important to you",
            "I can see this matters to you"
        ]

    def _load_constructive_starters(self) -> List[str]:
        """Load constructive conversation starters"""
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
        ]

    def _load_question_reframes(self) -> Dict[str, List[str]]:
        """Load question-based reframing templates"""
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
        }

    def _load_positive_alternatives(self) -> Dict[str, List[str]]:
        """Load positive alternative phrasings"""
        return {
            'insults': {
                'stupid': ['unclear', 'confusing', 'hard to follow'],
                'dumb': ['not clear', 'confusing', 'unclear'],
                'idiot': ['person', 'individual', 'someone'],
                'moron': ['person', 'individual', 'someone'],
                'loser': ['person having difficulties', 'someone struggling'],
                'pathetic': ['concerning', 'disappointing', 'unfortunate'],
                'worthless': ['not helpful', 'not effective', 'not working well']
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
        }

    def _load_perspective_shifters(self) -> List[str]:
        """Load perspective-shifting phrases"""
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
        ]

    def _load_message_patterns(self) -> Dict[MessageType, List[str]]:
        """Load patterns for identifying message types"""
        return {
            MessageType.INSULT: [
                r'\b(stupid|dumb|idiot|moron|loser|pathetic|worthless)\b',
                r'you\s+(are|\'re)\s+(so\s+)?(stupid|dumb|pathetic)',
                r'what\s+an?\s+(idiot|moron|loser)'
            ],
            MessageType.CRITICISM: [
                r'you\s+(always|never)\s+\w+',
                r'you\s+(can\'t|cannot)\s+do\s+anything',
                r'you\s+suck\s+at',
                r'you\'re\s+(terrible|awful|bad)\s+at'
            ],
            MessageType.DISAGREEMENT: [
                r'you\'re\s+(wrong|mistaken|incorrect)',
                r'that\'s\s+(not\s+true|false|wrong)',
                r'absolutely\s+not',
                r'no\s+way'
            ],
            MessageType.FRUSTRATION: [
                r'this\s+is\s+(stupid|ridiculous|insane)',
                r'i\s+(hate|can\'t\s+stand)\s+this',
                r'this\s+makes\s+no\s+sense',
                r'what\s+the\s+(hell|fuck)'
            ],
            MessageType.THREAT: [
                r'i\'ll\s+\w+\s+you',
                r'you\'re\s+gonna\s+pay',
                r'watch\s+out',
                r'you\'ll\s+regret'
            ],
            MessageType.DISMISSAL: [
                r'\b(whatever|who\s+cares|so\s+what|big\s+deal)\b',
                r'don\'t\s+care',
                r'not\s+my\s+problem'
            ],
            MessageType.EXCLUSION: [
                r'you\s+don\'t\s+belong',
                r'go\s+back\s+to',
                r'not\s+welcome\s+here',
                r'get\s+out'
            ]
        }

    def _load_educational_messages(self) -> Dict[MessageType, str]:
        """Load educational messages for different types"""
        return {
            MessageType.INSULT: "Remember that everyone has feelings. Try to express your thoughts without putting someone down.",
            MessageType.CRITICISM: "Constructive feedback focuses on specific behaviors rather than personal attacks.",
            MessageType.DISAGREEMENT: "It's okay to disagree! Try expressing your different viewpoint respectfully.",
            MessageType.FRUSTRATION: "When frustrated, taking a moment to breathe can help you communicate more clearly.",
            MessageType.THREAT: "Threatening language can be harmful and is never appropriate. Consider expressing your feelings differently.",
            MessageType.DISMISSAL: "Everyone's thoughts and feelings matter. Try to engage more thoughtfully.",
            MessageType.EXCLUSION: "Including others creates a more positive environment for everyone."
        }

    def generate_suggestions(self, message: str, context: Dict = None) -> RephrasingResult:
        """
        Generate rephrasing suggestions for a message
        
        Args:
            message: Original message to rephrase
            context: Additional context for better suggestions
            
        Returns:
            RephrasingResult with multiple suggestions
        """
        if not message or not isinstance(message, str):
            return self._create_empty_result(message or "")
        
        context = context or {}
        
        # Identify message type
        message_type = self._identify_message_type(message)
        
        # Generate suggestions using different strategies
        suggestions = []
        
        # Strategy 1: Soften tone
        softened = self._apply_tone_softening(message, context)
        if softened:
            suggestions.append(softened)
        
        # Strategy 2: Add empathy
        empathetic = self._apply_empathy_addition(message, context)
        if empathetic:
            suggestions.append(empathetic)
        
        # Strategy 3: Constructive criticism
        if message_type in [MessageType.CRITICISM, MessageType.INSULT]:
            constructive = self._apply_constructive_reframing(message, context)
            if constructive:
                suggestions.append(constructive)
        
        # Strategy 4: Question reframing
        question_based = self._apply_question_reframing(message, message_type, context)
        if question_based:
            suggestions.append(question_based)
        
        # Strategy 5: Perspective shift
        perspective = self._apply_perspective_shifting(message, context)
        if perspective:
            suggestions.append(perspective)
        
        # Strategy 6: Collaborative approach
        collaborative = self._apply_collaborative_approach(message, context)
        if collaborative:
            suggestions.append(collaborative)
        
        # Sort suggestions by appropriateness score
        suggestions.sort(key=lambda x: x.appropriateness_score, reverse=True)
        
        # Take top 3-5 suggestions
        final_suggestions = suggestions[:5] if suggestions else []
        
        # Get educational message
        educational_note = self.educational_messages.get(message_type, 
            "Consider how your message might affect others and try to communicate more positively.")
        
        # Calculate confidence based on number and quality of suggestions
        confidence = min(1.0, len(final_suggestions) * 0.2 + 
                        (sum(s.appropriateness_score for s in final_suggestions) / len(final_suggestions) if final_suggestions else 0))
        
        return RephrasingResult(
            original_message=message,
            message_type=message_type,
            suggestions=final_suggestions,
            educational_note=educational_note,
            confidence=confidence
        )

    def _identify_message_type(self, message: str) -> MessageType:
        """Identify the type of problematic message"""
        message_lower = message.lower()
        
        # Check each message type pattern
        for msg_type, patterns in self.message_patterns.items():
            for pattern in patterns:
                if re.search(pattern, message_lower):
                    return msg_type
        
        # Default categorization based on keywords
        if any(word in message_lower for word in ['stupid', 'idiot', 'moron', 'loser']):
            return MessageType.INSULT
        elif any(word in message_lower for word in ['always', 'never', 'can\'t do']):
            return MessageType.CRITICISM
        elif any(word in message_lower for word in ['wrong', 'incorrect', 'false']):
            return MessageType.DISAGREEMENT
        elif any(word in message_lower for word in ['hate', 'ridiculous', 'insane']):
            return MessageType.FRUSTRATION
        elif any(word in message_lower for word in ['whatever', 'who cares', 'so what']):
            return MessageType.DISMISSAL
        else:
            return MessageType.CRITICISM  # Default

    def _apply_tone_softening(self, message: str, context: Dict) -> Optional[RephrasingSuggestion]:
        """Apply tone softening strategy"""
        softened_message = message
        changes_made = 0
        
        # Apply tone softeners
        for harsh_word, soft_alternatives in self.tone_softeners.items():
            pattern = re.compile(r'\b' + re.escape(harsh_word) + r'\b', re.IGNORECASE)
            if pattern.search(softened_message):
                replacement = random.choice(soft_alternatives)
                softened_message = pattern.sub(replacement, softened_message)
                changes_made += 1
        
        if changes_made == 0:
            return None
        
        return RephrasingSuggestion(
            original_text=message,
            suggested_text=softened_message,
            strategy_used=ReframingStrategy.SOFTEN_TONE,
            explanation="Softened harsh language to make the message less aggressive",
            tone_improvement=min(1.0, changes_made * 0.3),
            appropriateness_score=0.8,
            context_preserved=True
        )

    def _apply_empathy_addition(self, message: str, context: Dict) -> Optional[RephrasingSuggestion]:
        """Add empathy to the message"""
        empathy_phrase = random.choice(self.empathy_phrases)
        
        # Try to integrate empathy naturally
        if message.strip().endswith('.') or message.strip().endswith('!'):
            empathetic_message = f"{empathy_phrase}, but {message.lower()}"
        else:
            empathetic_message = f"{empathy_phrase}. {message}"
        
        return RephrasingSuggestion(
            original_text=message,
            suggested_text=empathetic_message,
            strategy_used=ReframingStrategy.ADD_EMPATHY,
            explanation="Added empathy to acknowledge the other person's perspective",
            tone_improvement=0.6,
            appropriateness_score=0.7,
            context_preserved=True
        )

    def _apply_constructive_reframing(self, message: str, context: Dict) -> Optional[RephrasingSuggestion]:
        """Reframe as constructive feedback"""
        starter = random.choice(self.constructive_starters)
        
        # Extract the core issue from the message
        core_issue = self._extract_core_issue(message)
        if not core_issue:
            return None
        
        constructive_message = f"{starter} {core_issue}"
        
        return RephrasingSuggestion(
            original_text=message,
            suggested_text=constructive_message,
            strategy_used=ReframingStrategy.CONSTRUCTIVE_CRITICISM,
            explanation="Reframed as constructive feedback focusing on solutions",
            tone_improvement=0.8,
            appropriateness_score=0.9,
            context_preserved=True
        )

    def _apply_question_reframing(self, message: str, message_type: MessageType, 
                                 context: Dict) -> Optional[RephrasingSuggestion]:
        """Reframe as a question"""
        question_templates = self.question_reframes.get('criticism', [])
        
        if message_type == MessageType.DISAGREEMENT:
            question_templates = self.question_reframes.get('disagreement', [])
        elif message_type == MessageType.FRUSTRATION:
            question_templates = self.question_reframes.get('frustration', [])
        
        if not question_templates:
            return None
        
        template = random.choice(question_templates)
        
        # Extract topic or suggestion from original message
        topic = self._extract_topic(message)
        suggestion = self._generate_suggestion_from_criticism(message)
        
        if '{suggestion}' in template and suggestion:
            question_message = template.format(suggestion=suggestion)
        elif '{topic}' in template and topic:
            question_message = template.format(topic=topic)
        else:
            question_message = template
        
        return RephrasingSuggestion(
            original_text=message,
            suggested_text=question_message,
            strategy_used=ReframingStrategy.QUESTION_REFRAME,
            explanation="Reframed as a question to encourage dialogue",
            tone_improvement=0.7,
            appropriateness_score=0.8,
            context_preserved=True
        )

    def _apply_perspective_shifting(self, message: str, context: Dict) -> Optional[RephrasingSuggestion]:
        """Apply perspective shifting"""
        shifter = random.choice(self.perspective_shifters)
        
        # Clean up the original message
        cleaned_message = self._clean_message_for_perspective(message)
        
        perspective_message = f"{shifter}, {cleaned_message}"
        
        return RephrasingSuggestion(
            original_text=message,
            suggested_text=perspective_message,
            strategy_used=ReframingStrategy.PERSPECTIVE_SHIFT,
            explanation="Added perspective to show this is your viewpoint",
            tone_improvement=0.5,
            appropriateness_score=0.7,
            context_preserved=True
        )

    def _apply_collaborative_approach(self, message: str, context: Dict) -> Optional[RephrasingSuggestion]:
        """Apply collaborative approach"""
        collaborative_starters = [
            "Let's work together to",
            "How can we",
            "What if we both",
            "Maybe we can figure out",
            "Let's try to understand"
        ]
        
        starter = random.choice(collaborative_starters)
        goal = self._extract_desired_outcome(message)
        
        if goal:
            collaborative_message = f"{starter} {goal}"
        else:
            collaborative_message = f"{starter} find a solution that works for both of us"
        
        return RephrasingSuggestion(
            original_text=message,
            suggested_text=collaborative_message,
            strategy_used=ReframingStrategy.COLLABORATIVE_APPROACH,
            explanation="Reframed to encourage working together",
            tone_improvement=0.8,
            appropriateness_score=0.9,
            context_preserved=False  # This changes the message significantly
        )

    def _extract_core_issue(self, message: str) -> Optional[str]:
        """Extract the core issue from a critical message"""
        # Simple extraction - look for what comes after negative words
        patterns = [
            r'(?:stupid|dumb|bad|terrible|awful)\s+(.+)',
            r'you\s+(?:can\'t|cannot|never)\s+(.+)',
            r'this\s+(?:doesn\'t|won\'t|isn\'t)\s+(.+)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, message.lower())
            if match:
                return f"improve {match.group(1).strip()}"
        
        return "find a better approach"

    def _extract_topic(self, message: str) -> Optional[str]:
        """Extract the main topic from a message"""
        # Simple topic extraction
        words = message.lower().split()
        
        # Remove common negative words to find the topic
        filtered_words = [w for w in words if w not in 
                         ['stupid', 'dumb', 'wrong', 'terrible', 'awful', 'hate', 'you', 'your', 'this', 'that']]
        
        if len(filtered_words) >= 2:
            return ' '.join(filtered_words[:3])  # Take first few relevant words
        
        return "this topic"

    def _generate_suggestion_from_criticism(self, message: str) -> Optional[str]:
        """Generate a constructive suggestion from criticism"""
        suggestions_map = {
            'stupid': 'finding a clearer approach',
            'wrong': 'exploring different options',
            'bad': 'improving this',
            'terrible': 'making this better',
            'awful': 'finding a better way',
            'useless': 'making this more effective'
        }
        
        for negative_word, suggestion in suggestions_map.items():
            if negative_word in message.lower():
                return suggestion
        
        return "working on this together"

    def _clean_message_for_perspective(self, message: str) -> str:
        """Clean message to work with perspective shifting"""
        # Remove harsh words and make it more neutral
        cleaned = message
        
        for harsh_word, alternatives in self.tone_softeners.items():
            pattern = re.compile(r'\b' + re.escape(harsh_word) + r'\b', re.IGNORECASE)
            if pattern.search(cleaned):
                replacement = alternatives[0]  # Use first alternative
                cleaned = pattern.sub(replacement, cleaned)
        
        return cleaned.lower()

    def _extract_desired_outcome(self, message: str) -> Optional[str]:
        """Extract what the person might want to achieve"""
        outcome_patterns = [
            r'want\s+(.+)',
            r'need\s+(.+)',
            r'should\s+(.+)',
            r'have\s+to\s+(.+)'
        ]
        
        for pattern in outcome_patterns:
            match = re.search(pattern, message.lower())
            if match:
                return match.group(1).strip()
        
        return "solve this issue"

    def _create_empty_result(self, original: str) -> RephrasingResult:
        """Create empty rephrasing result"""
        return RephrasingResult(
            original_message=original,
            message_type=MessageType.CRITICISM,
            suggestions=[],
            educational_note="No suggestions available for this message.",
            confidence=0.0
        )

    def get_suggestion_for_emotion(self, emotion: str, message: str) -> Optional[RephrasingSuggestion]:
        """Get specific suggestion based on detected emotion"""
        emotion_strategies = {
            'anger': ReframingStrategy.SOFTEN_TONE,
            'frustration': ReframingStrategy.CONSTRUCTIVE_CRITICISM,
            'sadness': ReframingStrategy.ADD_EMPATHY,
            'dismissive': ReframingStrategy.ACKNOWLEDGE_FEELINGS,
            'aggressive': ReframingStrategy.COLLABORATIVE_APPROACH
        }
        
        if emotion not in emotion_strategies:
            return None
        
        strategy = emotion_strategies[emotion]
        
        if strategy == ReframingStrategy.SOFTEN_TONE:
            return self._apply_tone_softening(message, {})
        elif strategy == ReframingStrategy.ADD_EMPATHY:
            return self._apply_empathy_addition(message, {})
        elif strategy == ReframingStrategy.CONSTRUCTIVE_CRITICISM:
            return self._apply_constructive_reframing(message, {})
        elif strategy == ReframingStrategy.COLLABORATIVE_APPROACH:
            return self._apply_collaborative_approach(message, {})
        
        return None

    def batch_generate_suggestions(self, messages: List[str], 
                                  contexts: List[Dict] = None) -> List[RephrasingResult]:
        """Generate suggestions for multiple messages"""
        if contexts is None:
            contexts = [{}] * len(messages)
        
        results = []
        for message, context in zip(messages, contexts):
            try:
                result = self.generate_suggestions(message, context)
                results.append(result)
            except Exception as e:
                logger.error(f"Error generating suggestions for '{message[:50]}...': {e}")
                results.append(self._create_empty_result(message))
        
        return results

    def get_rephrasing_statistics(self, results: List[RephrasingResult]) -> Dict[str, any]:
        """Get statistics about rephrasing results"""
        if not results:
            return {}
        
        total_results = len(results)
        successful_rephrasings = sum(1 for r in results if r.suggestions)
        
        # Message type distribution
        message_types = [r.message_type.value for r in results]
        from collections import Counter
        type_distribution = dict(Counter(message_types))
        
        # Strategy usage
        strategies_used = []
        for result in results:
            for suggestion in result.suggestions:
                strategies_used.append(suggestion.strategy_used.value)
        
        strategy_distribution = dict(Counter(strategies_used))
        
        # Average scores
        avg_confidence = sum(r.confidence for r in results) / total_results
        
        tone_improvements = []
        appropriateness_scores = []
        for result in results:
            for suggestion in result.suggestions:
                tone_improvements.append(suggestion.tone_improvement)
                appropriateness_scores.append(suggestion.appropriateness_score)
        
        avg_tone_improvement = sum(tone_improvements) / len(tone_improvements) if tone_improvements else 0
        avg_appropriateness = sum(appropriateness_scores) / len(appropriateness_scores) if appropriateness_scores else 0
        
        return {
            'total_processed': total_results,
            'successful_rephrasings': successful_rephrasings,
            'success_rate': successful_rephrasings / total_results,
            'message_type_distribution': type_distribution,
            'strategy_usage': strategy_distribution,
            'average_confidence': round(avg_confidence, 3),
            'average_tone_improvement': round(avg_tone_improvement, 3),
            'average_appropriateness_score': round(avg_appropriateness, 3)
        }