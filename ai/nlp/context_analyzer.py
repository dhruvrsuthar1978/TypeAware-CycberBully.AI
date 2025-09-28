"""
context_analyzer.py
Advanced context analysis for TypeAware
Analyzes conversational context, intent, and situational factors for better detection
"""

import re
import time
from typing import Dict, List, Tuple, Optional, Set, Any
from dataclasses import dataclass, field
from collections import defaultdict, deque
from enum import Enum
import logging

logger = logging.getLogger(__name__)

class IntentType(Enum):
    """Types of communication intent"""
    GENUINE_CRITICISM = "genuine_criticism"
    CONSTRUCTIVE_FEEDBACK = "constructive_feedback"
    PLAYFUL_BANTER = "playful_banter"
    SARCASTIC_HUMOR = "sarcastic_humor"
    AGGRESSIVE_ATTACK = "aggressive_attack"
    PASSIVE_AGGRESSIVE = "passive_aggressive"
    THREATENING = "threatening"
    HARASSMENT = "harassment"
    SUPPORTIVE = "supportive"
    INFORMATIONAL = "informational"
    UNKNOWN = "unknown"

class ContextualClue(Enum):
    """Types of contextual clues"""
    RELATIONSHIP_HISTORY = "relationship_history"
    CONVERSATION_TOPIC = "conversation_topic"
    PLATFORM_NORMS = "platform_norms"
    TIME_CONTEXT = "time_context"
    GROUP_DYNAMICS = "group_dynamics"
    CULTURAL_CONTEXT = "cultural_context"
    EMOTIONAL_STATE = "emotional_state"

@dataclass
class ConversationContext:
    """Context information about a conversation"""
    conversation_id: str
    participants: Set[str] = field(default_factory=set)
    topic: Optional[str] = None
    platform: Optional[str] = None
    start_time: float = 0.0
    last_activity: float = 0.0
    message_count: int = 0
    relationship_type: Optional[str] = None
    group_type: Optional[str] = None

@dataclass
class ContextualAnalysisResult:
    """Result of contextual analysis"""
    intent: IntentType
    confidence: float
    context_clues: Dict[ContextualClue, float]
    situational_factors: List[str]
    relationship_indicators: List[str]
    risk_modifiers: Dict[str, float]
    explanation: str

