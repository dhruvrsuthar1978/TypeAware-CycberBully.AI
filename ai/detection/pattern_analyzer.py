"""
pattern_analyzer.py
Advanced pattern analysis for TypeAware cyberbullying detection
Analyzes text patterns, context, and behavioral indicators
Rewritten and corrected for initialization order, typing, and robustness.
"""

import re
import time
from typing import Dict, List, Tuple, Optional, Set, Any
from dataclasses import dataclass, field
from collections import defaultdict, Counter
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class PatternType(Enum):
    """Types of detected patterns"""
    REPETITIVE_HARASSMENT = "repetitive_harassment"
    ESCALATING_THREATS = "escalating_threats"
    COORDINATED_BULLYING = "coordinated_bullying"
    PASSIVE_AGGRESSIVE = "passive_aggressive"
    EXCLUSION_LANGUAGE = "exclusion_language"
    IDENTITY_TARGETING = "identity_targeting"
    CYBERSTALKING = "cyberstalking"
    IMPERSONATION = "impersonation"


@dataclass
class PatternMatch:
    """Data class for pattern detection results"""
    pattern_type: PatternType
    confidence: float
    evidence: List[str]
    severity: int
    description: str
    temporal_data: Optional[Dict[str, Any]] = None
    behavioral_indicators: List[str] = field(default_factory=list)


@dataclass
class UserBehaviorProfile:
    """User behavior tracking for pattern analysis"""
    user_id: str
    message_count: int = 0
    abusive_message_count: int = 0
    target_users: Set[str] = field(default_factory=set)
    time_patterns: List[float] = field(default_factory=list)
    platform_activity: Dict[str, int] = field(default_factory=dict)
    escalation_score: float = 0.0
    last_activity: Optional[float] = None


