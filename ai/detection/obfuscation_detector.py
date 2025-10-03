"""
obfuscation_detector.py
Advanced obfuscation detection for TypeAware
Handles disguised formats like "id!ot", "s t u p i d", "1d10t", etc.
"""

import re
import string
from typing import Dict, List, Tuple, Set
from dataclasses import dataclass
from difflib import SequenceMatcher
import logging

logger = logging.getLogger(__name__)

@dataclass
class ObfuscationMatch:
    """Data class for obfuscation detection results"""
    original_word: str
    obfuscated_text: str
    confidence: float
    obfuscation_type: str
    position: Tuple[int, int]  # start, end positions
    transformation_used: str

class ObfuscationDetector:
    """
    Detects various forms of text obfuscation used to bypass content filters
    Handles character substitution, spacing, special characters, etc.
    """
    
    def __init__(self):
        self.character_substitutions = self._init_character_map()
        self.leet_speak_map = self._init_leet_speak()
        self.unicode_variants = self._init_unicode_variants()
        self.common_separators = [' ', '.', '-', '_', '*', '!', '@', '#', '$', '%', '^', '&']
        
        # Precompiled regex patterns for performance
        self.patterns = {
            'excessive_spacing': re.compile(r'(\w)\s+(\w)', re.IGNORECASE),
            'special_char_replacement': re.compile(r'[^\w\s]', re.IGNORECASE),
            'number_substitution': re.compile(r'\d+'),
            'repeated_chars': re.compile(r'(.)\1{2,}'),
            'mixed_case': re.compile(r'[a-z][A-Z]|[A-Z][a-z]'),
        }
        
        logger.info("ObfuscationDetector initialized")

    def _init_character_map(self) -> Dict[str, List[str]]:
        """Initialize character substitution mapping"""
        return {
            'a': ['@', '4', 'α', 'à', 'á', 'â', 'ä', 'ã', 'å', 'ā'],
            'e': ['3', 'ε', 'è', 'é', 'ê', 'ë', 'ē', '€'],
            'i': ['1', '!', 'ι', 'ì', 'í', 'î', 'ï', 'ī', '|'],
            'o': ['0', 'ο', 'ò', 'ó', 'ô', 'ö', 'õ', 'ō', '°'],
            'u': ['υ', 'ù', 'ú', 'û', 'ü', 'ū', 'µ'],
            's': ['5', '$', 'ς', 'š', 'ş', '§'],
            't': ['7', '+', 'τ', 'ť', 'ţ'],
            'l': ['1', '|', 'ι', 'ĺ', 'ł'],
            'g': ['9', 'ğ'],
            'b': ['6', 'β'],
            'z': ['2'],
            'c': ['(', 'ç', 'ć', 'č'],
            'n': ['η', 'ñ', 'ń', 'ň'],
            'r': ['γ', 'ř'],
            'h': ['#'],
            'k': ['κ'],
            'm': ['μ'],
            'p': ['ρ'],
            'w': ['ω', 'ω'],
            'x': ['χ', '×'],
            'y': ['ψ', 'ý', 'ÿ']
        }

    def _init_leet_speak(self) -> Dict[str, str]:
        """Initialize leet speak mappings"""
        return {
            '@': 'a', '4': 'a', '3': 'e', '1': 'i', '!': 'i',
            '0': 'o', '5': 's', '$': 's', '7': 't', '+': 't',
            '|': 'l', '9': 'g', '6': 'b', '2': 'z', '(': 'c',
            '#': 'h', '×': 'x'
        }

    def _init_unicode_variants(self) -> Dict[str, List[str]]:
        """Initialize unicode character variants"""
        return {
            'a': ['а', 'α', 'ɑ', 'ａ'],  # Cyrillic, Greek, Latin variants
            'e': ['е', 'ε', 'ｅ'],
            'o': ['о', 'ο', 'ｏ', '᧐'],
            'p': ['р', 'ρ', 'ｐ'],
            'c': ['с', 'ｃ'],
            'x': ['х', 'χ', 'ｘ'],
            'y': ['у', 'ψ', 'ｙ'],
            'k': ['κ', 'ｋ'],
            'n': ['η', 'ｎ'],
            'h': ['һ', 'ｈ'],
            'b': ['ь', 'β', 'ｂ'],
            'm': ['м', 'μ', 'ｍ'],
            'r': ['г', 'γ', 'ｒ'],
            't': ['т', 'τ', 'ｔ'],
            'i': ['і', 'ι', 'ｉ'],
            'u': ['υ', 'ｕ'],
            's': ['ѕ', 'ς', 'ｓ']
        }

    def detect_obfuscated_words(self, text: str, target_words: List[str]) -> List[ObfuscationMatch]:
        """
        Main method to detect obfuscated versions of target words
        
        Args:
            text: Input text to analyze
            target_words: List of words to check for obfuscated versions
            
        Returns:
            List of ObfuscationMatch objects for detected obfuscations
        """
        matches = []
        
        for word in target_words:
            word_matches = self._find_obfuscated_word(text, word.lower())
            matches.extend(word_matches)
        
        # Remove duplicates and sort by confidence
        unique_matches = self._deduplicate_matches(matches)
        return sorted(unique_matches, key=lambda x: x.confidence, reverse=True)

    def _find_obfuscated_word(self, text: str, target_word: str) -> List[ObfuscationMatch]:
        """Find all obfuscated versions of a specific word in text"""
        matches = []
        
        # Method 1: Character substitution detection
        matches.extend(self._detect_character_substitution(text, target_word))
        
        # Method 2: Spacing obfuscation detection
        matches.extend(self._detect_spacing_obfuscation(text, target_word))
        
        # Method 3: Mixed obfuscation (combination of techniques)
        matches.extend(self._detect_mixed_obfuscation(text, target_word))
        
        # Method 4: Unicode variant detection
        matches.extend(self._detect_unicode_variants(text, target_word))
        
        # Method 5: Reverse and scrambled text
        matches.extend(self._detect_scrambled_text(text, target_word))
        
        return matches

    def _detect_character_substitution(self, text: str, target_word: str) -> List[ObfuscationMatch]:
        """Detect character substitution obfuscation (e.g., 'id!ot' for 'idiot')"""
        matches = []
        text_lower = text.lower()
        
        # Generate possible obfuscated versions
        obfuscated_variants = self._generate_substitution_variants(target_word)
        
        for variant in obfuscated_variants:
            pattern = re.compile(re.escape(variant), re.IGNORECASE)
            for match in pattern.finditer(text):
                confidence = self._calculate_substitution_confidence(variant, target_word)
                if confidence > 0.6:  # Threshold for substitution matches
                    matches.append(ObfuscationMatch(
                        original_word=target_word,
                        obfuscated_text=match.group(),
                        confidence=confidence,
                        obfuscation_type='character_substitution',
                        position=(match.start(), match.end()),
                        transformation_used=f"{target_word} -> {variant}"
                    ))
        
        return matches

    def _detect_spacing_obfuscation(self, text: str, target_word: str) -> List[ObfuscationMatch]:
        """Detect spacing obfuscation (e.g., 's t u p i d' for 'stupid')"""
        matches = []
        
        # Create spaced version patterns
        spaced_patterns = [
            ' '.join(target_word),  # 's t u p i d'
            ' . '.join(target_word),  # 's . t . u . p . i . d'
            ' - '.join(target_word),  # 's - t - u - p - i - d'
            ' _ '.join(target_word),  # 's _ t _ u _ p _ i _ d'
        ]
        
        for separator in self.common_separators:
            spaced_patterns.append(separator.join(target_word))
        
        for pattern in spaced_patterns:
            regex_pattern = re.compile(re.escape(pattern), re.IGNORECASE)
            for match in regex_pattern.finditer(text):
                confidence = 0.8  # High confidence for spacing obfuscation
                matches.append(ObfuscationMatch(
                    original_word=target_word,
                    obfuscated_text=match.group(),
                    confidence=confidence,
                    obfuscation_type='spacing_obfuscation',
                    position=(match.start(), match.end()),
                    transformation_used=f"spaced with '{pattern}'"
                ))
        
        return matches

    def _detect_mixed_obfuscation(self, text: str, target_word: str) -> List[ObfuscationMatch]:
        """Detect mixed obfuscation (combination of substitution and spacing)"""
        matches = []
        
        # Generate variants with both substitution and spacing
        base_variants = self._generate_substitution_variants(target_word)
        
        for variant in base_variants[:10]:  # Limit to prevent explosion
            # Apply spacing to substituted variants
            for separator in [' ', '.', '-', '_']:
                spaced_variant = separator.join(variant)
                pattern = re.compile(re.escape(spaced_variant), re.IGNORECASE)
                
                for match in pattern.finditer(text):
                    confidence = self._calculate_mixed_confidence(spaced_variant, target_word)
                    if confidence > 0.5:
                        matches.append(ObfuscationMatch(
                            original_word=target_word,
                            obfuscated_text=match.group(),
                            confidence=confidence,
                            obfuscation_type='mixed_obfuscation',
                            position=(match.start(), match.end()),
                            transformation_used=f"substitution + spacing: {spaced_variant}"
                        ))
        
        return matches

    def _detect_unicode_variants(self, text: str, target_word: str) -> List[ObfuscationMatch]:
        """Detect unicode character variants"""
        matches = []
        
        # Generate unicode variants
        unicode_variants = self._generate_unicode_variants(target_word)
        
        for variant in unicode_variants:
            # Use fuzzy matching for unicode variants
            for i in range(len(text) - len(variant) + 1):
                substring = text[i:i + len(variant)]
                similarity = SequenceMatcher(None, variant.lower(), substring.lower()).ratio()
                
                if similarity > 0.7:  # Threshold for unicode similarity
                    matches.append(ObfuscationMatch(
                        original_word=target_word,
                        obfuscated_text=substring,
                        confidence=similarity,
                        obfuscation_type='unicode_variants',
                        position=(i, i + len(variant)),
                        transformation_used=f"unicode variant: {variant}"
                    ))
        
        return matches

    def _detect_scrambled_text(self, text: str, target_word: str) -> List[ObfuscationMatch]:
        """Detect scrambled or reversed text"""
        matches = []
        
        # Check for reversed word
        reversed_word = target_word[::-1]
        pattern = re.compile(re.escape(reversed_word), re.IGNORECASE)
        for match in pattern.finditer(text):
            matches.append(ObfuscationMatch(
                original_word=target_word,
                obfuscated_text=match.group(),
                confidence=0.8,
                obfuscation_type='reversed_text',
                position=(match.start(), match.end()),
                transformation_used=f"reversed: {reversed_word}"
            ))
        
        # Check for simple scrambled versions (only for short words)
        if len(target_word) <= 6:
            scrambled_variants = self._generate_scrambled_variants(target_word)
            for variant in scrambled_variants[:5]:  # Limit variants
                pattern = re.compile(re.escape(variant), re.IGNORECASE)
                for match in pattern.finditer(text):
                    confidence = 0.6  # Lower confidence for scrambled text
                    matches.append(ObfuscationMatch(
                        original_word=target_word,
                        obfuscated_text=match.group(),
                        confidence=confidence,
                        obfuscation_type='scrambled_text',
                        position=(match.start(), match.end()),
                        transformation_used=f"scrambled: {variant}"
                    ))
        
        return matches

    def _generate_substitution_variants(self, word: str, max_variants: int = 20) -> List[str]:
        """Generate character substitution variants of a word"""
        variants = set()
        variants.add(word)  # Original word
        
        # Single character substitutions
        for i, char in enumerate(word):
            if char.lower() in self.character_substitutions:
                for substitute in self.character_substitutions[char.lower()]:
                    variant = word[:i] + substitute + word[i+1:]
                    variants.add(variant)
                    if len(variants) >= max_variants:
                        break
        
        # Leet speak substitutions
        leet_word = word
        for leet_char, normal_char in self.leet_speak_map.items():
            # Replace normal_char with leet_char in the word
            leet_word = leet_word.replace(normal_char, leet_char)
        variants.add(leet_word)
        
        # Add common leet speak variants manually for better coverage
        common_leet_variants = {
            'hello': ['h3llo', 'he11o', 'h311o', 'h3ll0', 'he1lo'],
            'stupid': ['5tupid', 'stup1d', 'stup!d', '5tup1d'],
            'idiot': ['1diot', 'id!ot', '1d10t', 'id10t'],
            'hate': ['h4te', 'ha7e', 'h@te'],
            'kill': ['k1ll', 'ki11', 'k!ll']
        }
        if word in common_leet_variants:
            for variant in common_leet_variants[word]:
                variants.add(variant)
        
        return list(variants)[:max_variants]

    def _generate_unicode_variants(self, word: str, max_variants: int = 10) -> List[str]:
        """Generate unicode variants of a word"""
        variants = set()
        
        for i, char in enumerate(word):
            if char.lower() in self.unicode_variants:
                for unicode_char in self.unicode_variants[char.lower()]:
                    variant = word[:i] + unicode_char + word[i+1:]
                    variants.add(variant)
                    if len(variants) >= max_variants:
                        break
        
        return list(variants)

    def _generate_scrambled_variants(self, word: str, max_variants: int = 5) -> List[str]:
        """Generate simple scrambled variants (adjacent character swaps)"""
        variants = set()
        
        # Adjacent character swaps
        for i in range(len(word) - 1):
            chars = list(word)
            chars[i], chars[i + 1] = chars[i + 1], chars[i]
            variants.add(''.join(chars))
            
            if len(variants) >= max_variants:
                break
        
        return list(variants)

    def _calculate_substitution_confidence(self, obfuscated: str, original: str) -> float:
        """Calculate confidence score for character substitution"""
        if len(obfuscated) != len(original):
            return 0.0
        
        matches = 0
        substitutions = 0
        
        for i, (o_char, t_char) in enumerate(zip(obfuscated.lower(), original.lower())):
            if o_char == t_char:
                matches += 1
            elif (t_char in self.character_substitutions and 
                  o_char in self.character_substitutions[t_char]):
                substitutions += 1
            elif o_char in self.leet_speak_map and self.leet_speak_map[o_char] == t_char:
                substitutions += 1
        
        total_chars = len(original)
        score = (matches * 1.0 + substitutions * 0.8) / total_chars
        return min(1.0, score)

    def _calculate_mixed_confidence(self, obfuscated: str, original: str) -> float:
        """Calculate confidence for mixed obfuscation"""
        # Remove separators for comparison
        cleaned_obfuscated = re.sub(r'[^\w]', '', obfuscated.lower())
        
        if len(cleaned_obfuscated) == 0:
            return 0.0
        
        # Use string similarity with penalty for complexity
        similarity = SequenceMatcher(None, cleaned_obfuscated, original.lower()).ratio()
        
        # Apply penalty for excessive obfuscation
        separator_count = len(obfuscated) - len(cleaned_obfuscated)
        penalty = min(0.3, separator_count * 0.05)
        
        return max(0.0, similarity - penalty)

    def _deduplicate_matches(self, matches: List[ObfuscationMatch]) -> List[ObfuscationMatch]:
        """Remove duplicate matches and overlapping detections"""
        if not matches:
            return []
        
        # Sort by position
        sorted_matches = sorted(matches, key=lambda x: x.position[0])
        unique_matches = []
        
        for match in sorted_matches:
            # Check if this match overlaps with any existing match
            is_duplicate = False
            for existing in unique_matches:
                if (self._positions_overlap(match.position, existing.position) and
                    match.original_word == existing.original_word):
                    # Keep the match with higher confidence
                    if match.confidence > existing.confidence:
                        unique_matches.remove(existing)
                        break
                    else:
                        is_duplicate = True
                        break
            
            if not is_duplicate:
                unique_matches.append(match)
        
        return unique_matches

    def _positions_overlap(self, pos1: Tuple[int, int], pos2: Tuple[int, int]) -> bool:
        """Check if two position ranges overlap"""
        return not (pos1[1] <= pos2[0] or pos2[1] <= pos1[0])

    def normalize_text(self, text: str) -> str:
        """
        Normalize obfuscated text back to standard form
        Useful for storing clean versions of detected content
        """
        normalized = text.lower()
        
        # Apply leet speak normalization
        for leet_char, normal_char in self.leet_speak_map.items():
            normalized = normalized.replace(leet_char, normal_char)
        
        # Apply character substitution normalization
        for normal_char, substitutes in self.character_substitutions.items():
            for substitute in substitutes:
                normalized = normalized.replace(substitute, normal_char)
        
        # Remove excessive spacing
        normalized = re.sub(r'\s+', ' ', normalized)
        
        # Remove special characters used for obfuscation
        normalized = re.sub(r'[^\w\s]', '', normalized)
        
        return normalized.strip()

    def get_obfuscation_stats(self, matches: List[ObfuscationMatch]) -> Dict[str, int]:
        """Get statistics about detected obfuscation types"""
        stats = {}
        for match in matches:
            obf_type = match.obfuscation_type
            stats[obf_type] = stats.get(obf_type, 0) + 1
        return stats