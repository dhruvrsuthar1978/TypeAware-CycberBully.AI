"""
fuzzy_matcher.py
Advanced fuzzy string matching for TypeAware
Implements multiple algorithms for detecting similar text patterns
"""

import re
import math
from typing import List, Tuple, Dict, Optional, Set
from dataclasses import dataclass
from difflib import SequenceMatcher
from collections import Counter
import logging

logger = logging.getLogger(__name__)

@dataclass
class FuzzyMatch:
    """Data class for fuzzy matching results"""
    target_word: str
    matched_text: str
    similarity_score: float
    algorithm_used: str
    position: Tuple[int, int]
    context: str
    edit_distance: int

class FuzzyMatcher:
    """
    Advanced fuzzy string matching engine
    Combines multiple algorithms for robust text similarity detection
    """
    
    def __init__(self, min_similarity: float = 0.7):
        self.min_similarity = min_similarity
        self.algorithms = {
            'levenshtein': self._levenshtein_similarity,
            'jaro_winkler': self._jaro_winkler_similarity,
            'sequence_matcher': self._sequence_matcher_similarity,
            'jaccard': self._jaccard_similarity,
            'cosine': self._cosine_similarity,
            'n_gram': self._n_gram_similarity
        }
        
        # Phonetic similarity patterns (simple soundex-like)
        self.phonetic_groups = {
            'b': 'bp', 'c': 'ckq', 'd': 'dt', 'f': 'fv', 'g': 'gj',
            'h': 'h', 'j': 'gj', 'k': 'ckq', 'l': 'l', 'm': 'mn',
            'n': 'mn', 'p': 'bp', 'q': 'ckq', 'r': 'r', 's': 'sz',
            't': 'dt', 'v': 'fv', 'w': 'w', 'x': 'ks', 'y': 'y', 'z': 'sz'
        }
        
        logger.info("FuzzyMatcher initialized with min_similarity=%.2f", min_similarity)

    def find_fuzzy_matches(self, text: str, target_words: List[str], 
                          context_size: int = 10) -> List[FuzzyMatch]:
        """
        Find all fuzzy matches of target words in the given text
        
        Args:
            text: Text to search in
            target_words: List of words to find matches for
            context_size: Number of characters around match for context
            
        Returns:
            List of FuzzyMatch objects sorted by similarity score
        """
        all_matches = []
        text_words = self._tokenize_text(text)
        
        for target_word in target_words:
            target_lower = target_word.lower()
            
            # Check each word and word combinations
            for i, word_info in enumerate(text_words):
                word, start_pos, end_pos = word_info
                word_lower = word.lower()
                
                # Single word matching
                match = self._get_best_match(target_lower, word_lower, start_pos, end_pos, text, context_size)
                if match and match.similarity_score >= self.min_similarity:
                    all_matches.append(match)
                
                # Multi-word matching (for phrases split by obfuscation)
                if i < len(text_words) - 1:
                    next_word, next_start, next_end = text_words[i + 1]
                    combined_word = word_lower + next_word.lower()
                    combined_match = self._get_best_match(
                        target_lower, combined_word, start_pos, next_end, text, context_size
                    )
                    if (combined_match and combined_match.similarity_score >= self.min_similarity):
                        all_matches.append(combined_match)
        
        # Remove overlapping matches and sort by similarity
        unique_matches = self._remove_overlapping_matches(all_matches)
        return sorted(unique_matches, key=lambda x: x.similarity_score, reverse=True)

    def _tokenize_text(self, text: str) -> List[Tuple[str, int, int]]:
        """Tokenize text into words with position information"""
        words = []
        pattern = re.compile(r'\b\w+\b')
        
        for match in pattern.finditer(text):
            words.append((match.group(), match.start(), match.end()))
        
        return words

    def _get_best_match(self, target: str, candidate: str, start_pos: int, 
                       end_pos: int, full_text: str, context_size: int) -> Optional[FuzzyMatch]:
        """Get the best fuzzy match using multiple algorithms"""
        if len(target) == 0 or len(candidate) == 0:
            return None
        
        # Skip if length difference is too large
        length_ratio = min(len(target), len(candidate)) / max(len(target), len(candidate))
        if length_ratio < 0.4:  # Configurable threshold
            return None
        
        best_score = 0.0
        best_algorithm = ""
        best_distance = float('inf')
        
        # Try all algorithms and find the best score
        for algo_name, algo_func in self.algorithms.items():
            try:
                score = algo_func(target, candidate)
                if score > best_score:
                    best_score = score
                    best_algorithm = algo_name
                    if algo_name == 'levenshtein':
                        best_distance = self._levenshtein_distance(target, candidate)
            except Exception as e:
                logger.warning(f"Error in {algo_name} algorithm: {e}")
                continue
        
        if best_score < self.min_similarity:
            return None
        
        # Extract context around the match
        context_start = max(0, start_pos - context_size)
        context_end = min(len(full_text), end_pos + context_size)
        context = full_text[context_start:context_end].strip()
        
        return FuzzyMatch(
            target_word=target,
            matched_text=candidate,
            similarity_score=round(best_score, 3),
            algorithm_used=best_algorithm,
            position=(start_pos, end_pos),
            context=context,
            edit_distance=int(best_distance) if best_distance != float('inf') else -1
        )

    def _levenshtein_similarity(self, s1: str, s2: str) -> float:
        """Calculate similarity using Levenshtein distance"""
        distance = self._levenshtein_distance(s1, s2)
        max_len = max(len(s1), len(s2))
        if max_len == 0:
            return 1.0
        return 1.0 - (distance / max_len)

    def _levenshtein_distance(self, s1: str, s2: str) -> int:
        """Calculate Levenshtein distance between two strings"""
        if len(s1) < len(s2):
            return self._levenshtein_distance(s2, s1)
        
        if len(s2) == 0:
            return len(s1)
        
        previous_row = list(range(len(s2) + 1))
        for i, c1 in enumerate(s1):
            current_row = [i + 1]
            for j, c2 in enumerate(s2):
                insertions = previous_row[j + 1] + 1
                deletions = current_row[j] + 1
                substitutions = previous_row[j] + (c1 != c2)
                current_row.append(min(insertions, deletions, substitutions))
            previous_row = current_row
        
        return previous_row[-1]

    def _jaro_winkler_similarity(self, s1: str, s2: str) -> float:
        """Calculate Jaro-Winkler similarity"""
        jaro_score = self._jaro_similarity(s1, s2)
        
        if jaro_score < 0.7:
            return jaro_score
        
        # Calculate common prefix length (up to 4 characters)
        prefix_len = 0
        for i in range(min(len(s1), len(s2), 4)):
            if s1[i] == s2[i]:
                prefix_len += 1
            else:
                break
        
        return jaro_score + (0.1 * prefix_len * (1 - jaro_score))

    def _jaro_similarity(self, s1: str, s2: str) -> float:
        """Calculate Jaro similarity"""
        if s1 == s2:
            return 1.0
        
        len1, len2 = len(s1), len(s2)
        if len1 == 0 or len2 == 0:
            return 0.0
        
        match_distance = (max(len1, len2) // 2) - 1
        if match_distance < 0:
            match_distance = 0
        
        s1_matches = [False] * len1
        s2_matches = [False] * len2
        
        matches = 0
        transpositions = 0
        
        # Identify matches
        for i in range(len1):
            start = max(0, i - match_distance)
            end = min(i + match_distance + 1, len2)
            
            for j in range(start, end):
                if s2_matches[j] or s1[i] != s2[j]:
                    continue
                
                s1_matches[i] = True
                s2_matches[j] = True
                matches += 1
                break
        
        if matches == 0:
            return 0.0
        
        # Count transpositions
        k = 0
        for i in range(len1):
            if not s1_matches[i]:
                continue
            while not s2_matches[k]:
                k += 1
            if s1[i] != s2[k]:
                transpositions += 1
            k += 1
        
        return (matches/len1 + matches/len2 + (matches - transpositions/2)/matches) / 3.0

    def _sequence_matcher_similarity(self, s1: str, s2: str) -> float:
        """Calculate similarity using difflib SequenceMatcher"""
        return SequenceMatcher(None, s1, s2).ratio()

    def _jaccard_similarity(self, s1: str, s2: str) -> float:
        """Calculate Jaccard similarity based on character sets"""
        set1 = set(s1.lower())
        set2 = set(s2.lower())
        
        intersection = len(set1 & set2)
        union = len(set1 | set2)
        
        return intersection / union if union > 0 else 0.0

    def _cosine_similarity(self, s1: str, s2: str) -> float:
        """Calculate cosine similarity based on character frequency"""
        counter1 = Counter(s1.lower())
        counter2 = Counter(s2.lower())
        
        # Get all unique characters
        all_chars = set(counter1.keys()) | set(counter2.keys())
        
        # Create vectors
        vec1 = [counter1.get(char, 0) for char in all_chars]
        vec2 = [counter2.get(char, 0) for char in all_chars]
        
        # Calculate dot product and magnitudes
        dot_product = sum(a * b for a, b in zip(vec1, vec2))
        magnitude1 = math.sqrt(sum(a * a for a in vec1))
        magnitude2 = math.sqrt(sum(a * a for a in vec2))
        
        if magnitude1 == 0 or magnitude2 == 0:
            return 0.0
        
        return dot_product / (magnitude1 * magnitude2)

    def _n_gram_similarity(self, s1: str, s2: str, n: int = 2) -> float:
        """Calculate n-gram similarity"""
        if len(s1) < n or len(s2) < n:
            return self._sequence_matcher_similarity(s1, s2)
        
        ngrams1 = set(s1[i:i+n] for i in range(len(s1) - n + 1))
        ngrams2 = set(s2[i:i+n] for i in range(len(s2) - n + 1))
        
        intersection = len(ngrams1 & ngrams2)
        union = len(ngrams1 | ngrams2)
        
        return intersection / union if union > 0 else 0.0

    def _remove_overlapping_matches(self, matches: List[FuzzyMatch]) -> List[FuzzyMatch]:
        """Remove overlapping matches, keeping the ones with highest similarity"""
        if not matches:
            return []
        
        # Sort by similarity score (descending) then by position
        sorted_matches = sorted(matches, key=lambda x: (-x.similarity_score, x.position[0]))
        unique_matches = []
        
        for match in sorted_matches:
            is_overlapping = False
            for existing in unique_matches:
                if self._positions_overlap(match.position, existing.position):
                    is_overlapping = True
                    break
            
            if not is_overlapping:
                unique_matches.append(match)
        
        return unique_matches

    def _positions_overlap(self, pos1: Tuple[int, int], pos2: Tuple[int, int]) -> bool:
        """Check if two position ranges overlap"""
        return not (pos1[1] <= pos2[0] or pos2[1] <= pos1[0])

    def phonetic_similarity(self, s1: str, s2: str) -> float:
        """Calculate phonetic similarity using simplified soundex-like algorithm"""
        soundex1 = self._simple_soundex(s1)
        soundex2 = self._simple_soundex(s2)
        
        return self._sequence_matcher_similarity(soundex1, soundex2)

    def _simple_soundex(self, word: str) -> str:
        """Generate a simple soundex-like code for phonetic matching"""
        if not word:
            return ""
        
        word = word.lower()
        soundex = word[0]  # Keep first letter
        
        # Replace consonants with phonetic groups
        for char in word[1:]:
            if char in self.phonetic_groups:
                group = self.phonetic_groups[char]
                if not soundex or soundex[-1] not in group:
                    soundex += group[0]  # Use first character of group
        
        return soundex

    def find_approximate_substring(self, text: str, pattern: str, 
                                 max_errors: int = 2) -> List[Tuple[int, int, str]]:
        """
        Find approximate substring matches allowing for errors
        Returns list of (start, end, matched_text) tuples
        """
        matches = []
        text_len = len(text)
        pattern_len = len(pattern)
        
        if pattern_len == 0:
            return matches
        
        # Sliding window approach with fuzzy matching
        for i in range(text_len - pattern_len + max_errors + 1):
            for j in range(max(1, pattern_len - max_errors), 
                          min(text_len - i + 1, pattern_len + max_errors + 1)):
                substring = text[i:i+j]
                
                if self._levenshtein_distance(pattern.lower(), substring.lower()) <= max_errors:
                    similarity = self._levenshtein_similarity(pattern.lower(), substring.lower())
                    if similarity >= self.min_similarity:
                        matches.append((i, i+j, substring))
        
        # Remove overlapping matches
        return self._remove_overlapping_substrings(matches)

    def _remove_overlapping_substrings(self, matches: List[Tuple[int, int, str]]) -> List[Tuple[int, int, str]]:
        """Remove overlapping substring matches"""
        if not matches:
            return []
        
        # Sort by start position
        sorted_matches = sorted(matches, key=lambda x: x[0])
        unique_matches = []
        
        for match in sorted_matches:
            is_overlapping = False
            for existing in unique_matches:
                if not (match[1] <= existing[0] or existing[1] <= match[0]):
                    is_overlapping = True
                    break
            
            if not is_overlapping:
                unique_matches.append(match)
        
        return unique_matches

    def batch_similarity(self, target: str, candidates: List[str]) -> List[Tuple[str, float, str]]:
        """
        Calculate similarity between target and multiple candidates efficiently
        Returns list of (candidate, similarity, algorithm) tuples
        """
        results = []
        target_lower = target.lower()
        
        for candidate in candidates:
            candidate_lower = candidate.lower()
            
            # Quick length-based filtering
            length_ratio = min(len(target), len(candidate)) / max(len(target), len(candidate))
            if length_ratio < 0.3:
                continue
            
            best_score = 0.0
            best_algorithm = ""
            
            # Try algorithms in order of computational complexity
            for algo_name in ['sequence_matcher', 'levenshtein', 'jaro_winkler']:
                try:
                    score = self.algorithms[algo_name](target_lower, candidate_lower)
                    if score > best_score:
                        best_score = score
                        best_algorithm = algo_name
                        
                    # Early termination if we find a very good match
                    if score > 0.9:
                        break
                        
                except Exception as e:
                    logger.warning(f"Error in {algo_name} for '{candidate}': {e}")
                    continue
            
            if best_score >= self.min_similarity:
                results.append((candidate, round(best_score, 3), best_algorithm))
        
        return sorted(results, key=lambda x: x[1], reverse=True)

    def adaptive_threshold(self, word_length: int) -> float:
        """
        Calculate adaptive similarity threshold based on word length
        Shorter words require higher similarity to avoid false positives
        """
        if word_length <= 3:
            return 0.9
        elif word_length <= 5:
            return 0.8
        elif word_length <= 8:
            return 0.75
        else:
            return 0.7

    def get_similarity_explanation(self, s1: str, s2: str) -> Dict[str, float]:
        """Get detailed similarity breakdown using all algorithms"""
        results = {}
        
        for algo_name, algo_func in self.algorithms.items():
            try:
                score = algo_func(s1.lower(), s2.lower())
                results[algo_name] = round(score, 3)
            except Exception as e:
                logger.warning(f"Error in {algo_name}: {e}")
                results[algo_name] = 0.0
        
        # Add phonetic similarity
        results['phonetic'] = round(self.phonetic_similarity(s1, s2), 3)
        
        # Add edit distance info
        results['edit_distance'] = self._levenshtein_distance(s1.lower(), s2.lower())
        results['length_ratio'] = round(min(len(s1), len(s2)) / max(len(s1), len(s2)), 3)
        
        return results

    def is_likely_typo(self, word1: str, word2: str) -> bool:
        """
        Determine if word2 is likely a typo of word1
        Uses multiple heuristics for typo detection
        """
        if len(word1) == 0 or len(word2) == 0:
            return False
        
        # Length difference check
        length_diff = abs(len(word1) - len(word2))
        if length_diff > max(2, len(word1) * 0.3):
            return False
        
        # Calculate various similarity metrics
        levenshtein_sim = self._levenshtein_similarity(word1.lower(), word2.lower())
        jaro_sim = self._jaro_similarity(word1.lower(), word2.lower())
        
        # Common typo patterns
        edit_distance = self._levenshtein_distance(word1.lower(), word2.lower())
        
        # Heuristics for typo detection
        if edit_distance == 1:  # Single character difference
            return True
        elif edit_distance == 2 and len(word1) > 4:  # Two character difference for longer words
            return levenshtein_sim > 0.8
        elif length_diff <= 1 and jaro_sim > 0.85:  # Similar length with high Jaro similarity
            return True
        
        return False

    def suggest_corrections(self, misspelled: str, dictionary: List[str], 
                          max_suggestions: int = 5) -> List[Tuple[str, float]]:
        """
        Suggest corrections for misspelled word from dictionary
        Returns list of (suggestion, confidence) tuples
        """
        if not misspelled or not dictionary:
            return []
        
        candidates = []
        misspelled_lower = misspelled.lower()
        
        for word in dictionary:
            word_lower = word.lower()
            
            # Skip if too different in length
            length_ratio = min(len(misspelled), len(word)) / max(len(misspelled), len(word))
            if length_ratio < 0.5:
                continue
            
            # Calculate similarity
            similarity = self._levenshtein_similarity(misspelled_lower, word_lower)
            
            if similarity >= 0.6:  # Lower threshold for suggestions
                # Boost score for common typo patterns
                if self.is_likely_typo(word, misspelled):
                    similarity = min(1.0, similarity + 0.1)
                
                candidates.append((word, similarity))
        
        # Sort by similarity and return top suggestions
        candidates.sort(key=lambda x: x[1], reverse=True)
        return candidates[:max_suggestions]

    def _remove_overlapping_matches(self, matches: List[FuzzyMatch]) -> List[FuzzyMatch]:
        """Remove overlapping matches, keeping the ones with highest similarity"""
        if not matches:
            return []
        
        # Sort by similarity score (descending) then by position
        sorted_matches = sorted(matches, key=lambda x: (-x.similarity_score, x.position[0]))
        unique_matches = []
        
        for match in sorted_matches:
            is_overlapping = False
            for existing in unique_matches:
                if self._positions_overlap(match.position, existing.position):
                    is_overlapping = True
                    break
            
            if not is_overlapping:
                unique_matches.append(match)
        
        return unique_matches

    def _positions_overlap(self, pos1: Tuple[int, int], pos2: Tuple[int, int]) -> bool:
        """Check if two position ranges overlap"""
        return not (pos1[1] <= pos2[0] or pos2[1] <= pos1[0])

    def phonetic_similarity(self, s1: str, s2: str) -> float:
        """Calculate phonetic similarity using simplified soundex-like algorithm"""
        soundex1 = self._simple_soundex(s1)
        soundex2 = self._simple_soundex(s2)
        
        return self._sequence_matcher_similarity(soundex1, soundex2)

    def _simple_soundex(self, word: str) -> str:
        """Generate a simple soundex-like code for phonetic matching"""
        if not word:
            return ""
        
        word = word.lower()
        soundex = word[0]  # Keep first letter
        
        # Replace consonants with phonetic groups
        for char in word[1:]:
            if char in self.phonetic_groups:
                group = self.phonetic_groups[char]
                if not soundex or soundex[-1] not in group:
                    soundex += group[0]  # Use first character of group
        
        return soundex

    def find_approximate_substring(self, text: str, pattern: str, 
                                 max_errors: int = 2) -> List[Tuple[int, int, str]]:
        """
        Find approximate substring matches allowing for errors
        Returns list of (start, end, matched_text) tuples
        """
        matches = []
        text_len = len(text)
        pattern_len = len(pattern)
        
        if pattern_len == 0:
            return matches
        
        # Sliding window approach with fuzzy matching
        for i in range(text_len - pattern_len + max_errors + 1):
            for j in range(max(1, pattern_len - max_errors), 
                          min(text_len - i + 1, pattern_len + max_errors + 1)):
                substring = text[i:i+j]
                
                if self._levenshtein_distance(pattern.lower(), substring.lower()) <= max_errors:
                    similarity = self._levenshtein_similarity(pattern.lower(), substring.lower())
                    if similarity >= self.min_similarity:
                        matches.append((i, i+j, substring))
        
        # Remove overlapping matches
        return self._remove_overlapping_substrings(matches)

    def _remove_overlapping_substrings(self, matches: List[Tuple[int, int, str]]) -> List[Tuple[int, int, str]]:
        """Remove overlapping substring matches"""
        if not matches:
            return []
        
        # Sort by start position
        sorted_matches = sorted(matches, key=lambda x: x[0])
        unique_matches = []
        
        for match in sorted_matches:
            is_overlapping = False
            for existing in unique_matches:
                if not (match[1] <= existing[0] or existing[1] <= match[0]):
                    is_overlapping = True
                    break
            
            if not is_overlapping:
                unique_matches.append(match)
        
        return unique_matches

    def batch_similarity(self, target: str, candidates: List[str]) -> List[Tuple[str, float, str]]:
        """
        Calculate similarity between target and multiple candidates efficiently
        Returns list of (candidate, similarity, algorithm) tuples
        """
        results = []
        target_lower = target.lower()
        
        for candidate in candidates:
            candidate_lower = candidate.lower()
            
            # Quick length-based filtering
            length_ratio = min(len(target), len(candidate)) / max(len(target), len(candidate))
            if length_ratio < 0.3:
                continue
            
            best_score = 0.0
            best_algorithm = ""
            
            # Try algorithms in order of computational complexity
            for algo_name in ['sequence_matcher', 'levenshtein', 'jaro_winkler']:
                try:
                    score = self.algorithms[algo_name](target_lower, candidate_lower)
                    if score > best_score:
                        best_score = score
                        best_algorithm = algo_name
                        
                    # Early termination if we find a very good match
                    if score > 0.9:
                        break
                        
                except Exception as e:
                    logger.warning(f"Error in {algo_name} for '{candidate}': {e}")
                    continue
            
            if best_score >= self.min_similarity:
                results.append((candidate, round(best_score, 3), best_algorithm))
        
        return sorted(results, key=lambda x: x[1], reverse=True)

    def adaptive_threshold(self, word_length: int) -> float:
        """
        Calculate adaptive similarity threshold based on word length
        Shorter words require higher similarity to avoid false positives
        """
        if word_length <= 3:
            return 0.9
        elif word_length <= 5:
            return 0.8
        elif word_length <= 8:
            return 0.75
        else:
            return 0.7

    def get_similarity_explanation(self, s1: str, s2: str) -> Dict[str, float]:
        """Get detailed similarity breakdown using all algorithms"""
        results = {}
        
        for algo_name, algo_func in self.algorithms.items():
            try:
                score = algo_func(s1.lower(), s2.lower())
                results[algo_name] = round(score, 3)
            except Exception as e:
                logger.warning(f"Error in {algo_name}: {e}")
                results[algo_name] = 0.0
        
        # Add phonetic similarity
        results['phonetic'] = round(self.phonetic_similarity(s1, s2), 3)
        
        # Add edit distance info
        results['edit_distance'] = self._levenshtein_distance(s1.lower(), s2.lower())
        results['length_ratio'] = round(min(len(s1), len(s2)) / max(len(s1), len(s2)), 3)
        
        return results

    def is_likely_typo(self, word1: str, word2: str) -> bool:
        """
        Determine if word2 is likely a typo of word1
        Uses multiple heuristics for typo detection
        """
        if len(word1) == 0 or len(word2) == 0:
            return False
        
        # Length difference check
        length_diff = abs(len(word1) - len(word2))
        if length_diff > max(2, len(word1) * 0.3):
            return False
        
        # Calculate various similarity metrics
        levenshtein_sim = self._levenshtein_similarity(word1.lower(), word2.lower())
        jaro_sim = self._jaro_similarity(word1.lower(), word2.lower())
        
        # Common typo patterns
        edit_distance = self._levenshtein_distance(word1.lower(), word2.lower())
        
        # Heuristics for typo detection
        if edit_distance == 1:  # Single character difference
            return True
        elif edit_distance == 2 and len(word1) > 4:  # Two character difference for longer words
            return levenshtein_sim > 0.8
        elif length_diff <= 1 and jaro_sim > 0.85:  # Similar length with high Jaro similarity
            return True
        
        return False

    def suggest_corrections(self, misspelled: str, dictionary: List[str], 
                          max_suggestions: int = 5) -> List[Tuple[str, float]]:
        """
        Suggest corrections for misspelled word from dictionary
        Returns list of (suggestion, confidence) tuples
        """
        if not misspelled or not dictionary:
            return []
        
        candidates = []
        misspelled_lower = misspelled.lower()
        
        for word in dictionary:
            word_lower = word.lower()
            
            # Skip if too different in length
            length_ratio = min(len(misspelled), len(word)) / max(len(misspelled), len(word))
            if length_ratio < 0.5:
                continue
            
            # Calculate similarity
            similarity = self._levenshtein_similarity(misspelled_lower, word_lower)
            
            if similarity >= 0.6:  # Lower threshold for suggestions
                # Boost score for common typo patterns
                if self.is_likely_typo(word, misspelled):
                    similarity = min(1.0, similarity + 0.1)
                
                candidates.append((word, similarity))
        
        # Sort by similarity and return top suggestions
        candidates.sort(key=lambda x: x[1], reverse=True)
        return candidates[:max_suggestions]