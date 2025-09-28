"""
sentiment_analyzer.py
Advanced sentiment analysis for TypeAware
Rewritten and corrected: fixes missing/incorrect method placement, indentation, and robustness.
"""

import re
import math
from typing import Dict, List, Tuple, Optional, Set, Any
from dataclasses import dataclass
from collections import defaultdict, Counter
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class SentimentPolarity(Enum):
    """Sentiment polarity classification"""
    VERY_NEGATIVE = -2
    NEGATIVE = -1
    NEUTRAL = 0
    POSITIVE = 1
    VERY_POSITIVE = 2


class EmotionalTone(Enum):
    """Emotional tone classification"""
    AGGRESSIVE = "aggressive"
    HOSTILE = "hostile"
    SARCASTIC = "sarcastic"
    DISMISSIVE = "dismissive"
    THREATENING = "threatening"
    CONDESCENDING = "condescending"
    NEUTRAL = "neutral"
    SUPPORTIVE = "supportive"
    EMPATHETIC = "empathetic"


@dataclass
class SentimentResult:
    """Result of sentiment analysis"""
    polarity: SentimentPolarity
    emotional_tone: EmotionalTone
    confidence: float
    intensity: float  # 0.0 to 1.0
    key_phrases: List[str]
    emotional_indicators: List[str]
    toxicity_score: float  # 0.0 to 1.0


