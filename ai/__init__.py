"""
TypeAware AI Package
Advanced AI-powered cyberbullying detection system

This package provides comprehensive tools for detecting, analyzing, and preventing
cyberbullying and harmful online behavior through multiple AI techniques including:
- Real-time content detection
- Obfuscation-aware pattern matching
- Sentiment and emotional analysis
- Behavioral pattern recognition
- Context-aware analysis
- Intelligent rephrasing suggestions
"""

__version__ = "1.0.0"
__author__ = "TypeAware Team"
__email__ = "team@typeaware.com"

# Main engine import
from .main_engine import TypeAwareEngine, AnalysisRequest, AnalysisResponse, AnalysisMode

# Detection components
from .detection.content_detection_engine import ContentDetectionEngine
from .detection.obfuscation_detector import ObfuscationDetector, ObfuscationMatch
from .detection.fuzzy_matcher import FuzzyMatcher, FuzzyMatch
from .detection.pattern_analyzer import PatternAnalyzer, PatternMatch, PatternType

# NLP components
from .nlp.sentiment_analyzer import SentimentAnalyzer, SentimentResult, SentimentPolarity, EmotionalTone
from .nlp.text_preprocessor import TextPreprocessor, PreprocessingResult
from .nlp.context_analyzer import ContextAnalyzer, ContextualAnalysisResult, IntentType

# Suggestion engine
from .suggestions.rephrasing_engine import RephrasingEngine, RephrasingSuggestion, RephrasingResult

# Real-time processing
from .real_time.stream_processor import StreamProcessor, StreamMessage, ProcessingResult

import logging

# Configure logging for the package
logging.getLogger(__name__).addHandler(logging.NullHandler())

# Package-level configuration
DEFAULT_CONFIG = {
    'blocking_threshold': 0.7,
    'high_risk_threshold': 0.8,
    'suggestion_threshold': 0.3,
    'enable_preprocessing': True,
    'enable_obfuscation_detection': True,
    'enable_fuzzy_matching': True,
    'enable_pattern_analysis': True,
    'enable_sentiment_analysis': True,
    'enable_context_analysis': True,
    'enable_suggestions': True,
    'enable_stream_processing': True,
    'log_level': 'INFO'
}

def create_engine(config=None):
    """
    Create a TypeAware AI engine with optional configuration
    
    Args:
        config (dict, optional): Configuration overrides
        
    Returns:
        TypeAwareEngine: Configured AI engine instance
    """
    final_config = DEFAULT_CONFIG.copy()
    if config:
        final_config.update(config)
    
    return TypeAwareEngine(final_config)

def quick_analyze(content, user_id="unknown", platform="unknown", mode=AnalysisMode.REAL_TIME):
    """
    Quick analysis function for simple use cases
    
    Args:
        content (str): Text content to analyze
        user_id (str): User identifier
        platform (str): Platform name
        mode (AnalysisMode): Analysis mode
        
    Returns:
        AnalysisResponse: Analysis results
    """
    engine = create_engine()
    
    request = AnalysisRequest(
        content=content,
        user_id=user_id,
        platform=platform,
        mode=mode
    )
    
    try:
        return engine.analyze_content(request)
    finally:
        engine.shutdown()

# Export all main classes and functions
__all__ = [
    # Main engine
    'TypeAwareEngine',
    'AnalysisRequest', 
    'AnalysisResponse',
    'AnalysisMode',
    
    # Detection components
    'ContentDetectionEngine',
    'ObfuscationDetector',
    'ObfuscationMatch',
    'FuzzyMatcher',
    'FuzzyMatch',
    'PatternAnalyzer',
    'PatternMatch',
    'PatternType',
    
    # NLP components
    'SentimentAnalyzer',
    'SentimentResult',
    'SentimentPolarity',
    'EmotionalTone',
    'TextPreprocessor',
    'PreprocessingResult',
    'ContextAnalyzer',
    'ContextualAnalysisResult',
    'IntentType',
    
    # Suggestion engine
    'RephrasingEngine',
    'RephrasingSuggestion',
    'RephrasingResult',
    
    # Real-time processing
    'StreamProcessor',
    'StreamMessage',
    'ProcessingResult',
    
    # Utility functions
    'create_engine',
    'quick_analyze',
    
    # Configuration
    'DEFAULT_CONFIG'
]