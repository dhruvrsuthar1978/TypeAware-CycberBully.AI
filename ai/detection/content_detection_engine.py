"""
content_detection_engine.py
Core AI detection engine for TypeAware
Handles real-time content analysis using regex, NLP, and fuzzy matching
"""

import re
import time
import json
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass
from enum import IntEnum
from difflib import SequenceMatcher
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SeverityLevel(IntEnum):
    """Enumeration for severity levels"""
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    CRITICAL = 4

@dataclass
class Detection:
    """Data class for individual detection results"""
    detection_type: str
    category: str
    severity: int
    match: str
    position: int
    confidence: float
    method: str
    actual_word: Optional[str] = None

@dataclass
class DetectionResult:
    """Data class for complete detection analysis result"""
    is_abusive: bool
    risk_score: float
    risk_level: str
    detections: List[Detection]
    suggestions: List[str]
    categories: List[str]
    confidence: float
    processing_time: float

class ContentDetectionEngine:
    """
    Main content detection engine that combines multiple detection methods
    including regex patterns, word matching, and fuzzy string matching
    """
    
    def __init__(self):
        self.severity = SeverityLevel
        self.abusive_patterns = self._initialize_patterns()
        
        # Performance optimization
        self.detection_cache = {}
        self.max_cache_size = 1000
        
        # Statistics tracking
        self.stats = {
            'total_scanned': 0,
            'threats_detected': 0,
            'false_positives': 0,
            'categories': {},
            'cache_hits': 0,
            'cache_misses': 0
        }
        
        logger.info("ContentDetectionEngine initialized successfully")

    def _initialize_patterns(self) -> Dict[str, Dict]:
        """Initialize detection patterns and word lists for different categories"""
        return {
            'harassment': {
                'words': [
                    'idiot', 'stupid', 'moron', 'loser', 'pathetic', 'worthless',
                    'disgusting', 'horrible', 'terrible', 'awful', 'useless', 'trash',
                    'garbage', 'scum', 'pig', 'animal', 'freak', 'weirdo'
                ],
                'patterns': [
                    r'you\s+(are|r)\s+(so\s+)?(stupid|dumb|idiotic|pathetic)',
                    r'kill\s+yourself',
                    r'go\s+die',
                    r'nobody\s+likes\s+you',
                    r'you\s+should\s+die',
                    r'end\s+your\s+life',
                    r'waste\s+of\s+space',
                    r'you\s+suck\s+at\s+everything'
                ],
                'severity': self.severity.HIGH
            },
            
            'hate_speech': {
                'words': [
                    'racist', 'bigot', 'nazi', 'supremacist', 'fascist',
                    'terrorist', 'radical', 'extremist', 'discrimination'
                ],
                'patterns': [
                    r'all\s+\w+\s+are\s+(bad|evil|stupid|inferior)',
                    r'i\s+hate\s+all\s+\w+',
                    r'\w+\s+people\s+are\s+(inferior|superior|dangerous)',
                    r'death\s+to\s+all\s+\w+',
                    r'\w+\s+don\'t\s+belong\s+here',
                    r'go\s+back\s+to\s+your\s+country'
                ],
                'severity': self.severity.CRITICAL
            },
            
            'spam': {
                'words': [
                    'buy now', 'click here', 'free money', 'guaranteed win',
                    'limited time', 'act now', 'special offer', 'earn fast',
                    'work from home', 'make money', 'get rich', 'no experience',
                    'miracle cure', 'lose weight fast'
                ],
                'patterns': [
                    r'click\s+here\s+to\s+(win|earn|get)',
                    r'free\s+\$\d+',
                    r'guaranteed\s+(income|money|win)',
                    r'work\s+from\s+home\s+\$\d+',
                    r'(bit\.ly|tinyurl|goo\.gl|t\.co)\/\w+',
                    r'earn\s+\$\d+\s+per\s+(day|hour|week)',
                    r'lose\s+\d+\s+pounds\s+in\s+\d+\s+days'
                ],
                'severity': self.severity.LOW
            },
            
            'threats': {
                'words': [
                    'kill', 'murder', 'destroy', 'hurt', 'harm', 'attack',
                    'violence', 'weapon', 'bomb', 'shoot', 'stab', 'beat',
                    'torture', 'eliminate', 'annihilate', 'crush', 'demolish'
                ],
                'patterns': [
                    r'i\s+will\s+(kill|hurt|harm|destroy)',
                    r'gonna\s+(kill|hurt|destroy|attack)',
                    r'watch\s+your\s+back',
                    r'you\s+(will|gonna)\s+pay',
                    r'i\s+know\s+where\s+you\s+live',
                    r'meet\s+me\s+(outside|irl)',
                    r'i\'ll\s+find\s+you',
                    r'you\'re\s+dead'
                ],
                'severity': self.severity.CRITICAL
            },
            
            'cyberbullying': {
                'words': [
                    'ugly', 'fat', 'weird', 'freak', 'reject', 'outcast',
                    'loner', 'embarrassing', 'shameful', 'cringe', 'pathetic',
                    'failure', 'disappointment', 'nobody', 'worthless'
                ],
                'patterns': [
                    r'everyone\s+hates\s+you',
                    r'you\s+have\s+no\s+friends',
                    r'why\s+don\'t\s+you\s+just\s+leave',
                    r'nobody\s+wants\s+you\s+here',
                    r'you\'re\s+such\s+a\s+(loser|failure)',
                    r'go\s+back\s+to\s+your\s+cave',
                    r'you\s+don\'t\s+belong'
                ],
                'severity': self.severity.HIGH
            },
            
            'sexual_harassment': {
                'words': [
                    'sexy', 'hot', 'beautiful', 'gorgeous', 'attractive'
                ],
                'patterns': [
                    r'send\s+me\s+(pics|photos)',
                    r'what\s+are\s+you\s+wearing',
                    r'you\s+look\s+(hot|sexy)',
                    r'wanna\s+(hook\s+up|meet)',
                    r'dtf\?',
                    r'netflix\s+and\s+chill'
                ],
                'severity': self.severity.HIGH
            }
        }

    def detect_abusive_content(self, text: str, context: Dict[str, Any] = None) -> DetectionResult:
        """
        Main detection method that analyzes text for abusive content
        
        Args:
            text: Text content to analyze
            context: Additional context like platform, user history, etc.
            
        Returns:
            DetectionResult object with analysis results
        """
        start_time = time.time()
        self.stats['total_scanned'] += 1
        
        # Input validation
        if not text or not isinstance(text, str):
            return self._create_empty_result(time.time() - start_time)
        
        context = context or {}
        
        # Check cache first
        cache_key = self._generate_cache_key(text, context)
        if cache_key in self.detection_cache:
            self.stats['cache_hits'] += 1
            cached_result = self.detection_cache[cache_key]
            cached_result.processing_time = time.time() - start_time
            return cached_result
        
        self.stats['cache_misses'] += 1
        
        # Preprocess text
        preprocessed_text = self._preprocess_text(text)
        
        # Run detection for each category
        all_detections = []
        for category, config in self.abusive_patterns.items():
            category_detections = self._detect_category(
                preprocessed_text, text, category, config, context
            )
            all_detections.extend(category_detections)
        
        # Calculate risk score and create result
        result = self._calculate_risk_score(all_detections, text, context)
        result.processing_time = time.time() - start_time
        
        # Update statistics
        self._update_stats(result)
        
        # Cache the result
        self._cache_result(cache_key, result)
        
        return result

    def _preprocess_text(self, text: str) -> str:
        """Preprocess text for better detection accuracy"""
        # Convert to lowercase
        text = text.lower()
        
        # Replace common obfuscation techniques
        obfuscation_map = {
            '@': 'a', '3': 'e', '1': 'i', '0': 'o', '5': 's',
            '$': 's', '4': 'a', '7': 't', '+': 't'
        }
        
        for char, replacement in obfuscation_map.items():
            text = text.replace(char, replacement)
        
        # Remove excessive punctuation but keep some structure
        text = re.sub(r'[^\w\s]', ' ', text)
        
        # Normalize whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        
        return text

    def _detect_category(self, preprocessed_text: str, original_text: str, 
                        category: str, config: Dict, context: Dict) -> List[Detection]:
        """Detect abusive content for a specific category"""
        detections = []
        
        # Word-based detection with fuzzy matching
        word_detections = self._detect_words(
            preprocessed_text, config['words'], category, config['severity']
        )
        detections.extend(word_detections)
        
        # Pattern-based detection using regex
        pattern_detections = self._detect_patterns(
            original_text, config['patterns'], category, config['severity']
        )
        detections.extend(pattern_detections)
        
        # Adjust detections based on context
        adjusted_detections = self._adjust_for_context(detections, context)
        
        return adjusted_detections

    def _detect_words(self, text: str, words: List[str], 
                     category: str, severity: int) -> List[Detection]:
        """Detect abusive words with fuzzy matching support"""
        detections = []
        text_words = text.split()
        
        for word in words:
            for i, text_word in enumerate(text_words):
                # Exact match
                if text_word == word:
                    detections.append(Detection(
                        detection_type='word',
                        category=category,
                        severity=severity,
                        match=word,
                        position=i,
                        confidence=1.0,
                        method='exact'
                    ))
                # Fuzzy match using SequenceMatcher
                elif self._fuzzy_match(text_word, word, threshold=0.8):
                    similarity = self._calculate_similarity(text_word, word)
                    detections.append(Detection(
                        detection_type='word',
                        category=category,
                        severity=max(1, severity - 1),  # Reduce severity for fuzzy matches
                        match=word,
                        position=i,
                        confidence=similarity,
                        method='fuzzy',
                        actual_word=text_word
                    ))
        
        return detections

    def _detect_patterns(self, text: str, patterns: List[str], 
                        category: str, severity: int) -> List[Detection]:
        """Detect abusive patterns using regex"""
        detections = []
        
        for pattern in patterns:
            try:
                matches = re.finditer(pattern, text, re.IGNORECASE)
                for match in matches:
                    detections.append(Detection(
                        detection_type='pattern',
                        category=category,
                        severity=severity,
                        match=match.group(0),
                        position=match.start(),
                        confidence=0.9,
                        method='regex'
                    ))
            except re.error as e:
                logger.warning(f"Invalid regex pattern '{pattern}': {e}")
                continue
        
        return detections

    def _fuzzy_match(self, str1: str, str2: str, threshold: float = 0.8) -> bool:
        """Check if two strings are similar enough using fuzzy matching"""
        if len(str1) < 3 or len(str2) < 3:  # Skip very short words
            return False
        
        similarity = self._calculate_similarity(str1, str2)
        return similarity >= threshold

    def _calculate_similarity(self, str1: str, str2: str) -> float:
        """Calculate similarity between two strings using SequenceMatcher"""
        return SequenceMatcher(None, str1, str2).ratio()

    def _adjust_for_context(self, detections: List[Detection], 
                           context: Dict) -> List[Detection]:
        """Adjust detection results based on context"""
        if not context:
            return detections
        
        adjusted_detections = []
        
        for detection in detections:
            adjusted_detection = Detection(
                detection_type=detection.detection_type,
                category=detection.category,
                severity=detection.severity,
                match=detection.match,
                position=detection.position,
                confidence=detection.confidence,
                method=detection.method,
                actual_word=detection.actual_word
            )
            
            # Platform-specific adjustments
            if 'platform' in context:
                platform = context['platform'].lower()
                if platform == 'twitter' and detection.category == 'harassment':
                    adjusted_detection.severity = max(1, int(detection.severity * 0.8))
                elif platform == 'linkedin':
                    adjusted_detection.severity = min(4, int(detection.severity * 1.2))
                elif platform in ['gaming', 'twitch', 'discord']:
                    if detection.category in ['harassment', 'cyberbullying']:
                        adjusted_detection.severity = max(1, int(detection.severity * 0.7))
            
            # User history adjustments
            if 'user_history' in context:
                history = context['user_history']
                if history.get('repeat_offender', False):
                    adjusted_detection.severity = min(4, adjusted_detection.severity + 1)
                elif history.get('false_positive_history', 0) > 3:
                    adjusted_detection.confidence *= 0.8
            
            adjusted_detections.append(adjusted_detection)
        
        return adjusted_detections

    def _calculate_risk_score(self, detections: List[Detection], text: str, 
                             context: Dict) -> DetectionResult:
        """Calculate overall risk score and create final result"""
        if not detections:
            return self._create_empty_result(0)
        
        # Calculate base risk score
        total_severity = sum(d.severity * d.confidence for d in detections)
        max_possible_severity = len(detections) * 4  # Max severity is 4
        
        base_score = (total_severity / max_possible_severity) * 100 if max_possible_severity > 0 else 0
        
        # Adjust for detection density
        text_length = len(text.split())
        detection_density = len(detections) / text_length if text_length > 0 else 0
        density_multiplier = min(1.5, 1 + (detection_density * 2))
        
        final_score = min(100, base_score * density_multiplier)
        
        # Determine risk level
        if final_score >= 80:
            risk_level = 'CRITICAL'
        elif final_score >= 60:
            risk_level = 'HIGH'
        elif final_score >= 30:
            risk_level = 'MEDIUM'
        elif final_score > 0:
            risk_level = 'LOW'
        else:
            risk_level = 'NONE'
        
        # Extract unique categories
        categories = list(set(d.category for d in detections))
        
        # Calculate overall confidence
        avg_confidence = sum(d.confidence for d in detections) / len(detections)
        
        # Generate suggestions
        suggestions = self._generate_suggestions(detections, text)
        
        return DetectionResult(
            is_abusive=final_score > 0,
            risk_score=round(final_score, 2),
            risk_level=risk_level,
            detections=detections,
            suggestions=suggestions,
            categories=categories,
            confidence=round(avg_confidence, 2),
            processing_time=0  # Will be set by caller
        )

    def _generate_suggestions(self, detections: List[Detection], text: str) -> List[str]:
        """Generate suggestions for improving the content"""
        suggestions = []
        categories = set(d.category for d in detections)
        
        suggestion_map = {
            'harassment': "Consider using more respectful language when expressing disagreement.",
            'hate_speech': "Please avoid language that targets or discriminates against groups of people.",
            'spam': "Focus on genuine communication rather than promotional content.",
            'threats': "Express your feelings without threatening language or implications of harm.",
            'cyberbullying': "Try to communicate constructively rather than attacking the person.",
            'sexual_harassment': "Keep your communication appropriate and professional."
        }
        
        for category in categories:
            if category in suggestion_map:
                suggestions.append(suggestion_map[category])
        
        return suggestions

    def _create_empty_result(self, processing_time: float) -> DetectionResult:
        """Create an empty detection result for clean text"""
        return DetectionResult(
            is_abusive=False,
            risk_score=0.0,
            risk_level='NONE',
            detections=[],
            suggestions=[],
            categories=[],
            confidence=1.0,
            processing_time=processing_time
        )

    def _generate_cache_key(self, text: str, context: Dict) -> str:
        """Generate a cache key for the given text and context"""
        context_str = json.dumps(context, sort_keys=True) if context else "{}"
        return f"{hash(text[:100])}_{hash(context_str)}"

    def _cache_result(self, key: str, result: DetectionResult) -> None:
        """Cache detection result with size management"""
        if len(self.detection_cache) >= self.max_cache_size:
            # Remove oldest entry (simple FIFO)
            oldest_key = next(iter(self.detection_cache))
            del self.detection_cache[oldest_key]
        
        self.detection_cache[key] = result

    def _update_stats(self, result: DetectionResult) -> None:
        """Update internal statistics"""
        if result.is_abusive:
            self.stats['threats_detected'] += 1
            
            for category in result.categories:
                if category not in self.stats['categories']:
                    self.stats['categories'][category] = 0
                self.stats['categories'][category] += 1

    def get_stats(self) -> Dict[str, Any]:
        """Get detection statistics"""
        total_requests = self.stats['cache_hits'] + self.stats['cache_misses']
        cache_hit_rate = (self.stats['cache_hits'] / total_requests * 100) if total_requests > 0 else 0
        
        return {
            'total_scanned': self.stats['total_scanned'],
            'threats_detected': self.stats['threats_detected'],
            'false_positives': self.stats['false_positives'],
            'categories': self.stats['categories'],
            'cache_hit_rate': round(cache_hit_rate, 2),
            'detection_rate': round(
                (self.stats['threats_detected'] / self.stats['total_scanned'] * 100) 
                if self.stats['total_scanned'] > 0 else 0, 2
            )
        }

    def reset_stats(self) -> None:
        """Reset all statistics"""
        self.stats = {
            'total_scanned': 0,
            'threats_detected': 0,
            'false_positives': 0,
            'categories': {},
            'cache_hits': 0,
            'cache_misses': 0
        }

    def clear_cache(self) -> None:
        """Clear the detection cache"""
        self.detection_cache.clear()

    def add_custom_pattern(self, category: str, pattern: str, severity: int) -> bool:
        """Add a custom detection pattern"""
        try:
            if category not in self.abusive_patterns:
                self.abusive_patterns[category] = {
                    'words': [],
                    'patterns': [],
                    'severity': severity
                }
            
            # Test if pattern is valid regex
            re.compile(pattern)
            self.abusive_patterns[category]['patterns'].append(pattern)
            logger.info(f"Added custom pattern to {category}: {pattern}")
            return True
        except re.error as e:
            logger.error(f"Invalid regex pattern '{pattern}': {e}")
            return False

    def remove_pattern(self, category: str, pattern: str) -> bool:
        """Remove a pattern from detection"""
        if category in self.abusive_patterns and pattern in self.abusive_patterns[category]['patterns']:
            self.abusive_patterns[category]['patterns'].remove(pattern)
            logger.info(f"Removed pattern from {category}: {pattern}")
            return True
        return False