class SentimentAnalyzer:
    """
    Advanced sentiment analyzer specifically tuned for cyberbullying detection.
    Uses a rule-based approach with pattern matching and simple heuristics.
    """

    def __init__(self):
        # Lexicons & patterns
        self.sentiment_lexicon = self._build_sentiment_lexicon()
        self.emotional_patterns = self._build_emotional_patterns()
        self.intensifiers = self._build_intensifiers()
        self.negation_words = self._build_negation_words()
        self.sarcasm_indicators = self._build_sarcasm_indicators()

        # Precompiled regex patterns
        self.patterns = {
            'exclamation': re.compile(r'[!]{2,}'),
            'caps_lock': re.compile(r'[A-Z]{3,}'),
            'repeated_chars': re.compile(r'(.)\1{2,}'),
            'question_marks': re.compile(r'[?]{2,}'),
            'emotional_punctuation': re.compile(r'[!?]{3,}')
        }

        logger.info("SentimentAnalyzer initialized")

    def _build_sentiment_lexicon(self) -> Dict[str, Tuple[float, float]]:
        """Build sentiment lexicon with polarity and intensity scores"""
        # (polarity, intensity)
        return {
            'hate': (-0.9, 0.9), 'despise': (-0.8, 0.8), 'loathe': (-0.8, 0.8),
            'disgusting': (-0.7, 0.7), 'terrible': (-0.7, 0.6), 'awful': (-0.7, 0.6),
            'horrible': (-0.7, 0.7), 'pathetic': (-0.6, 0.6), 'worthless': (-0.8, 0.7),
            'stupid': (-0.6, 0.5), 'idiot': (-0.6, 0.6), 'moron': (-0.7, 0.6),
            'loser': (-0.6, 0.6), 'trash': (-0.7, 0.6), 'garbage': (-0.6, 0.5),
            'kill': (-0.9, 1.0), 'murder': (-0.9, 1.0), 'destroy': (-0.8, 0.9),
            'hurt': (-0.7, 0.8), 'harm': (-0.7, 0.8), 'attack': (-0.8, 0.9),
            'beat': (-0.7, 0.8), 'crush': (-0.6, 0.7), 'eliminate': (-0.8, 0.8),
            'whatever': (-0.3, 0.4), 'obviously': (-0.2, 0.3), 'duh': (-0.3, 0.4),
            'seriously': (-0.2, 0.3), 'ridiculous': (-0.5, 0.5), 'absurd': (-0.5, 0.5),
            'outsider': (-0.4, 0.5), 'outcast': (-0.5, 0.6), 'reject': (-0.6, 0.6),
            'unwelcome': (-0.5, 0.5), 'unwanted': (-0.5, 0.5), 'excluded': (-0.4, 0.5),
            'annoying': (-0.4, 0.4), 'irritating': (-0.4, 0.4), 'bothering': (-0.3, 0.3),
            'weird': (-0.3, 0.3), 'great': (0.6, 0.6), 'amazing': (0.7, 0.7),
            'wonderful': (0.7, 0.7), 'excellent': (0.6, 0.6), 'fantastic': (0.7, 0.7),
            'perfect': (0.6, 0.6), 'awesome': (0.6, 0.6), 'brilliant': (0.6, 0.6),
            'support': (0.5, 0.5), 'help': (0.4, 0.4), 'understand': (0.3, 0.3),
            'care': (0.5, 0.5), 'empathy': (0.6, 0.6), 'compassion': (0.6, 0.6),
            'kindness': (0.6, 0.6), 'respect': (0.5, 0.5), 'appreciate': (0.5, 0.5)
        }

    def _build_emotional_patterns(self) -> Dict[EmotionalTone, List[str]]:
        """Build patterns for detecting emotional tones"""
        return {
            EmotionalTone.AGGRESSIVE: [
                r'i\s+will\s+\w+\s+you', r'you\s+better\s+\w+', r"don't\s+mess\s+with",
                r'i\'ll\s+show\s+you', r'fight\s+me', r'bring\s+it\s+on'
            ],
            EmotionalTone.HOSTILE: [r'shut\s+up', r'get\s+lost', r'go\s+away', r'leave\s+me\s+alone'],
            EmotionalTone.SARCASTIC: [r'oh\s+great', r'how\s+wonderful', r'just\s+perfect', r'real\s+smart'],
            EmotionalTone.DISMISSIVE: [r'whatever', r'don\'t\s+care', r'who\s+cares', r'big\s+deal'],
            EmotionalTone.THREATENING: [r'you\'ll\s+regret', r'watch\s+out', r'you\'re\s+gonna\s+pay'],
            EmotionalTone.CONDESCENDING: [r'let\s+me\s+explain', r'you\s+don\'t\s+understand', r'it\'s\s+simple']
        }

    def _build_intensifiers(self) -> Dict[str, float]:
        """Build intensifier words that amplify sentiment"""
        return {
            'very': 1.5, 'really': 1.4, 'extremely': 1.8, 'incredibly': 1.7,
            'absolutely': 1.6, 'totally': 1.5, 'completely': 1.6, 'so': 1.3,
            'fucking': 1.8, 'damn': 1.4, 'super': 1.4
        }

    def _build_negation_words(self) -> Set[str]:
        """Build negation words that flip sentiment"""
        return {
            'not', 'no', 'never', 'nothing', 'none', 'nobody', 'nowhere',
            'neither', 'nor', 'hardly', 'scarcely', 'barely', 'seldom',
            'without', 'cannot', 'cant', 'dont', 'doesnt', 'didnt'
        }

    def _build_sarcasm_indicators(self) -> List[str]:
        """Build sarcasm detection patterns"""
        return [
            r'oh\s+(great|wonderful|fantastic)',
            r'\b(great|perfect|wonderful)\b\s*[.!]*',
            r'real\s+(smart|clever|genius)',
            r'good\s+job\s+genius',
            r'wow\s+(amazing|incredible)',
            r'sure\s+thing',
            r'yeah\s+right',
            r'of\s+course',
            r'totally\s*[.!]*'
        ]

    def analyze_sentiment(self, text: str, context: Dict = None) -> SentimentResult:
        """Analyze sentiment and emotional tone of text"""
        if not text or not isinstance(text, str):
            return self._create_neutral_result()

        context = context or {}

        processed_text = self._preprocess_text(text)
        tokens = processed_text.split()

        polarity_score, intensity = self._calculate_base_sentiment(tokens)
        modified_polarity, modified_intensity = self._apply_modifiers(tokens, polarity_score, intensity)
        emotional_tone = self._detect_emotional_tone(text, modified_polarity)

        sarcasm_detected, sarcasm_confidence = self._detect_sarcasm(text, tokens)
        if sarcasm_detected:
            modified_polarity *= -1
            emotional_tone = EmotionalTone.SARCASTIC

        toxicity_score = self._calculate_toxicity_score(text, modified_polarity, emotional_tone)
        final_polarity = self._determine_polarity(modified_polarity)
        key_phrases = self._extract_key_phrases(text, tokens)
        emotional_indicators = self._extract_emotional_indicators(text, emotional_tone)
        confidence = self._calculate_confidence(modified_intensity, len(tokens), context)

        return SentimentResult(
            polarity=final_polarity,
            emotional_tone=emotional_tone,
            confidence=confidence,
            intensity=min(1.0, modified_intensity),
            key_phrases=key_phrases,
            emotional_indicators=emotional_indicators,
            toxicity_score=toxicity_score
        )

    def _preprocess_text(self, text: str) -> str:
        processed = text.lower()
        contractions = {
            "don't": "do not", "won't": "will not", "can't": "cannot",
            "shouldn't": "should not", "wouldn't": "would not",
            "couldn't": "could not", "isn't": "is not", "aren't": "are not",
            "wasn't": "was not", "weren't": "were not", "hasn't": "has not",
            "haven't": "have not", "hadn't": "had not"
        }
        for contraction, expansion in contractions.items():
            processed = processed.replace(contraction, expansion)
        return processed

    def _calculate_base_sentiment(self, tokens: List[str]) -> Tuple[float, float]:
        total_polarity = 0.0
        total_intensity = 0.0
        sentiment_words = 0
        for token in tokens:
            clean_token = re.sub(r'[^\w]', '', token)
            if clean_token in self.sentiment_lexicon:
                polarity, intensity = self.sentiment_lexicon[clean_token]
                total_polarity += polarity
                total_intensity += intensity
                sentiment_words += 1
        if sentiment_words == 0:
            return 0.0, 0.0
        return total_polarity / sentiment_words, total_intensity / sentiment_words

    def _apply_modifiers(self, tokens: List[str], polarity: float, intensity: float) -> Tuple[float, float]:
        modified_polarity = polarity
        modified_intensity = intensity
        intensifier_multiplier = 1.0
        for token in tokens:
            clean_token = re.sub(r'[^\w]', '', token)
            if clean_token in self.intensifiers:
                intensifier_multiplier *= self.intensifiers[clean_token]
        negation_detected = False
        for i, token in enumerate(tokens):
            clean_token = re.sub(r'[^\w]', '', token)
            if clean_token in self.negation_words:
                for j in range(i + 1, min(i + 4, len(tokens))):
                    next_token = re.sub(r'[^\w]', '', tokens[j])
                    if next_token in self.sentiment_lexicon:
                        negation_detected = True
                        break
        if negation_detected:
            modified_polarity *= -0.8
        modified_intensity *= intensifier_multiplier
        modified_polarity *= intensifier_multiplier
        return modified_polarity, modified_intensity

    def _detect_emotional_tone(self, text: str, polarity: float) -> EmotionalTone:
        text_lower = text.lower()
        for tone, patterns in self.emotional_patterns.items():
            for pattern in patterns:
                if re.search(pattern, text_lower):
                    return tone
        if re.search(r'[A-Z]{4,}', text):
            return EmotionalTone.AGGRESSIVE
        if re.search(r'[!]{3,}', text):
            if polarity < -0.3:
                return EmotionalTone.HOSTILE
            elif polarity > 0.3:
                return EmotionalTone.AGGRESSIVE
        if polarity <= -0.6:
            return EmotionalTone.HOSTILE
        elif polarity <= -0.3:
            return EmotionalTone.DISMISSIVE
        elif polarity >= 0.6:
            return EmotionalTone.SUPPORTIVE
        elif polarity >= 0.3:
            return EmotionalTone.EMPATHETIC
        else:
            return EmotionalTone.NEUTRAL

    def _detect_sarcasm(self, text: str, tokens: List[str]) -> Tuple[bool, float]:
        sarcasm_score = 0.0
        indicators_found = 0
        for pattern in self.sarcasm_indicators:
            if re.search(pattern, text, re.IGNORECASE):
                sarcasm_score += 0.3
                indicators_found += 1
        positive_words = []
        negative_words = []
        for token in tokens:
            clean_token = re.sub(r'[^\w]', '', token)
            if clean_token in self.sentiment_lexicon:
                polarity, _ = self.sentiment_lexicon[clean_token]
                if polarity > 0.4:
                    positive_words.append(clean_token)
                elif polarity < -0.4:
                    negative_words.append(clean_token)
        if positive_words and len(positive_words) == 1 and not negative_words:
            if re.search(r'[.]{2,}|[!]{2,}', text):
                sarcasm_score += 0.2
                indicators_found += 1
        if positive_words and negative_words:
            sarcasm_score += 0.1
        confidence = min(1.0, sarcasm_score)
        is_sarcastic = confidence > 0.4 and indicators_found >= 1
        return is_sarcastic, confidence

    def _calculate_toxicity_score(self, text: str, polarity: float, tone: EmotionalTone) -> float:
        base_toxicity = 0.0
        if polarity < -0.5:
            base_toxicity = abs(polarity)
        tone_multipliers = {
            EmotionalTone.THREATENING: 2.0,
            EmotionalTone.AGGRESSIVE: 1.8,
            EmotionalTone.HOSTILE: 1.6,
            EmotionalTone.CONDESCENDING: 1.3,
            EmotionalTone.DISMISSIVE: 1.2,
            EmotionalTone.SARCASTIC: 1.1,
            EmotionalTone.NEUTRAL: 1.0,
            EmotionalTone.SUPPORTIVE: 0.5,
            EmotionalTone.EMPATHETIC: 0.3
        }
        tone_multiplier = tone_multipliers.get(tone, 1.0)
        toxicity = base_toxicity * tone_multiplier
        toxic_patterns = [r'kill\s+(yourself|urself)', r'go\s+die', r'end\s+your\s+life', r'nobody\s+loves\s+you', r'you\s+should\s+die']
        for pattern in toxic_patterns:
            if re.search(pattern, text, re.IGNORECASE):
                toxicity += 0.5
        if re.search(r'[A-Z]{5,}', text):
            toxicity += 0.2
        if re.search(r'[!?]{4,}', text):
            toxicity += 0.1
        return min(1.0, toxicity)

    def _determine_polarity(self, polarity_score: float) -> SentimentPolarity:
        if polarity_score <= -0.6:
            return SentimentPolarity.VERY_NEGATIVE
        elif polarity_score <= -0.2:
            return SentimentPolarity.NEGATIVE
        elif polarity_score >= 0.6:
            return SentimentPolarity.VERY_POSITIVE
        elif polarity_score >= 0.2:
            return SentimentPolarity.POSITIVE
        else:
            return SentimentPolarity.NEUTRAL

    def _extract_key_phrases(self, text: str, tokens: List[str]) -> List[str]:
        key_phrases: List[str] = []
        for token in tokens:
            clean_token = re.sub(r'[^\w]', '', token)
            if clean_token in self.sentiment_lexicon:
                key_phrases.append(token)
        for tone, patterns in self.emotional_patterns.items():
            for pattern in patterns:
                matches = re.findall(pattern, text, re.IGNORECASE)
                if matches:
                    # regex groups may return tuples
                    for m in matches:
                        if isinstance(m, tuple):
                            key_phrases.extend([x for x in m if x])
                        else:
                            key_phrases.append(m)
        return list(dict.fromkeys(key_phrases))[:5]

    def _extract_emotional_indicators(self, text: str, tone: EmotionalTone) -> List[str]:
        indicators: List[str] = []
        if re.search(r'[A-Z]{4,}', text):
            indicators.append("ALL CAPS usage")
        if re.search(r'[!]{2,}', text):
            indicators.append("Excessive exclamation marks")
        if re.search(r'[?]{2,}', text):
            indicators.append("Multiple question marks")
        if tone in self.emotional_patterns:
            for pattern in self.emotional_patterns[tone]:
                if re.search(pattern, text, re.IGNORECASE):
                    indicators.append(f"Pattern: {pattern}")
        return indicators

    def _calculate_confidence(self, intensity: float, token_count: int, context: Optional[Dict]) -> float:
        base_confidence = min(0.9, max(0.0, intensity))
        if token_count < 3:
            base_confidence *= 0.7
        elif token_count > 20:
            base_confidence = min(1.0, base_confidence * 1.1)
        context = context or {}
        if context.get('user_history'):
            base_confidence = min(1.0, base_confidence * 1.1)
        if context.get('conversation_context'):
            base_confidence = min(1.0, base_confidence * 1.05)
        return base_confidence

    def _create_neutral_result(self) -> SentimentResult:
        return SentimentResult(
            polarity=SentimentPolarity.NEUTRAL,
            emotional_tone=EmotionalTone.NEUTRAL,
            confidence=0.0,
            intensity=0.0,
            key_phrases=[],
            emotional_indicators=[],
            toxicity_score=0.0
        )

    def analyze_conversation_sentiment(self, messages: List[Tuple[str, Dict]]) -> Dict[str, Any]:
        sentiment_timeline: List[Dict[str, Any]] = []
        escalation_detected = False
        overall_tone = EmotionalTone.NEUTRAL
        for message, context in messages:
            try:
                result = self.analyze_sentiment(message, context)
                sentiment_timeline.append({
                    'polarity': result.polarity.value,
                    'tone': result.emotional_tone.value,
                    'toxicity': result.toxicity_score,
                    'timestamp': context.get('timestamp', 0)
                })
            except Exception as e:
                logger.exception("Error analyzing message in conversation")
        if len(sentiment_timeline) >= 2:
            toxicity_trend = [s['toxicity'] for s in sentiment_timeline[-3:]]
            if len(toxicity_trend) >= 2 and toxicity_trend[-1] > toxicity_trend[0] + 0.3:
                escalation_detected = True
        avg_toxicity = sum(s['toxicity'] for s in sentiment_timeline) / len(sentiment_timeline) if sentiment_timeline else 0
        if avg_toxicity > 0.6:
            overall_tone = EmotionalTone.HOSTILE
        elif avg_toxicity > 0.4:
            overall_tone = EmotionalTone.AGGRESSIVE
        return {
            'sentiment_timeline': sentiment_timeline,
            'escalation_detected': escalation_detected,
            'overall_tone': overall_tone.value,
            'average_toxicity': round(avg_toxicity, 3),
            'conversation_risk_score': min(1.0, avg_toxicity + (0.2 if escalation_detected else 0))
        }

    def batch_analyze(self, texts: List[str], contexts: Optional[List[Dict]] = None) -> List[SentimentResult]:
        if contexts is None:
            contexts = [{}] * len(texts)
        results: List[SentimentResult] = []
        for text, context in zip(texts, contexts):
            try:
                results.append(self.analyze_sentiment(text, context))
            except Exception:
                logger.exception("Error analyzing batch text")
                results.append(self._create_neutral_result())
        return results

    def get_sentiment_statistics(self, results: List[SentimentResult]) -> Dict[str, Any]:
        if not results:
            return {}
        polarities = [r.polarity.value for r in results]
        tones = [r.emotional_tone.value for r in results]
        toxicities = [r.toxicity_score for r in results]
        return {
            'total_analyzed': len(results),
            'average_polarity': sum(polarities) / len(polarities),
            'average_toxicity': sum(toxicities) / len(toxicities),
            'tone_distribution': dict(Counter(tones)),
            'high_toxicity_count': sum(1 for t in toxicities if t > 0.6),
            'negative_sentiment_ratio': sum(1 for p in polarities if p < 0) / len(polarities)
        }