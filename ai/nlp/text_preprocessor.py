"""
text_preprocessor.py
Advanced text preprocessing for TypeAware
Handles text normalization, cleaning, and preparation for analysis
"""

import re
import unicodedata
import html
from typing import Dict, List, Tuple, Optional, Set
from dataclasses import dataclass
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)

@dataclass
class PreprocessingResult:
    """Result of text preprocessing"""
    original_text: str
    cleaned_text: str
    normalized_text: str
    tokens: List[str]
    metadata: Dict[str, any]
    transformations_applied: List[str]

class TextPreprocessor:
    """
    Advanced text preprocessor for cyberbullying detection
    Handles various text normalization and cleaning tasks
    """
    
    def __init__(self):
        self.emoji_patterns = self._load_emoji_patterns()
        self.slang_dictionary = self._load_slang_dictionary()
        self.profanity_variants = self._load_profanity_variants()
        self.unicode_normalizations = self._load_unicode_normalizations()
        self.contractions = self._load_contractions()
        
        # Compiled regex patterns for performance
        self.patterns = {
            'url': re.compile(
                r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+|'
                r'www\.(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+|'
                r'(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}'
            ),
            'email': re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'),
            'phone': re.compile(r'(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})'),
            'mentions': re.compile(r'@[a-zA-Z0-9_]+'),
            'hashtags': re.compile(r'#[a-zA-Z0-9_]+'),
            'excessive_whitespace': re.compile(r'\s+'),
            'excessive_punctuation': re.compile(r'([.!?]){2,}'),
            'repeated_chars': re.compile(r'(.)\1{2,}'),
            'special_chars': re.compile(r'[^\w\s.!?,-]'),
            'numbers': re.compile(r'\b\d+\b'),
            'caps_words': re.compile(r'\b[A-Z]{2,}\b')
        }
        
        logger.info("TextPreprocessor initialized")

    def _load_emoji_patterns(self) -> Dict[str, str]:
        """Load emoji patterns and their text representations"""
        return {
            '😀': 'happy', '😃': 'happy', '😄': 'happy', '😁': 'happy',
            '😆': 'laughing', '😅': 'laughing', '🤣': 'laughing', '😂': 'laughing',
            '🙂': 'smile', '😉': 'wink', '😊': 'happy',
            '😍': 'love', '🥰': 'love', '😘': 'kiss',
            '😒': 'annoyed', '🙄': 'eyeroll', '😏': 'smirk',
            '😞': 'sad', '😔': 'sad', '😢': 'crying', '😭': 'crying',
            '😤': 'angry', '😠': 'angry', '😡': 'angry', '🤬': 'angry',
            '🖕': 'offensive', '💀': 'death', '👎': 'dislike',
            '👍': 'like', '👏': 'clap', '🙌': 'celebrate',
            '❤️': 'love', '💔': 'heartbreak', '💯': 'hundred'
        }

    def _load_slang_dictionary(self) -> Dict[str, str]:
        """Load internet slang and abbreviations dictionary"""
        return {
            # Common abbreviations
            'u': 'you', 'ur': 'your', 'youre': 'you are', 'ure': 'you are',
            'r': 'are', 'n': 'and', 'nd': 'and', 'w/': 'with',
            'w/o': 'without', 'bc': 'because', 'b/c': 'because',
            'cuz': 'because', 'bcuz': 'because', 'coz': 'because',
            
            # Text speak
            'lol': 'laugh out loud', 'lmao': 'laugh my ass off',
            'rofl': 'roll on floor laughing', 'wtf': 'what the fuck',
            'omg': 'oh my god', 'omfg': 'oh my fucking god',
            'tbh': 'to be honest', 'imo': 'in my opinion',
            'imho': 'in my humble opinion', 'fyi': 'for your information',
            'btw': 'by the way', 'afaik': 'as far as I know',
            'ttyl': 'talk to you later', 'brb': 'be right back',
            
            # Insults and offensive terms (normalized)
            'noob': 'newbie', 'n00b': 'newbie', 'newb': 'newbie',
            'kys': 'kill yourself', 'stfu': 'shut the fuck up',
            'gtfo': 'get the fuck out', 'gfy': 'go fuck yourself',
            'pos': 'piece of shit', 'sob': 'son of a bitch',
            
            # Positive slang
            'lit': 'awesome', 'fire': 'awesome', 'dope': 'cool',
            'sick': 'awesome', 'tight': 'cool', 'fresh': 'cool',
            'based': 'good', 'goat': 'greatest of all time',
            'stan': 'support', 'ship': 'support relationship',
            
            # Gaming terms
            'noob': 'beginner', 'pwn': 'dominate', 'rekt': 'destroyed',
            'gg': 'good game', 'ez': 'easy', 'op': 'overpowered',
            'nerf': 'weaken', 'buff': 'strengthen'
        }

    def _load_profanity_variants(self) -> Dict[str, List[str]]:
        """Load profanity variants and obfuscations"""
        return {
            'fuck': [
                'f*ck', 'f**k', 'f***', 'fck', 'fuk', 'phuck', 'fawk',
                'f@ck', 'f#ck', 'f$ck', 'fu(k', 'f u c k'
            ],
            'shit': [
                's*it', 's**t', 'sh*t', 'sht', 'shyt', 'sh!t',
                's@it', 's#it', 'sh1t', 's h i t'
            ],
            'damn': [
                'd*mn', 'd**n', 'dmn', 'dam', 'd@mn', 'd#mn', 'da*n'
            ],
            'hell': [
                'h*ll', 'h**l', 'hel', 'h@ll', 'h#ll', 'he11'
            ],
            'bitch': [
                'b*tch', 'b**ch', 'btch', 'b!tch', 'bi7ch', 'beatch',
                'b@tch', 'b#tch', 'biatch', 'b i t c h'
            ],
            'stupid': [
                'st*pid', 'stup!d', 'st00pid', 'stoopid', 'stpd',
                's t u p i d', 'st*p*d', 'stupid'
            ],
            'idiot': [
                'id!ot', 'idi0t', '1diot', 'id10t', 'idi*t',
                'i d i o t', 'idoit', 'idioot'
            ]
        }

    def _load_unicode_normalizations(self) -> Dict[str, str]:
        """Load unicode character normalizations"""
        return {
            # Accented characters
            'á': 'a', 'à': 'a', 'â': 'a', 'ä': 'a', 'ã': 'a', 'å': 'a',
            'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
            'í': 'i', 'ì': 'i', 'î': 'i', 'ï': 'i',
            'ó': 'o', 'ò': 'o', 'ô': 'o', 'ö': 'o', 'õ': 'o',
            'ú': 'u', 'ù': 'u', 'û': 'u', 'ü': 'u',
            
            # Special characters used in obfuscation
            '¢': 'c', 'ç': 'c', 'ñ': 'n', 'ß': 'ss',
            '£': 'l', '¥': 'y', '€': 'e',
            
            # Similar looking characters
            '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's',
            '7': 't', '8': 'b', '9': 'g',
            '@': 'a', '$': 's', '+': 't', '!': 'i', '|': 'l'
        }

    def _load_contractions(self) -> Dict[str, str]:
        """Load contractions and their expansions"""
        return {
            "ain't": "is not", "aren't": "are not", "can't": "cannot",
            "couldn't": "could not", "didn't": "did not", "doesn't": "does not",
            "don't": "do not", "hadn't": "had not", "hasn't": "has not",
            "haven't": "have not", "he'd": "he would", "he'll": "he will",
            "he's": "he is", "i'd": "i would", "i'll": "i will",
            "i'm": "i am", "i've": "i have", "isn't": "is not",
            "it'd": "it would", "it'll": "it will", "it's": "it is",
            "let's": "let us", "shouldn't": "should not", "that's": "that is",
            "there's": "there is", "they'd": "they would", "they'll": "they will",
            "they're": "they are", "they've": "they have", "we'd": "we would",
            "we're": "we are", "we've": "we have", "weren't": "were not",
            "what's": "what is", "where's": "where is", "who's": "who is",
            "won't": "will not", "wouldn't": "would not", "you'd": "you would",
            "you'll": "you will", "you're": "you are", "you've": "you have"
        }

    def preprocess_text(self, text: str, options: Dict[str, bool] = None) -> PreprocessingResult:
        """
        Main text preprocessing method
        
        Args:
            text: Input text to preprocess
            options: Preprocessing options (normalize_unicode, expand_contractions, etc.)
            
        Returns:
            PreprocessingResult with original, cleaned, and normalized text
        """
        if not text or not isinstance(text, str):
            return self._create_empty_result(text or "")
        
        # Set default options
        options = options or {}
        default_options = {
            'normalize_unicode': True,
            'expand_contractions': True,
            'handle_slang': True,
            'remove_urls': True,
            'remove_emails': True,
            'handle_emojis': True,
            'normalize_whitespace': True,
            'handle_repeated_chars': True,
            'preserve_case': False,
            'tokenize': True
        }
        options = {**default_options, **options}
        
        original_text = text
        processed_text = text
        transformations = []
        metadata = {
            'original_length': len(text),
            'contains_urls': False,
            'contains_emails': False,
            'contains_emojis': False,
            'caps_ratio': 0.0,
            'punctuation_ratio': 0.0
        }
        
        # Step 1: HTML decoding
        if '&' in processed_text:
            processed_text = html.unescape(processed_text)
            transformations.append('html_decoded')
        
        # Step 2: Unicode normalization
        if options['normalize_unicode']:
            processed_text = self._normalize_unicode(processed_text)
            transformations.append('unicode_normalized')
        
        # Step 3: Extract metadata before cleaning
        metadata.update(self._extract_metadata(processed_text))
        
        # Step 4: Handle URLs
        if options['remove_urls']:
            processed_text, url_found = self._handle_urls(processed_text)
            if url_found:
                metadata['contains_urls'] = True
                transformations.append('urls_handled')
        
        # Step 5: Handle emails
        if options['remove_emails']:
            processed_text, email_found = self._handle_emails(processed_text)
            if email_found:
                metadata['contains_emails'] = True
                transformations.append('emails_handled')
        
        # Step 6: Handle emojis
        if options['handle_emojis']:
            processed_text, emoji_found = self._handle_emojis(processed_text)
            if emoji_found:
                metadata['contains_emojis'] = True
                transformations.append('emojis_converted')
        
        # Step 7: Expand contractions
        if options['expand_contractions']:
            processed_text = self._expand_contractions(processed_text)
            transformations.append('contractions_expanded')
        
        # Step 8: Handle slang and abbreviations
        if options['handle_slang']:
            processed_text = self._handle_slang(processed_text)
            transformations.append('slang_normalized')
        
        # Step 9: Handle repeated characters
        if options['handle_repeated_chars']:
            processed_text = self._handle_repeated_chars(processed_text)
            transformations.append('repeated_chars_normalized')
        
        # Step 10: Normalize whitespace
        if options['normalize_whitespace']:
            processed_text = self._normalize_whitespace(processed_text)
            transformations.append('whitespace_normalized')
        
        # Step 11: Case normalization
        normalized_text = processed_text
        if not options['preserve_case']:
            normalized_text = processed_text.lower()
            transformations.append('case_normalized')
        
        # Step 12: Tokenization
        tokens = []
        if options['tokenize']:
            tokens = self._tokenize(normalized_text)
            transformations.append('tokenized')
        
        # Update metadata
        metadata['processed_length'] = len(processed_text)
        metadata['token_count'] = len(tokens)
        metadata['compression_ratio'] = metadata['processed_length'] / metadata['original_length'] if metadata['original_length'] > 0 else 0
        
        return PreprocessingResult(
            original_text=original_text,
            cleaned_text=processed_text,
            normalized_text=normalized_text,
            tokens=tokens,
            metadata=metadata,
            transformations_applied=transformations
        )

    def _normalize_unicode(self, text: str) -> str:
        """Normalize unicode characters"""
        # NFD normalization to decompose characters
        text = unicodedata.normalize('NFD', text)
        
        # Remove combining characters (accents)
        text = ''.join(c for c in text if unicodedata.category(c) != 'Mn')
        
        # Apply custom normalizations
        for unicode_char, replacement in self.unicode_normalizations.items():
            text = text.replace(unicode_char, replacement)
        
        return text

    def _extract_metadata(self, text: str) -> Dict[str, any]:
        """Extract metadata from text"""
        total_chars = len(text)
        if total_chars == 0:
            return {}
        
        caps_count = sum(1 for c in text if c.isupper())
        punct_count = sum(1 for c in text if c in '!?.,;:')
        digit_count = sum(1 for c in text if c.isdigit())
        
        return {
            'caps_ratio': caps_count / total_chars,
            'punctuation_ratio': punct_count / total_chars,
            'digit_ratio': digit_count / total_chars,
            'avg_word_length': len(text.split()) / len(text.split()) if text.split() else 0
        }

    def _handle_urls(self, text: str) -> Tuple[str, bool]:
        """Handle URLs in text"""
        url_found = bool(self.patterns['url'].search(text))
        # Replace URLs with placeholder or remove them
        text = self.patterns['url'].sub('[URL]', text)
        return text, url_found

    def _handle_emails(self, text: str) -> Tuple[str, bool]:
        """Handle email addresses in text"""
        email_found = bool(self.patterns['email'].search(text))
        text = self.patterns['email'].sub('[EMAIL]', text)
        return text, email_found

    def _handle_emojis(self, text: str) -> Tuple[str, bool]:
        """Convert emojis to text representations"""
        emoji_found = False
        processed_text = text
        
        for emoji, description in self.emoji_patterns.items():
            if emoji in processed_text:
                processed_text = processed_text.replace(emoji, f' {description} ')
                emoji_found = True
        
        return processed_text, emoji_found

    def _expand_contractions(self, text: str) -> str:
        """Expand contractions"""
        words = text.split()
        expanded_words = []
        
        for word in words:
            # Clean word for lookup (remove punctuation)
            clean_word = re.sub(r'[^\w\']', '', word.lower())
            
            if clean_word in self.contractions:
                expanded_words.append(self.contractions[clean_word])
            else:
                expanded_words.append(word)
        
        return ' '.join(expanded_words)

    def _handle_slang(self, text: str) -> str:
        """Handle internet slang and abbreviations"""
        words = text.split()
        processed_words = []
        
        for word in words:
            # Clean word for lookup
            clean_word = re.sub(r'[^\w]', '', word.lower())
            
            if clean_word in self.slang_dictionary:
                processed_words.append(self.slang_dictionary[clean_word])
            else:
                processed_words.append(word)
        
        return ' '.join(processed_words)

    def _handle_repeated_chars(self, text: str) -> str:
        """Handle repeated characters (e.g., 'sooooo' -> 'so')"""
        # Replace repeated characters with at most 2 repetitions
        text = self.patterns['repeated_chars'].sub(r'\1\1', text)
        return text

    def _normalize_whitespace(self, text: str) -> str:
        """Normalize whitespace"""
        # Replace multiple whitespaces with single space
        text = self.patterns['excessive_whitespace'].sub(' ', text)
        # Strip leading/trailing whitespace
        return text.strip()

    def _tokenize(self, text: str) -> List[str]:
        """Tokenize text into words"""
        # Simple word tokenization
        tokens = re.findall(r'\b\w+\b', text.lower())
        return [token for token in tokens if len(token) > 0]

    def _create_empty_result(self, original: str) -> PreprocessingResult:
        """Create empty preprocessing result"""
        return PreprocessingResult(
            original_text=original,
            cleaned_text="",
            normalized_text="",
            tokens=[],
            metadata={'original_length': len(original), 'processed_length': 0},
            transformations_applied=[]
        )

    def normalize_profanity_variants(self, text: str) -> str:
        """Normalize profanity variants to standard forms"""
        normalized_text = text.lower()
        
        for standard_word, variants in self.profanity_variants.items():
            for variant in variants:
                # Create regex pattern that's case insensitive
                pattern = re.escape(variant).replace(r'\ ', r'\s*')
                normalized_text = re.sub(pattern, standard_word, normalized_text, flags=re.IGNORECASE)
        
        return normalized_text

    def extract_obfuscated_words(self, text: str) -> List[Tuple[str, str, float]]:
        """
        Extract potentially obfuscated words and their likely meanings
        Returns list of (obfuscated_word, likely_meaning, confidence)
        """
        obfuscated_words = []
        words = text.split()
        
        for word in words:
            clean_word = re.sub(r'[^\w]', '', word.lower())
            
            # Check against profanity variants
            for standard_word, variants in self.profanity_variants.items():
                for variant in variants:
                    if clean_word == variant.replace(' ', ''):
                        confidence = 0.9 if variant in variants[:3] else 0.7  # Higher confidence for common variants
                        obfuscated_words.append((word, standard_word, confidence))
                        break
        
        return obfuscated_words

    def detect_text_anomalies(self, text: str) -> Dict[str, any]:
        """Detect various text anomalies that might indicate obfuscation or spam"""
        anomalies = {
            'excessive_caps': False,
            'excessive_punctuation': False,
            'unusual_spacing': False,
            'repeated_characters': False,
            'mixed_languages': False,
            'unusual_character_frequency': False
        }
        
        # Check for excessive caps (more than 70% uppercase)
        if len(text) > 10:
            caps_ratio = sum(1 for c in text if c.isupper()) / len(text)
            if caps_ratio > 0.7:
                anomalies['excessive_caps'] = True
        
        # Check for excessive punctuation
        if self.patterns['excessive_punctuation'].search(text):
            anomalies['excessive_punctuation'] = True
        
        # Check for unusual spacing patterns
        if re.search(r'\w\s+\w\s+\w', text):  # Letters separated by spaces
            anomalies['unusual_spacing'] = True
        
        # Check for repeated characters
        if self.patterns['repeated_chars'].search(text):
            anomalies['repeated_characters'] = True
        
        # Check character frequency (simple heuristic)
        char_freq = {}
        for char in text.lower():
            if char.isalnum():
                char_freq[char] = char_freq.get(char, 0) + 1
        
        if char_freq:
            max_freq = max(char_freq.values())
            total_chars = sum(char_freq.values())
            if max_freq / total_chars > 0.4:  # Single character dominance
                anomalies['unusual_character_frequency'] = True
        
        return anomalies

    def clean_for_analysis(self, text: str, preserve_structure: bool = True) -> str:
        """
        Clean text specifically for analysis while preserving important structure
        This is different from full preprocessing as it maintains context clues
        """
        if not text:
            return ""
        
        cleaned = text
        
        # Basic HTML decoding
        cleaned = html.unescape(cleaned)
        
        # Normalize unicode but preserve structure
        cleaned = unicodedata.normalize('NFKC', cleaned)
        
        # Handle obvious obfuscations without losing the pattern
        cleaned = self.normalize_profanity_variants(cleaned)
        
        # Normalize excessive whitespace but preserve line breaks if needed
        if preserve_structure:
            cleaned = re.sub(r'[ \t]+', ' ', cleaned)  # Normalize spaces/tabs
            cleaned = re.sub(r'\n+', '\n', cleaned)    # Normalize newlines
        else:
            cleaned = self.patterns['excessive_whitespace'].sub(' ', cleaned)
        
        return cleaned.strip()

    def batch_preprocess(self, texts: List[str], options: Dict[str, bool] = None) -> List[PreprocessingResult]:
        """Preprocess multiple texts efficiently"""
        results = []
        
        for text in texts:
            try:
                result = self.preprocess_text(text, options)
                results.append(result)
            except Exception as e:
                logger.error(f"Error preprocessing text '{text[:50]}...': {e}")
                results.append(self._create_empty_result(text))
        
        return results

    def get_preprocessing_stats(self, results: List[PreprocessingResult]) -> Dict[str, any]:
        """Get statistics from preprocessing results"""
        if not results:
            return {}
        
        total_results = len(results)
        transformations = []
        
        for result in results:
            transformations.extend(result.transformations_applied)
        
        from collections import Counter
        transformation_counts = Counter(transformations)
        
        avg_compression = sum(r.metadata.get('compression_ratio', 0) for r in results) / total_results
        avg_tokens = sum(r.metadata.get('token_count', 0) for r in results) / total_results
        
        return {
            'total_processed': total_results,
            'average_compression_ratio': round(avg_compression, 3),
            'average_tokens_per_text': round(avg_tokens, 2),
            'transformation_frequency': dict(transformation_counts),
            'texts_with_urls': sum(1 for r in results if r.metadata.get('contains_urls', False)),
            'texts_with_emojis': sum(1 for r in results if r.metadata.get('contains_emojis', False))
        }