class PatternAnalyzer:
    """
    Advanced pattern analyzer for detecting complex cyberbullying behaviors
    beyond simple keyword matching.

    Notes:
    - Initializes time windows before pattern rules to avoid attribute errors.
    - Methods are resilient to missing context fields.
    """

    def __init__(self):
        # Storage
        self.user_profiles: Dict[str, UserBehaviorProfile] = {}
        self.conversation_history: Dict[str, List[Tuple[str, Dict[str, Any]]]] = defaultdict(list)
        self.temporal_patterns: Dict[str, List[Any]] = defaultdict(list)

        # Tracking windows (in seconds) - set BEFORE rules that reference them
        self.short_window = 5 * 60     # 5 minutes
        self.medium_window = 60 * 60   # 1 hour
        self.long_window = 24 * 60 * 60  # 24 hours

        # Initialize rules and indicators
        self.pattern_rules = self._initialize_pattern_rules()
        self.behavioral_indicators = self._initialize_behavioral_indicators()

        logger.info("PatternAnalyzer initialized")

    def _initialize_pattern_rules(self) -> Dict[PatternType, Dict]:
        """Initialize pattern detection rules and thresholds"""
        return {
            PatternType.REPETITIVE_HARASSMENT: {
                'min_occurrences': 3,
                'time_window': self.medium_window,
                'keywords': [
                    r'you\s+always\s+\w+',
                    r'every\s+time\s+you',
                    r'you\s+never\s+\w+',
                    r'typical\s+\w+',
                    r'as\s+usual',
                ],
                'severity': 3,
                'description': 'Repeated targeting of individual with similar messages'
            },

            PatternType.ESCALATING_THREATS: {
                'escalation_words': [
                    ['annoying', 'stupid', 'hate'],
                    ['hurt', 'destroy', 'kill'],
                    ['find you', 'get you', 'pay for this']
                ],
                'time_window': self.long_window,
                'min_escalation_steps': 2,
                'severity': 4,
                'description': 'Progressive escalation in threat level'
            },

            PatternType.COORDINATED_BULLYING: {
                'min_participants': 2,
                'time_window': self.short_window,
                'similarity_threshold': 0.7,
                'keywords': [
                    r'everyone\s+knows',
                    r'we\s+all\s+(think|know)',
                    r'nobody\s+likes',
                    r'join\s+us',
                ],
                'severity': 4,
                'description': 'Multiple users targeting same individual'
            },

            PatternType.PASSIVE_AGGRESSIVE: {
                'indicators': [
                    r'just\s+saying',
                    r'no\s+offense\s+but',
                    r'i\'m\s+just\s+being\s+honest',
                    r'don\'t\s+take\s+this\s+wrong',
                    r'bless\s+your\s+heart',
                    r'good\s+for\s+you',
                ],
                'context_negative': True,
                'severity': 2,
                'description': 'Indirect aggressive communication'
            },

            PatternType.EXCLUSION_LANGUAGE: {
                'exclusion_phrases': [
                    r'you\s+don\'t\s+belong',
                    r'go\s+back\s+to',
                    r'not\s+welcome\s+here',
                    r'people\s+like\s+you',
                    r'your\s+kind',
                    r'outsider',
                ],
                'severity': 3,
                'description': 'Language intended to exclude or ostracize'
            },

            PatternType.IDENTITY_TARGETING: {
                'identity_references': [
                    r'your\s+(race|religion|gender|sexuality)',
                    r'because\s+you\'re\s+\w+',
                    r'typical\s+(boy|girl|man|woman)',
                    r'all\s+\w+\s+are',
                ],
                'severity': 4,
                'description': 'Targeting based on identity characteristics'
            },

            PatternType.CYBERSTALKING: {
                'stalking_indicators': [
                    r'i\s+know\s+where',
                    r'followed\s+you',
                    r'watching\s+you',
                    r'i\s+saw\s+you\s+at',
                    r'your\s+(address|school|work)',
                ],
                'frequency_threshold': 2,
                'time_window': self.long_window,
                'severity': 4,
                'description': 'Persistent unwanted attention and monitoring'
            },

            PatternType.IMPERSONATION: {
                'impersonation_signs': [
                    r'this\s+is\s+\w+\s+speaking',
                    r'i\s+am\s+\w+',
                    r'pretending\s+to\s+be',
                ],
                'verification_required': True,
                'severity': 3,
                'description': 'Attempting to impersonate another person'
            }
        }

    def _initialize_behavioral_indicators(self) -> Dict[str, List[str]]:
        """Initialize behavioral pattern indicators"""
        return {
            'frequency_spike': [
                'Sudden increase in message frequency',
                'Burst of activity after period of silence',
                'Messaging during unusual hours'
            ],
            'target_persistence': [
                'Repeatedly messaging same user',
                'Following user across platforms',
                'Ignoring blocking attempts'
            ],
            'escalation_pattern': [
                'Messages becoming more aggressive over time',
                'Increasing severity of threats',
                'Moving from implicit to explicit threats'
            ],
            'group_coordination': [
                'Similar messages from multiple accounts',
                'Synchronized timing of messages',
                'Reference to coordinated actions'
            ]
        }

    def analyze_message_patterns(self, message: str, context: Dict[str, Any]) -> List[PatternMatch]:
        """
        Analyze a message for cyberbullying patterns
        """
        patterns: List[PatternMatch] = []

        # Update user behavior profile
        try:
            self._update_user_profile(message, context)
        except Exception:
            logger.exception("Failed to update user profile")

        # Check each pattern type
        for pattern_type, rules in self.pattern_rules.items():
            try:
                match = self._check_pattern(message, context, pattern_type, rules)
                if match:
                    patterns.append(match)
            except Exception:
                logger.exception(f"Error checking pattern {pattern_type}")

        # Analyze temporal patterns
        try:
            temporal_patterns = self._analyze_temporal_patterns(context)
            patterns.extend(temporal_patterns)
        except Exception:
            logger.exception("Error analyzing temporal patterns")

        # Analyze conversation context
        try:
            conversation_patterns = self._analyze_conversation_context(message, context)
            patterns.extend(conversation_patterns)
        except Exception:
            logger.exception("Error analyzing conversation context")

        return patterns

    def _update_user_profile(self, message: str, context: Dict[str, Any]) -> None:
        """Update user behavior profile with new message"""
        user_id = context.get('user_id', 'anonymous')
        timestamp = context.get('timestamp', time.time())
        platform = context.get('platform', 'unknown')
        target_id = context.get('target_id')

        if user_id not in self.user_profiles:
            self.user_profiles[user_id] = UserBehaviorProfile(user_id=user_id)

        profile = self.user_profiles[user_id]
        profile.message_count += 1
        profile.time_patterns.append(timestamp)
        profile.last_activity = timestamp

        # Track platform activity
        profile.platform_activity[platform] = profile.platform_activity.get(platform, 0) + 1

        # Track targets
        if target_id:
            profile.target_users.add(target_id)

        # Limit stored time patterns to last 100 messages for memory efficiency
        if len(profile.time_patterns) > 100:
            profile.time_patterns = profile.time_patterns[-100:]

    def _check_pattern(self, message: str, context: Dict[str, Any], 
                       pattern_type: PatternType, rules: Dict) -> Optional[PatternMatch]:
        """Dispatch to specific pattern checks"""
        if pattern_type == PatternType.REPETITIVE_HARASSMENT:
            return self._check_repetitive_harassment(message, context, rules)
        if pattern_type == PatternType.ESCALATING_THREATS:
            return self._check_escalating_threats(message, context, rules)
        if pattern_type == PatternType.COORDINATED_BULLYING:
            return self._check_coordinated_bullying(message, context, rules)
        if pattern_type == PatternType.PASSIVE_AGGRESSIVE:
            return self._check_passive_aggressive(message, context, rules)
        if pattern_type == PatternType.EXCLUSION_LANGUAGE:
            return self._check_exclusion_language(message, context, rules)
        if pattern_type == PatternType.IDENTITY_TARGETING:
            return self._check_identity_targeting(message, context, rules)
        if pattern_type == PatternType.CYBERSTALKING:
            return self._check_cyberstalking(message, context, rules)
        if pattern_type == PatternType.IMPERSONATION:
            return self._check_impersonation(message, context, rules)
        return None

    def _check_repetitive_harassment(self, message: str, context: Dict[str, Any], 
                                     rules: Dict) -> Optional[PatternMatch]:
        """Check for repetitive harassment patterns"""
        user_id = context.get('user_id', 'anonymous')
        target_id = context.get('target_id')
        timestamp = context.get('timestamp', time.time())

        if not target_id or user_id not in self.user_profiles:
            return None

        profile = self.user_profiles[user_id]

        # Look for keyword patterns
        evidence: List[str] = []
        for keyword_pattern in rules.get('keywords', []):
            if re.search(keyword_pattern, message, re.IGNORECASE):
                evidence.append(f"Repetitive pattern: {keyword_pattern}")

        # Check message frequency to same target
        recent_messages = [t for t in profile.time_patterns 
                            if timestamp - t < rules.get('time_window', self.medium_window)]

        if len(recent_messages) >= rules.get('min_occurrences', 3) and evidence:
            confidence = min(0.9, len(recent_messages) / 10.0 + len(evidence) * 0.2)

            return PatternMatch(
                pattern_type=PatternType.REPETITIVE_HARASSMENT,
                confidence=confidence,
                evidence=evidence,
                severity=rules.get('severity', 3),
                description=rules.get('description', ''),
                behavioral_indicators=[
                    f"Sent {len(recent_messages)} messages in time window",
                    f"Targeting user {target_id} repeatedly"
                ]
            )
        return None

    def _check_escalating_threats(self, message: str, context: Dict[str, Any], 
                                  rules: Dict) -> Optional[PatternMatch]:
        """Check for escalating threat patterns"""
        user_id = context.get('user_id', 'anonymous')

        if user_id not in self.user_profiles:
            return None

        # Determine threat level of current message
        current_level = self._get_threat_level(message, rules.get('escalation_words', []))

        if current_level == -1:  # No threat detected
            return None

        # Check conversation history for escalation
        conversation_id = context.get('conversation_id', f"{user_id}_default")
        history = self.conversation_history.get(conversation_id, [])

        # Look for escalation pattern in recent history
        escalation_detected = False
        evidence: List[str] = []

        for i, (prev_msg, prev_context) in enumerate(history[-5:]):  # Check last 5 messages
            prev_level = self._get_threat_level(prev_msg, rules.get('escalation_words', []))
            if prev_level != -1 and prev_level < current_level:
                escalation_detected = True
                evidence.append(f"Escalation from level {prev_level} to {current_level}")

        if escalation_detected:
            confidence = 0.8 if len(evidence) >= 2 else 0.6

            return PatternMatch(
                pattern_type=PatternType.ESCALATING_THREATS,
                confidence=confidence,
                evidence=evidence,
                severity=rules.get('severity', 4),
                description=rules.get('description', ''),
                behavioral_indicators=[
                    f"Threat level escalated to {current_level}",
                    f"Pattern detected in conversation {conversation_id}"
                ]
            )
        return None

    def _get_threat_level(self, message: str, escalation_words: List[List[str]]) -> int:
        """Determine threat level of a message"""
        message_lower = message.lower()

        for level, words in enumerate(escalation_words):
            for word in words:
                if word in message_lower:
                    return level
        return -1  # No threat detected

    def _check_coordinated_bullying(self, message: str, context: Dict[str, Any], 
                                    rules: Dict) -> Optional[PatternMatch]:
        """Check for coordinated bullying patterns"""
        conversation_id = context.get('conversation_id')
        timestamp = context.get('timestamp', time.time())

        if not conversation_id:
            return None

        # Check for coordinated keywords
        evidence: List[str] = []
        for keyword_pattern in rules.get('keywords', []):
            if re.search(keyword_pattern, message, re.IGNORECASE):
                evidence.append(f"Coordination indicator: {keyword_pattern}")

        # Check for multiple users with similar messages in time window
        recent_messages = []
        for msg, msg_context in self.conversation_history.get(conversation_id, []):
            msg_time = msg_context.get('timestamp', 0)
            if timestamp - msg_time < rules.get('time_window', self.short_window):
                recent_messages.append((msg, msg_context))

        # Look for similar messages from different users
        similar_count = 0
        participants: Set[str] = set()

        for other_msg, other_context in recent_messages:
            other_user = other_context.get('user_id', 'anonymous')
            current_user = context.get('user_id', 'anonymous')

            if other_user != current_user:
                similarity = self._calculate_message_similarity(message, other_msg)
                if similarity > rules.get('similarity_threshold', 0.7):
                    similar_count += 1
                    participants.add(other_user)

        if len(participants) >= rules.get('min_participants', 2) and (evidence or similar_count > 0):
            confidence = min(0.9, (len(participants) / 5.0) + (len(evidence) * 0.2))

            return PatternMatch(
                pattern_type=PatternType.COORDINATED_BULLYING,
                confidence=confidence,
                evidence=evidence + [f"Similar messages from {len(participants)} users"],
                severity=rules.get('severity', 4),
                description=rules.get('description', ''),
                behavioral_indicators=[
                    f"Coordinated activity with {len(participants)} participants",
                    f"Similar message patterns detected"
                ]
            )
        return None

    def _check_passive_aggressive(self, message: str, context: Dict[str, Any], 
                                  rules: Dict) -> Optional[PatternMatch]:
        """Check for passive-aggressive patterns"""
        evidence: List[str] = []

        # Check for passive-aggressive indicators
        for indicator in rules.get('indicators', []):
            if re.search(indicator, message, re.IGNORECASE):
                evidence.append(f"Passive-aggressive phrase: {indicator}")

        if evidence:
            # Check if the overall message has negative context
            negative_words = ['stupid', 'wrong', 'bad', 'terrible', 'awful', 'hate', 'annoying']
            has_negative_context = any(word in message.lower() for word in negative_words)

            confidence = 0.7 if has_negative_context else 0.5

            return PatternMatch(
                pattern_type=PatternType.PASSIVE_AGGRESSIVE,
                confidence=confidence,
                evidence=evidence,
                severity=rules.get('severity', 2),
                description=rules.get('description', ''),
                behavioral_indicators=[
                    "Uses indirect aggressive language",
                    "Combines polite phrases with negative content"
                ]
            )
        return None

    def _check_exclusion_language(self, message: str, context: Dict[str, Any], 
                                  rules: Dict) -> Optional[PatternMatch]:
        """Check for exclusion language patterns"""
        evidence: List[str] = []

        for phrase in rules.get('exclusion_phrases', []):
            if re.search(phrase, message, re.IGNORECASE):
                evidence.append(f"Exclusion phrase: {phrase}")

        if evidence:
            confidence = min(0.9, len(evidence) * 0.4)

            return PatternMatch(
                pattern_type=PatternType.EXCLUSION_LANGUAGE,
                confidence=confidence,
                evidence=evidence,
                severity=rules.get('severity', 3),
                description=rules.get('description', ''),
                behavioral_indicators=[
                    "Uses language to exclude or ostracize",
                    "Targets individual's belonging or acceptance"
                ]
            )
        return None

    def _check_identity_targeting(self, message: str, context: Dict[str, Any], 
                                   rules: Dict) -> Optional[PatternMatch]:
        """Check for identity-based targeting patterns"""
        evidence: List[str] = []

        for reference in rules.get('identity_references', []):
            if re.search(reference, message, re.IGNORECASE):
                evidence.append(f"Identity targeting: {reference}")

        if evidence:
            confidence = min(0.9, len(evidence) * 0.5)

            return PatternMatch(
                pattern_type=PatternType.IDENTITY_TARGETING,
                confidence=confidence,
                evidence=evidence,
                severity=rules.get('severity', 4),
                description=rules.get('description', ''),
                behavioral_indicators=[
                    "Targets individual based on identity characteristics",
                    "Uses discriminatory language"
                ]
            )
        return None

    def _check_cyberstalking(self, message: str, context: Dict[str, Any], 
                              rules: Dict) -> Optional[PatternMatch]:
        """Check for cyberstalking patterns"""
        user_id = context.get('user_id', 'anonymous')
        target_id = context.get('target_id')
        timestamp = context.get('timestamp', time.time())

        evidence: List[str] = []

        # Check for stalking indicators
        for indicator in rules.get('stalking_indicators', []):
            if re.search(indicator, message, re.IGNORECASE):
                evidence.append(f"Stalking behavior: {indicator}")

        if evidence and user_id in self.user_profiles:
            profile = self.user_profiles[user_id]

            # Check frequency of contact with target
            if target_id and target_id in profile.target_users:
                recent_contacts = len([t for t in profile.time_patterns 
                                         if timestamp - t < rules.get('time_window', self.long_window)])

                if recent_contacts >= rules.get('frequency_threshold', 2):
                    confidence = min(0.9, len(evidence) * 0.3 + recent_contacts * 0.1)

                    return PatternMatch(
                        pattern_type=PatternType.CYBERSTALKING,
                        confidence=confidence,
                        evidence=evidence + [f"High frequency contact: {recent_contacts} times"],
                        severity=rules.get('severity', 4),
                        description=rules.get('description', ''),
                        behavioral_indicators=[
                            "Persistent unwanted contact",
                            "References personal information or location"
                        ]
                    )
        return None

    def _check_impersonation(self, message: str, context: Dict[str, Any], 
                              rules: Dict) -> Optional[PatternMatch]:
        """Check for impersonation patterns"""
        evidence: List[str] = []

        for sign in rules.get('impersonation_signs', []):
            if re.search(sign, message, re.IGNORECASE):
                evidence.append(f"Impersonation indicator: {sign}")

        if evidence:
            confidence = 0.6  # Lower confidence as this needs verification

            return PatternMatch(
                pattern_type=PatternType.IMPERSONATION,
                confidence=confidence,
                evidence=evidence,
                severity=rules.get('severity', 3),
                description=rules.get('description', ''),
                behavioral_indicators=[
                    "Claims to be another person",
                    "May be attempting identity deception"
                ]
            )
        return None

    def _analyze_temporal_patterns(self, context: Dict[str, Any]) -> List[PatternMatch]:
        """Analyze temporal patterns in user behavior"""
        patterns: List[PatternMatch] = []
        user_id = context.get('user_id', 'anonymous')
        timestamp = context.get('timestamp', time.time())

        if user_id not in self.user_profiles:
            return patterns

        profile = self.user_profiles[user_id]

        # Check for unusual activity spikes
        recent_activity = [t for t in profile.time_patterns 
                           if timestamp - t < self.short_window]

        if len(recent_activity) >= 10:  # 10+ messages in short window
            patterns.append(PatternMatch(
                pattern_type=PatternType.REPETITIVE_HARASSMENT,
                confidence=0.7,
                evidence=[f"Activity spike: {len(recent_activity)} messages in {self.short_window/60} minutes"],
                severity=2,
                description="Unusual burst of activity detected",
                temporal_data={'spike_count': len(recent_activity)},
                behavioral_indicators=["Unusual messaging frequency", "Potential harassment campaign"]
            ))

        # Check for late night activity (potential indicator of emotional state)
        from datetime import datetime
        hour = datetime.fromtimestamp(timestamp).hour
        if 22 <= hour or hour <= 6:  # Between 10 PM and 6 AM
            if len(recent_activity) >= 3:
                patterns.append(PatternMatch(
                    pattern_type=PatternType.CYBERSTALKING,
                    confidence=0.5,
                    evidence=[f"Late night activity: {hour}:00 hours"],
                    severity=2,
                    description="Unusual timing of messages",
                    temporal_data={'hour': hour},
                    behavioral_indicators=["Late night messaging", "Potential obsessive behavior"]
                ))

        return patterns

    def _analyze_conversation_context(self, message: str, context: Dict[str, Any]) -> List[PatternMatch]:
        """Analyze conversation context for patterns"""
        patterns: List[PatternMatch] = []
        conversation_id = context.get('conversation_id')

        if not conversation_id:
            return patterns

        # Store message in conversation history
        self.conversation_history[conversation_id].append((message, context))

        # Limit conversation history size
        if len(self.conversation_history[conversation_id]) > 50:
            self.conversation_history[conversation_id] = self.conversation_history[conversation_id][-50:]

        # Analyze conversation escalation
        history = self.conversation_history[conversation_id]
        if len(history) >= 3:
            escalation = self._detect_conversation_escalation(history)
            if escalation:
                patterns.append(escalation)

        return patterns

    def _detect_conversation_escalation(self, history: List[Tuple[str, Dict]]) -> Optional[PatternMatch]:
        """Detect escalation patterns in conversation"""
        recent_messages = history[-5:]  # Look at last 5 messages

        # Simple sentiment escalation detection
        escalation_keywords = [
            ['annoyed', 'bothered'],
            ['angry', 'mad', 'furious'],
            ['hate', 'despise'],
            ['kill', 'destroy', 'hurt']
        ]

        max_level = -1
        escalation_found = False
        evidence: List[str] = []

        for message, msg_context in recent_messages:
            message_lower = message.lower()
            for level, keywords in enumerate(escalation_keywords):
                for keyword in keywords:
                    if keyword in message_lower:
                        if level > max_level:
                            escalation_found = True
                            evidence.append(f"Escalation to level {level}: '{keyword}'")
                        max_level = max(max_level, level)
                        break

        if escalation_found and max_level >= 2:
            return PatternMatch(
                pattern_type=PatternType.ESCALATING_THREATS,
                confidence=0.7,
                evidence=evidence,
                severity=3,
                description="Conversation escalation detected",
                behavioral_indicators=["Progressive increase in aggression", "Conversation turning hostile"]
            )

        return None

    def _calculate_message_similarity(self, msg1: str, msg2: str) -> float:
        """Calculate similarity between two messages"""
        from difflib import SequenceMatcher
        return SequenceMatcher(None, msg1.lower(), msg2.lower()).ratio()

    def get_user_risk_score(self, user_id: str) -> float:
        """Calculate overall risk score for a user based on behavior patterns"""
        if user_id not in self.user_profiles:
            return 0.0

        profile = self.user_profiles[user_id]
        risk_factors: List[float] = []

        # Message frequency risk
        if profile.message_count > 0:
            abuse_rate = (profile.abusive_message_count / profile.message_count) if profile.message_count > 0 else 0.0
            risk_factors.append(abuse_rate * 0.4)

        # Target diversity risk (targeting multiple users is worse)
        target_count = len(profile.target_users)
        if target_count > 1:
            risk_factors.append(min(1.0, target_count / 10.0) * 0.3)

        # Platform crossing risk
        platform_count = len(profile.platform_activity)
        if platform_count > 2:
            risk_factors.append(min(1.0, platform_count / 5.0) * 0.2)

        # Escalation score
        risk_factors.append(profile.escalation_score * 0.1)

        return min(1.0, sum(risk_factors))

    def update_escalation_score(self, user_id: str, pattern_matches: List[PatternMatch]) -> None:
        """Update user's escalation score based on detected patterns"""
        if user_id not in self.user_profiles:
            return

        profile = self.user_profiles[user_id]

        escalation_increase = 0.0
        for match in pattern_matches:
            if match.pattern_type in [PatternType.ESCALATING_THREATS, PatternType.CYBERSTALKING]:
                escalation_increase += match.confidence * 0.1

        profile.escalation_score = min(1.0, profile.escalation_score + escalation_increase)

        # Decay escalation score over time (rehabilitation possibility)
        current_time = time.time()
        if profile.last_activity:
            time_diff = current_time - profile.last_activity
            decay_rate = 0.1 / (24 * 3600)  # 0.1 per day
            decay = decay_rate * time_diff
            profile.escalation_score = max(0.0, profile.escalation_score - decay)

    def get_pattern_statistics(self) -> Dict[str, Any]:
        """Get statistics about detected patterns"""
        pattern_counts: Counter = Counter()
        total_users = len(self.user_profiles)
        high_risk_users = 0

        for user_id, profile in self.user_profiles.items():
            risk_score = self.get_user_risk_score(user_id)
            if risk_score > 0.7:
                high_risk_users += 1

        # Count patterns from temporal storage (simplified)
        for pattern_list in self.temporal_patterns.values():
            for p in pattern_list:
                try:
                    pattern_counts.update([type(p).__name__])
                except Exception:
                    continue

        return {
            'total_users_monitored': total_users,
            'high_risk_users': high_risk_users,
            'pattern_distribution': dict(pattern_counts),
            'average_escalation_score': (sum(p.escalation_score for p in self.user_profiles.values()) / total_users) if total_users > 0 else 0
        }

    def cleanup_old_data(self, retention_hours: int = 168) -> None:  # Default 7 days
        """Clean up old data to prevent memory issues"""
        current_time = time.time()
        retention_seconds = retention_hours * 3600

        # Clean up user profiles
        for user_id, profile in list(self.user_profiles.items()):
            if profile.last_activity and (current_time - profile.last_activity > retention_seconds):
                del self.user_profiles[user_id]
            else:
                # Clean up old time patterns
                profile.time_patterns = [t for t in profile.time_patterns 
                                          if current_time - t < retention_seconds]

        # Clean up conversation history
        for conv_id in list(self.conversation_history.keys()):
            messages = self.conversation_history[conv_id]
            recent_messages: List[Tuple[str, Dict[str, Any]]] = []
            for msg, context in messages:
                msg_time = context.get('timestamp', 0)
                if current_time - msg_time < retention_seconds:
                    recent_messages.append((msg, context))

            if recent_messages:
                self.conversation_history[conv_id] = recent_messages
            else:
                del self.conversation_history[conv_id]

        # Clean up temporal patterns
        for pattern_type in list(self.temporal_patterns.keys()):
            self.temporal_patterns[pattern_type] = [
                t for t in self.temporal_patterns[pattern_type] 
                if current_time - t < retention_seconds
            ]