class ContextAnalyzer:
    """
    Advanced context analyzer for understanding communication intent
    and situational factors that affect cyberbullying detection
    """
    
    def __init__(self):
        self.conversation_contexts = {}  # conversation_id -> ConversationContext
        self.user_relationships = defaultdict(dict)  # user_id -> {target_id: relationship_info}
        self.platform_norms = self._initialize_platform_norms()
        self.intent_patterns = self._initialize_intent_patterns()
        self.relationship_indicators = self._initialize_relationship_indicators()
        self.cultural_markers = self._initialize_cultural_markers()
        
        # Message history for context analysis
        self.message_history = defaultdict(lambda: deque(maxlen=50))
        
        logger.info("ContextAnalyzer initialized")

    def _initialize_platform_norms(self) -> Dict[str, Dict]:
        """Initialize platform-specific communication norms"""
        return {
            'twitter': {
                'character_limit': 280,
                'typical_tone': 'casual',
                'common_behaviors': ['short_messages', 'hashtags', 'mentions'],
                'tolerance_level': 0.6,  # Lower tolerance for aggressive content
                'context_importance': 0.8
            },
            'instagram': {
                'character_limit': 2200,
                'typical_tone': 'positive',
                'common_behaviors': ['visual_focus', 'hashtags', 'emojis'],
                'tolerance_level': 0.4,  # High sensitivity to negativity
                'context_importance': 0.7
            },
            'facebook': {
                'character_limit': 63206,
                'typical_tone': 'personal',
                'common_behaviors': ['long_posts', 'family_sharing', 'reactions'],
                'tolerance_level': 0.5,
                'context_importance': 0.9  # High context importance
            },
            'discord': {
                'character_limit': 2000,
                'typical_tone': 'informal',
                'common_behaviors': ['gaming_slang', 'emojis', 'quick_responses'],
                'tolerance_level': 0.7,  # More tolerant of casual aggression
                'context_importance': 0.8
            },
            'reddit': {
                'character_limit': 40000,
                'typical_tone': 'discussion',
                'common_behaviors': ['long_comments', 'debates', 'voting'],
                'tolerance_level': 0.6,
                'context_importance': 0.9
            },
            'tiktok': {
                'character_limit': 150,
                'typical_tone': 'trendy',
                'common_behaviors': ['short_comments', 'slang', 'reactions'],
                'tolerance_level': 0.5,
                'context_importance': 0.6
            },
            'youtube': {
                'character_limit': 10000,
                'typical_tone': 'casual',
                'common_behaviors': ['video_references', 'timestamps', 'reactions'],
                'tolerance_level': 0.6,
                'context_importance': 0.7
            }
        }

    def _initialize_intent_patterns(self) -> Dict[IntentType, Dict]:
        """Initialize patterns for detecting communication intent"""
        return {
            IntentType.GENUINE_CRITICISM: {
                'patterns': [
                    r'i\s+think\s+you\s+could',
                    r'maybe\s+consider',
                    r'have\s+you\s+thought\s+about',
                    r'constructive\s+feedback',
                    r'respectfully\s+disagree'
                ],
                'keywords': ['improve', 'suggestion', 'feedback', 'constructive'],
                'tone_indicators': ['polite', 'respectful', 'thoughtful']
            },
            
            IntentType.CONSTRUCTIVE_FEEDBACK: {
                'patterns': [
                    r'you\s+might\s+want\s+to',
                    r'here\'s\s+how\s+you\s+can',
                    r'try\s+doing',
                    r'next\s+time\s+maybe',
                    r'my\s+advice\s+would\s+be'
                ],
                'keywords': ['advice', 'help', 'improve', 'better', 'suggestion'],
                'tone_indicators': ['helpful', 'supportive', 'educational']
            },
            
            IntentType.PLAYFUL_BANTER: {
                'patterns': [
                    r'just\s+kidding',
                    r'haha\s+jk',
                    r'lol\s+just\s+messing',
                    r'you\s+know\s+i\'m\s+joking',
                    r'teasing\s+you'
                ],
                'keywords': ['kidding', 'joking', 'teasing', 'fun', 'lol', 'haha'],
                'tone_indicators': ['playful', 'friendly', 'humorous']
            },
            
            IntentType.SARCASTIC_HUMOR: {
                'patterns': [
                    r'oh\s+great',
                    r'well\s+done',
                    r'congratulations',
                    r'brilliant\s+idea',
                    r'genius\s+move'
                ],
                'keywords': ['obviously', 'clearly', 'sure', 'right'],
                'tone_indicators': ['sarcastic', 'ironic', 'mocking']
            },
            
            IntentType.AGGRESSIVE_ATTACK: {
                'patterns': [
                    r'you\'re\s+an\s+idiot',
                    r'shut\s+up',
                    r'you\s+suck',
                    r'go\s+to\s+hell',
                    r'i\s+hate\s+you'
                ],
                'keywords': ['idiot', 'stupid', 'hate', 'suck', 'pathetic'],
                'tone_indicators': ['hostile', 'aggressive', 'attacking']
            },
            
            IntentType.THREATENING: {
                'patterns': [
                    r'i\'ll\s+get\s+you',
                    r'you\'re\s+gonna\s+pay',
                    r'watch\s+your\s+back',
                    r'meet\s+me\s+outside',
                    r'you\'re\s+dead'
                ],
                'keywords': ['threat', 'hurt', 'kill', 'destroy', 'revenge'],
                'tone_indicators': ['threatening', 'menacing', 'dangerous']
            }
        }

    def _initialize_relationship_indicators(self) -> Dict[str, List[str]]:
        """Initialize indicators of different relationship types"""
        return {
            'friends': [
                'dude', 'buddy', 'bro', 'mate', 'bestie', 'pal',
                'my friend', 'hey friend', 'babe', 'hun'
            ],
            'family': [
                'mom', 'dad', 'sister', 'brother', 'cousin', 'aunt',
                'uncle', 'grandma', 'grandpa', 'family'
            ],
            'romantic': [
                'babe', 'honey', 'sweetheart', 'darling', 'love',
                'boyfriend', 'girlfriend', 'partner'
            ],
            'professional': [
                'colleague', 'coworker', 'boss', 'manager', 'team',
                'professional', 'workplace', 'office'
            ],
            'strangers': [
                'person', 'individual', 'someone', 'user', 'account'
            ],
            'adversarial': [
                'enemy', 'opponent', 'rival', 'hater', 'troll'
            ]
        }

    def _initialize_cultural_markers(self) -> Dict[str, List[str]]:
        """Initialize cultural and demographic markers"""
        return {
            'age_young': [
                'bruh', 'fr', 'no cap', 'periodt', 'slay', 'stan',
                'ship', 'sus', 'bet', 'facts', 'lowkey', 'highkey'
            ],
            'age_older': [
                'dear', 'honey', 'sweetie', 'young man', 'young lady',
                'back in my day', 'when i was your age'
            ],
            'gaming_culture': [
                'noob', 'pwn', 'rekt', 'gg', 'ez', 'git gud',
                'camping', 'griefing', 'toxic', 'tryhard'
            ],
            'academic': [
                'thesis', 'research', 'study', 'academic', 'scholar',
                'peer review', 'methodology', 'hypothesis'
            ],
            'casual_internet': [
                'lol', 'omg', 'wtf', 'tbh', 'imo', 'btw',
                'fyi', 'rofl', 'lmao', 'smh'
            ]
        }

    def analyze_context(self, message: str, context: Dict[str, Any]) -> ContextualAnalysisResult:
        """
        Analyze the context of a message to understand intent and situational factors
        
        Args:
            message: The message content
            context: Context information (user_id, target_id, conversation_id, etc.)
            
        Returns:
            ContextualAnalysisResult with detailed analysis
        """
        if not message or not isinstance(message, str):
            return self._create_empty_result()
        
        # Extract context information
        user_id = context.get('user_id', 'unknown')
        target_id = context.get('target_id')
        conversation_id = context.get('conversation_id', f"{user_id}_{target_id}")
        platform = context.get('platform', 'unknown')
        timestamp = context.get('timestamp', time.time())
        
        # Update conversation context
        self._update_conversation_context(conversation_id, user_id, target_id, platform, timestamp)
        
        # Store message in history
        self.message_history[conversation_id].append({
            'message': message,
            'user_id': user_id,
            'timestamp': timestamp,
            'context': context
        })
        
        # Analyze intent
        intent, intent_confidence = self._analyze_intent(message, context)
        
        # Analyze contextual clues
        context_clues = self._analyze_contextual_clues(message, context, conversation_id)
        
        # Analyze relationship indicators
        relationship_indicators = self._analyze_relationship_indicators(message, user_id, target_id)
        
        # Calculate risk modifiers based on context
        risk_modifiers = self._calculate_risk_modifiers(context, intent, context_clues)
        
        # Generate situational factors
        situational_factors = self._identify_situational_factors(context, conversation_id)
        
        # Generate explanation
        explanation = self._generate_explanation(intent, context_clues, relationship_indicators)
        
        return ContextualAnalysisResult(
            intent=intent,
            confidence=intent_confidence,
            context_clues=context_clues,
            situational_factors=situational_factors,
            relationship_indicators=relationship_indicators,
            risk_modifiers=risk_modifiers,
            explanation=explanation
        )

    def _update_conversation_context(self, conversation_id: str, user_id: str, 
                                   target_id: Optional[str], platform: str, timestamp: float) -> None:
        """Update conversation context information"""
        if conversation_id not in self.conversation_contexts:
            self.conversation_contexts[conversation_id] = ConversationContext(
                conversation_id=conversation_id,
                platform=platform,
                start_time=timestamp
            )
        
        context = self.conversation_contexts[conversation_id]
        context.participants.add(user_id)
        if target_id:
            context.participants.add(target_id)
        context.last_activity = timestamp
        context.message_count += 1

    def _analyze_intent(self, message: str, context: Dict[str, Any]) -> Tuple[IntentType, float]:
        """Analyze the communicative intent of the message"""
        message_lower = message.lower()
        
        intent_scores = {}
        
        # Check each intent type
        for intent_type, intent_config in self.intent_patterns.items():
            score = 0.0
            
            # Pattern matching
            pattern_matches = 0
            for pattern in intent_config['patterns']:
                if re.search(pattern, message_lower):
                    pattern_matches += 1
                    score += 0.3
            
            # Keyword matching
            keyword_matches = 0
            for keyword in intent_config['keywords']:
                if keyword in message_lower:
                    keyword_matches += 1
                    score += 0.2
            
            # Tone indicator bonus
            for indicator in intent_config['tone_indicators']:
                if indicator in message_lower:
                    score += 0.1
            
            # Normalize score
            if pattern_matches > 0 or keyword_matches > 0:
                intent_scores[intent_type] = min(1.0, score)
        
        # Default to unknown if no strong indicators
        if not intent_scores:
            return IntentType.UNKNOWN, 0.0
        
        # Return intent with highest score
        best_intent = max(intent_scores.items(), key=lambda x: x[1])
        return best_intent[0], best_intent[1]

    def _analyze_contextual_clues(self, message: str, context: Dict[str, Any], 
                                 conversation_id: str) -> Dict[ContextualClue, float]:
        """Analyze various contextual clues"""
        clues = {}
        
        # Platform norms
        platform = context.get('platform', 'unknown')
        if platform in self.platform_norms:
            platform_config = self.platform_norms[platform]
            clues[ContextualClue.PLATFORM_NORMS] = platform_config['tolerance_level']
        
        # Time context
        timestamp = context.get('timestamp', time.time())
        hour = int((timestamp % 86400) // 3600)  # Hour of day
        
        if 22 <= hour or hour <= 6:  # Late night/early morning
            clues[ContextualClue.TIME_CONTEXT] = 0.3  # Higher risk during these hours
        elif 9 <= hour <= 17:  # Business hours
            clues[ContextualClue.TIME_CONTEXT] = 0.1  # Lower risk
        else:
            clues[ContextualClue.TIME_CONTEXT] = 0.2  # Medium risk
        
        # Conversation history
        if conversation_id in self.message_history:
            history = list(self.message_history[conversation_id])
            if len(history) > 1:
                # Analyze conversation flow
                recent_messages = history[-3:]  # Last 3 messages
                escalation_detected = self._detect_escalation_in_history(recent_messages)
                clues[ContextualClue.CONVERSATION_TOPIC] = 0.8 if escalation_detected else 0.3
        
        # Group dynamics (if multiple participants)
        conv_context = self.conversation_contexts.get(conversation_id)
        if conv_context and len(conv_context.participants) > 2:
            clues[ContextualClue.GROUP_DYNAMICS] = 0.6  # Group conversations can escalate
        
        return clues

    def _analyze_relationship_indicators(self, message: str, user_id: str, 
                                       target_id: Optional[str]) -> List[str]:
        """Analyze relationship indicators in the message"""
        indicators = []
        message_lower = message.lower()
        
        # Check for relationship type indicators
        for relationship_type, terms in self.relationship_indicators.items():
            for term in terms:
                if term in message_lower:
                    indicators.append(f"Relationship indicator: {relationship_type} ({term})")
        
        # Check for cultural markers
        for culture_type, markers in self.cultural_markers.items():
            for marker in markers:
                if marker in message_lower:
                    indicators.append(f"Cultural marker: {culture_type} ({marker})")
        
        # Analyze historical relationship if available
        if user_id and target_id and target_id in self.user_relationships[user_id]:
            relationship_info = self.user_relationships[user_id][target_id]
            indicators.append(f"Historical relationship: {relationship_info.get('type', 'unknown')}")
        
        return indicators

    def _calculate_risk_modifiers(self, context: Dict[str, Any], intent: IntentType, 
                                 context_clues: Dict[ContextualClue, float]) -> Dict[str, float]:
        """Calculate risk modifiers based on context"""
        modifiers = {}
        
        # Platform-based modifier
        platform = context.get('platform', 'unknown')
        if platform in self.platform_norms:
            platform_tolerance = self.platform_norms[platform]['tolerance_level']
            modifiers['platform_adjustment'] = 1.0 - platform_tolerance
        
        # Intent-based modifier
        intent_risk_map = {
            IntentType.THREATENING: 1.5,
            IntentType.AGGRESSIVE_ATTACK: 1.3,
            IntentType.HARASSMENT: 1.2,
            IntentType.PASSIVE_AGGRESSIVE: 1.1,
            IntentType.SARCASTIC_HUMOR: 0.8,
            IntentType.PLAYFUL_BANTER: 0.6,
            IntentType.CONSTRUCTIVE_FEEDBACK: 0.4,
            IntentType.SUPPORTIVE: 0.2
        }
        modifiers['intent_risk'] = intent_risk_map.get(intent, 1.0)
        
        # Time-based modifier
        time_risk = context_clues.get(ContextualClue.TIME_CONTEXT, 0.2)
        modifiers['time_adjustment'] = 1.0 + time_risk
        
        # Group dynamics modifier
        if ContextualClue.GROUP_DYNAMICS in context_clues:
            modifiers['group_risk'] = 1.2  # Group pile-ons are more harmful
        
        return modifiers

    def _identify_situational_factors(self, context: Dict[str, Any], 
                                    conversation_id: str) -> List[str]:
        """Identify situational factors that affect interpretation"""
        factors = []
        
        # Check if this is a public vs private conversation
        platform = context.get('platform', 'unknown')
        if platform in ['twitter', 'instagram', 'tiktok']:
            factors.append("Public platform - higher visibility")
        elif platform in ['discord', 'facebook']:
            factors.append("Semi-private platform - community context")
        
        # Check conversation length
        conv_context = self.conversation_contexts.get(conversation_id)
        if conv_context:
            if conv_context.message_count > 20:
                factors.append("Extended conversation - established context")
            elif conv_context.message_count < 3:
                factors.append("Brief interaction - limited context")
        
        # Check time patterns
        timestamp = context.get('timestamp', time.time())
        hour = int((timestamp % 86400) // 3600)
        
        if 22 <= hour or hour <= 6:
            factors.append("Late night communication - potential emotional state")
        elif 12 <= hour <= 13:
            factors.append("Lunch hour - casual communication likely")
        
        # Check if this appears to be a heated discussion
        if conversation_id in self.message_history:
            recent_messages = list(self.message_history[conversation_id])[-5:]
            if self._detect_heated_discussion(recent_messages):
                factors.append("Heated discussion detected - emotions may be elevated")
        
        return factors

    def _detect_escalation_in_history(self, messages: List[Dict]) -> bool:
        """Detect if conversation is escalating"""
        if len(messages) < 2:
            return False
        
        # Simple escalation detection based on message tone
        escalation_keywords = ['stupid', 'idiot', 'hate', 'shut up', 'fuck', 'damn']
        
        escalation_scores = []
        for msg_data in messages:
            message = msg_data['message'].lower()
            score = sum(1 for keyword in escalation_keywords if keyword in message)
            escalation_scores.append(score)
        
        # Check if scores are increasing
        return len(escalation_scores) >= 2 and escalation_scores[-1] > escalation_scores[0]

    def _detect_heated_discussion(self, messages: List[Dict]) -> bool:
        """Detect if discussion is heated"""
        if len(messages) < 3:
            return False
        
        heated_indicators = ['!', 'caps', 'disagree', 'wrong', 'stupid', 'ridiculous']
        heated_count = 0
        
        for msg_data in messages:
            message = msg_data['message']
            # Count caps
            caps_ratio = sum(1 for c in message if c.isupper()) / len(message) if message else 0
            if caps_ratio > 0.3:
                heated_count += 1
            
            # Count exclamation marks
            if message.count('!') >= 2:
                heated_count += 1
            
            # Count heated keywords
            for indicator in heated_indicators:
                if indicator in message.lower():
                    heated_count += 1
                    break
        
        return heated_count >= 2

    def _generate_explanation(self, intent: IntentType, 
                            context_clues: Dict[ContextualClue, float],
                            relationship_indicators: List[str]) -> str:
        """Generate human-readable explanation of the analysis"""
        explanation_parts = []
        
        # Intent explanation
        intent_explanations = {
            IntentType.GENUINE_CRITICISM: "appears to be offering genuine criticism or feedback",
            IntentType.CONSTRUCTIVE_FEEDBACK: "seems to be providing constructive advice",
            IntentType.PLAYFUL_BANTER: "appears to be playful banter or friendly teasing",
            IntentType.SARCASTIC_HUMOR: "contains sarcastic or ironic humor",
            IntentType.AGGRESSIVE_ATTACK: "shows aggressive or hostile intent",
            IntentType.THREATENING: "contains threatening language or implications",
            IntentType.HARASSMENT: "appears to be harassment or persistent negative behavior",
            IntentType.SUPPORTIVE: "shows supportive or encouraging intent"
        }
        
        if intent in intent_explanations:
            explanation_parts.append(f"The message {intent_explanations[intent]}")
        
        # Context clues explanation
        if ContextualClue.PLATFORM_NORMS in context_clues:
            explanation_parts.append("Platform communication norms have been considered")
        
        if ContextualClue.TIME_CONTEXT in context_clues:
            time_risk = context_clues[ContextualClue.TIME_CONTEXT]
            if time_risk > 0.25:
                explanation_parts.append("Posted during hours associated with emotional communication")
        
        # Relationship indicators
        if relationship_indicators:
            explanation_parts.append("Relationship context and cultural markers detected")
        
        return ". ".join(explanation_parts) + "."

    def _create_empty_result(self) -> ContextualAnalysisResult:
        """Create empty analysis result"""
        return ContextualAnalysisResult(
            intent=IntentType.UNKNOWN,
            confidence=0.0,
            context_clues={},
            situational_factors=[],
            relationship_indicators=[],
            risk_modifiers={},
            explanation="Unable to analyze context due to insufficient information."
        )

    def update_relationship_info(self, user_id: str, target_id: str, 
                               relationship_type: str, interaction_history: Dict[str, Any]) -> None:
        """Update relationship information between users"""
        self.user_relationships[user_id][target_id] = {
            'type': relationship_type,
            'history': interaction_history,
            'last_updated': time.time()
        }

    def get_conversation_summary(self, conversation_id: str) -> Dict[str, Any]:
        """Get summary of conversation context and history"""
        if conversation_id not in self.conversation_contexts:
            return {}
        
        context = self.conversation_contexts[conversation_id]
        history = list(self.message_history[conversation_id])
        
        # Analyze conversation patterns
        participants_activity = {}
        for msg in history:
            user = msg['user_id']
            participants_activity[user] = participants_activity.get(user, 0) + 1
        
        # Detect conversation tone evolution
        tone_evolution = []
        for msg in history[-10:]:  # Last 10 messages
            # Simple tone analysis based on keywords
            message_lower = msg['message'].lower()
            if any(word in message_lower for word in ['hate', 'stupid', 'idiot']):
                tone_evolution.append('negative')
            elif any(word in message_lower for word in ['thanks', 'good', 'nice']):
                tone_evolution.append('positive')
            else:
                tone_evolution.append('neutral')
        
        return {
            'conversation_id': conversation_id,
            'participants': list(context.participants),
            'message_count': context.message_count,
            'duration_minutes': (context.last_activity - context.start_time) / 60,
            'platform': context.platform,
            'participants_activity': participants_activity,
            'recent_tone_pattern': tone_evolution,
            'escalation_detected': self._detect_escalation_in_history(history[-5:])
        }

    def cleanup_old_data(self, retention_hours: int = 168) -> None:  # Default 7 days
        """Clean up old conversation data"""
        current_time = time.time()
        retention_seconds = retention_hours * 3600
        
        # Clean up conversation contexts
        to_remove = []
        for conv_id, context in self.conversation_contexts.items():
            if current_time - context.last_activity > retention_seconds:
                to_remove.append(conv_id)
        
        for conv_id in to_remove:
            del self.conversation_contexts[conv_id]
            if conv_id in self.message_history:
                del self.message_history[conv_id]
        
        # Clean up relationship data
        for user_id, relationships in self.user_relationships.items():
            for target_id, rel_info in list(relationships.items()):
                last_updated = rel_info.get('last_updated', 0)
                if current_time - last_updated > retention_seconds:
                    del relationships[target_id]

    def get_context_statistics(self) -> Dict[str, Any]:
        """Get statistics about context analysis"""
        total_conversations = len(self.conversation_contexts)
        total_messages = sum(len(history) for history in self.message_history.values())
        
        # Platform distribution
        platform_dist = {}
        for context in self.conversation_contexts.values():
            platform = context.platform or 'unknown'
            platform_dist[platform] = platform_dist.get(platform, 0) + 1
        
        # Average conversation length
        avg_conv_length = sum(ctx.message_count for ctx in self.conversation_contexts.values()) / total_conversations if total_conversations > 0 else 0
        
        return {
            'total_conversations': total_conversations,
            'total_messages_analyzed': total_messages,
            'platform_distribution': platform_dist,
            'average_conversation_length': round(avg_conv_length, 2),
            'active_relationships': sum(len(rels) for rels in self.user_relationships.values())
        }