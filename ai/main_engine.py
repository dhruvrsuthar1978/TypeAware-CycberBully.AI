"""
main_engine.py
Main AI orchestrator for TypeAware
Coordinates all AI components and provides unified interface
"""

import logging
import time
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from enum import Enum
import threading

# Import AI components
from .detection.content_detection_engine import ContentDetectionEngine
from .detection.obfuscation_detector import ObfuscationDetector
from .detection.fuzzy_matcher import FuzzyMatcher
from .detection.pattern_analyzer import PatternAnalyzer
from .nlp.sentiment_analyzer import SentimentAnalyzer
from .nlp.text_preprocessor import TextPreprocessor
from .nlp.context_analyzer import ContextAnalyzer
from .suggestions.rephrasing_engine import RephrasingEngine
from .real_time.stream_processor import StreamProcessor

logger = logging.getLogger(__name__)

class AnalysisMode(Enum):
    """Analysis modes for different use cases"""
    REAL_TIME = "real_time"      # Fast analysis for live content
    COMPREHENSIVE = "comprehensive"  # Detailed analysis for reports
    LIGHTWEIGHT = "lightweight"    # Basic analysis for high volume

@dataclass
class AnalysisRequest:
    """Request for content analysis"""
    content: str
    user_id: str
    platform: str
    mode: AnalysisMode = AnalysisMode.REAL_TIME
    context: Dict[str, Any] = None
    include_suggestions: bool = True
    include_patterns: bool = True

@dataclass
class AnalysisResponse:
    """Complete analysis response"""
    request_id: str
    is_abusive: bool
    risk_score: float
    risk_level: str
    confidence: float
    
    # Component results
    content_analysis: Optional[Dict] = None
    sentiment_analysis: Optional[Dict] = None
    pattern_analysis: Optional[List] = None
    context_analysis: Optional[Dict] = None
    obfuscation_analysis: Optional[List] = None
    
    # Suggestions and actions
    suggestions: List[str] = None
    educational_message: str = ""
    should_block: bool = False
    alerts: List[Dict] = None
    
    # Metadata
    processing_time_ms: float = 0.0
    components_used: List[str] = None
    analysis_mode: AnalysisMode = AnalysisMode.REAL_TIME

class TypeAwareEngine:
    """
    Main AI engine that orchestrates all components for cyberbullying detection
    Provides unified interface for real-time and batch processing
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        self.config = self._load_default_config()
        if config:
            self.config.update(config)
        
        # Initialize components
        self._initialize_components()
        
        # Threading locks for thread safety
        self._analysis_lock = threading.RLock()
        
        # Statistics tracking
        self.stats = {
            'total_analyses': 0,
            'abusive_detected': 0,
            'suggestions_generated': 0,
            'average_processing_time': 0.0,
            'component_usage': {},
            'mode_usage': {mode.value: 0 for mode in AnalysisMode}
        }
        
        logger.info("TypeAwareEngine initialized")

    def _load_default_config(self) -> Dict[str, Any]:
        """Load default configuration"""
        return {
            # Analysis thresholds
            'blocking_threshold': 0.7,
            'high_risk_threshold': 0.8,
            'suggestion_threshold': 0.3,
            
            # Component settings
            'enable_preprocessing': True,
            'enable_obfuscation_detection': True,
            'enable_fuzzy_matching': True,
            'enable_pattern_analysis': True,
            'enable_sentiment_analysis': True,
            'enable_context_analysis': True,
            'enable_suggestions': True,
            
            # Performance settings
            'max_content_length': 10000,
            'analysis_timeout': 10.0,
            'enable_caching': True,
            'cache_size': 1000,
            
            # Real-time processing
            'enable_stream_processing': True,
            'stream_workers': 4,
            'max_queue_size': 10000,
            
            # Logging and monitoring
            'log_level': 'INFO',
            'enable_performance_monitoring': True,
            'stats_update_interval': 300  # seconds
        }

    def _initialize_components(self):
        """Initialize all AI components"""
        try:
            # Core detection components
            self.content_detector = ContentDetectionEngine()
            self.obfuscation_detector = ObfuscationDetector()
            self.fuzzy_matcher = FuzzyMatcher()
            self.pattern_analyzer = PatternAnalyzer()
            
            # NLP components
            self.sentiment_analyzer = SentimentAnalyzer()
            self.text_preprocessor = TextPreprocessor()
            self.context_analyzer = ContextAnalyzer()
            
            # Suggestion engine
            self.rephrasing_engine = RephrasingEngine()
            
            # Stream processor
            if self.config['enable_stream_processing']:
                self.stream_processor = StreamProcessor(
                    max_queue_size=self.config['max_queue_size']
                )
                self.stream_processor.set_ai_components(
                    content_detector=self.content_detector,
                    sentiment_analyzer=self.sentiment_analyzer,
                    pattern_analyzer=self.pattern_analyzer,
                    context_analyzer=self.context_analyzer,
                    rephrasing_engine=self.rephrasing_engine
                )
                self.stream_processor.start_processing(
                    num_workers=self.config['stream_workers']
                )
            else:
                self.stream_processor = None
            
            # Analysis cache
            if self.config['enable_caching']:
                from collections import OrderedDict
                self.analysis_cache = OrderedDict()
                self.cache_max_size = self.config['cache_size']
            else:
                self.analysis_cache = None
            
            logger.info("All AI components initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize AI components: {e}")
            raise

    def analyze_content(self, request: AnalysisRequest) -> AnalysisResponse:
        """
        Analyze content for cyberbullying and harmful behavior
        
        Args:
            request: AnalysisRequest with content and parameters
            
        Returns:
            AnalysisResponse with detailed analysis results
        """
        start_time = time.time()
        request_id = f"{request.user_id}_{int(start_time * 1000)}"
        
        # Validate input
        if not request.content or len(request.content) > self.config['max_content_length']:
            return self._create_error_response(request_id, "Invalid content length")
        
        # Check cache
        cache_key = self._generate_cache_key(request)
        if self.analysis_cache and cache_key in self.analysis_cache:
            cached_response = self.analysis_cache[cache_key]
            cached_response.request_id = request_id
            return cached_response
        
        with self._analysis_lock:
            try:
                # Preprocess content
                if self.config['enable_preprocessing']:
                    preprocessing_result = self.text_preprocessor.preprocess_text(
                        request.content, 
                        {'preserve_case': True, 'handle_slang': True}
                    )
                    processed_content = preprocessing_result.cleaned_text
                    normalized_content = preprocessing_result.normalized_text
                else:
                    processed_content = request.content
                    normalized_content = request.content.lower()
                
                components_used = []
                
                # Step 1: Content Detection
                content_analysis = None
                if request.mode != AnalysisMode.LIGHTWEIGHT:
                    content_analysis = self.content_detector.detect_abusive_content(
                        processed_content, request.context or {}
                    )
                    components_used.append('content_detector')
                
                # Step 2: Obfuscation Detection
                obfuscation_analysis = []
                if (self.config['enable_obfuscation_detection'] and 
                    request.mode == AnalysisMode.COMPREHENSIVE):
                    # Get abusive words from content analysis
                    target_words = []
                    if content_analysis and content_analysis.detections:
                        target_words = [d.match for d in content_analysis.detections]
                    
                    if not target_words:
                        # Use common abusive words as fallback
                        target_words = ['stupid', 'idiot', 'hate', 'kill', 'hurt']
                    
                    obfuscation_matches = self.obfuscation_detector.detect_obfuscated_words(
                        request.content, target_words
                    )
                    obfuscation_analysis = [match.__dict__ for match in obfuscation_matches]
                    if obfuscation_analysis:
                        components_used.append('obfuscation_detector')
                
                # Step 3: Sentiment Analysis
                sentiment_analysis = None
                if self.config['enable_sentiment_analysis']:
                    sentiment_analysis = self.sentiment_analyzer.analyze_sentiment(
                        processed_content, request.context or {}
                    )
                    components_used.append('sentiment_analyzer')
                
                # Step 4: Pattern Analysis
                pattern_analysis = []
                if (self.config['enable_pattern_analysis'] and 
                    request.include_patterns and
                    request.mode != AnalysisMode.LIGHTWEIGHT):
                    pattern_matches = self.pattern_analyzer.analyze_message_patterns(
                        processed_content, request.context or {}
                    )
                    pattern_analysis = [match.__dict__ for match in pattern_matches]
                    if pattern_analysis:
                        components_used.append('pattern_analyzer')
                
                # Step 5: Context Analysis
                context_analysis = None
                if (self.config['enable_context_analysis'] and 
                    request.mode == AnalysisMode.COMPREHENSIVE):
                    context_analysis = self.context_analyzer.analyze_context(
                        processed_content, request.context or {}
                    )
                    components_used.append('context_analyzer')
                
                # Step 6: Calculate Overall Risk Score
                risk_score, risk_level, confidence = self._calculate_overall_risk(
                    content_analysis, sentiment_analysis, pattern_analysis, 
                    context_analysis, obfuscation_analysis
                )
                
                # Step 7: Determine if content is abusive
                is_abusive = risk_score >= self.config['suggestion_threshold']
                should_block = risk_score >= self.config['blocking_threshold']
                
                # Step 8: Generate Suggestions
                suggestions = []
                educational_message = ""
                if (self.config['enable_suggestions'] and 
                    request.include_suggestions and 
                    is_abusive):
                    rephrasing_result = self.rephrasing_engine.generate_suggestions(
                        request.content, request.context or {}
                    )
                    suggestions = [s.suggested_text for s in rephrasing_result.suggestions[:3]]
                    educational_message = rephrasing_result.educational_note
                    if suggestions:
                        components_used.append('rephrasing_engine')
                
                # Step 9: Generate Alerts
                alerts = self._generate_alerts(
                    risk_score, risk_level, request, content_analysis, 
                    sentiment_analysis, pattern_analysis
                )
                
                # Calculate processing time
                processing_time_ms = (time.time() - start_time) * 1000
                
                # Create response
                response = AnalysisResponse(
                    request_id=request_id,
                    is_abusive=is_abusive,
                    risk_score=risk_score,
                    risk_level=risk_level,
                    confidence=confidence,
                    content_analysis=content_analysis.__dict__ if content_analysis else None,
                    sentiment_analysis=sentiment_analysis.__dict__ if sentiment_analysis else None,
                    pattern_analysis=pattern_analysis,
                    context_analysis=context_analysis.__dict__ if context_analysis else None,
                    obfuscation_analysis=obfuscation_analysis,
                    suggestions=suggestions,
                    educational_message=educational_message,
                    should_block=should_block,
                    alerts=alerts,
                    processing_time_ms=processing_time_ms,
                    components_used=components_used,
                    analysis_mode=request.mode
                )
                
                # Update statistics
                self._update_statistics(response)
                
                # Cache result
                if self.analysis_cache:
                    self._cache_response(cache_key, response)
                
                return response
                
            except Exception as e:
                logger.error(f"Error analyzing content: {e}")
                processing_time_ms = (time.time() - start_time) * 1000
                return self._create_error_response(request_id, str(e), processing_time_ms)

    def analyze_content_stream(self, content: str, user_id: str, platform: str,
                              context: Dict[str, Any] = None) -> str:
        """
        Add content to real-time processing stream
        
        Returns:
            Message ID for tracking
        """
        if not self.stream_processor:
            raise RuntimeError("Stream processing is not enabled")
        
        return self.stream_processor.add_message(content, user_id, platform, context)

    def get_stream_result(self, message_id: str) -> Optional[Dict[str, Any]]:
        """Get result from stream processing"""
        if not self.stream_processor:
            return None
        
        return self.stream_processor.get_message_status(message_id)

    def batch_analyze(self, requests: List[AnalysisRequest]) -> List[AnalysisResponse]:
        """
        Analyze multiple content items in batch
        
        Args:
            requests: List of AnalysisRequest objects
            
        Returns:
            List of AnalysisResponse objects
        """
        results = []
        
        for request in requests:
            try:
                result = self.analyze_content(request)
                results.append(result)
            except Exception as e:
                logger.error(f"Error in batch analysis: {e}")
                error_response = self._create_error_response(
                    f"batch_{int(time.time())}", str(e)
                )
                results.append(error_response)
        
        return results

    def _calculate_overall_risk(self, content_result, sentiment_result, 
                               pattern_results, context_result, 
                               obfuscation_results) -> Tuple[float, str, float]:
        """Calculate overall risk score from all components"""
        risk_factors = []
        confidence_factors = []
        
        # Content detection risk
        if content_result:
            risk_factors.append(content_result.risk_score / 100.0)
            confidence_factors.append(content_result.confidence)
        
        # Sentiment analysis risk
        if sentiment_result:
            risk_factors.append(sentiment_result.toxicity_score)
            confidence_factors.append(sentiment_result.confidence)
        
        # Pattern analysis risk
        if pattern_results:
            max_pattern_risk = 0.0
            max_pattern_confidence = 0.0
            for pattern in pattern_results:
                if isinstance(pattern, dict):
                    pattern_confidence = pattern.get('confidence', 0.0)
                    pattern_severity = pattern.get('severity', 0) / 4.0  # Normalize
                    pattern_risk = pattern_confidence * pattern_severity
                    max_pattern_risk = max(max_pattern_risk, pattern_risk)
                    max_pattern_confidence = max(max_pattern_confidence, pattern_confidence)
            
            if max_pattern_risk > 0:
                risk_factors.append(max_pattern_risk)
                confidence_factors.append(max_pattern_confidence)
        
        # Obfuscation detection risk
        if obfuscation_results:
            obfuscation_risk = 0.0
            obfuscation_confidence = 0.0
            for match in obfuscation_results:
                if isinstance(match, dict):
                    match_confidence = match.get('confidence', 0.0)
                    obfuscation_risk = max(obfuscation_risk, match_confidence * 0.8)
                    obfuscation_confidence = max(obfuscation_confidence, match_confidence)
            
            if obfuscation_risk > 0:
                risk_factors.append(obfuscation_risk)
                confidence_factors.append(obfuscation_confidence)
        
        # Context modifiers
        context_modifier = 1.0
        if context_result:
            risk_modifiers = getattr(context_result, 'risk_modifiers', {})
            for modifier_name, modifier_value in risk_modifiers.items():
                if modifier_name == 'intent_risk':
                    context_modifier *= modifier_value
                elif modifier_name == 'platform_adjustment':
                    context_modifier *= (1.0 + modifier_value * 0.2)
        
        # Calculate final scores
        if risk_factors:
            # Weighted average with emphasis on highest risk
            sorted_risks = sorted(risk_factors, reverse=True)
            if len(sorted_risks) >= 2:
                # Weight highest risk more heavily
                base_risk = (sorted_risks[0] * 0.6 + sorted_risks[1] * 0.4)
            else:
                base_risk = sorted_risks[0]
            
            # Add contribution from other factors
            if len(sorted_risks) > 2:
                additional_risk = sum(sorted_risks[2:]) * 0.1 / len(sorted_risks[2:])
                base_risk += additional_risk
            
            final_risk = min(1.0, base_risk * context_modifier)
        else:
            final_risk = 0.0
        
        # Calculate confidence
        if confidence_factors:
            avg_confidence = sum(confidence_factors) / len(confidence_factors)
        else:
            avg_confidence = 0.0
        
        # Determine risk level
        if final_risk >= 0.8:
            risk_level = 'CRITICAL'
        elif final_risk >= 0.6:
            risk_level = 'HIGH'
        elif final_risk >= 0.3:
            risk_level = 'MEDIUM'
        elif final_risk > 0.1:
            risk_level = 'LOW'
        else:
            risk_level = 'MINIMAL'
        
        return final_risk, risk_level, avg_confidence

    def _generate_alerts(self, risk_score: float, risk_level: str, 
                        request: AnalysisRequest, content_result,
                        sentiment_result, pattern_results) -> List[Dict]:
        """Generate alerts based on analysis results"""
        alerts = []
        
        # High risk alert
        if risk_score >= self.config['high_risk_threshold']:
            alerts.append({
                'type': 'high_risk_content',
                'severity': risk_level,
                'risk_score': risk_score,
                'user_id': request.user_id,
                'platform': request.platform,
                'timestamp': time.time(),
                'content_preview': request.content[:100]
            })
        
        # Threat detection alert
        if content_result and hasattr(content_result, 'categories'):
            if 'threats' in content_result.categories:
                alerts.append({
                    'type': 'threat_detected',
                    'severity': 'CRITICAL',
                    'user_id': request.user_id,
                    'platform': request.platform,
                    'timestamp': time.time(),
                    'threat_type': 'direct_threat'
                })
        
        # Pattern-based alerts
        if pattern_results:
            for pattern in pattern_results:
                if isinstance(pattern, dict):
                    pattern_type = pattern.get('pattern_type')
                    if pattern_type in ['ESCALATING_THREATS', 'CYBERSTALKING']:
                        alerts.append({
                            'type': 'behavioral_pattern',
                            'severity': 'HIGH',
                            'pattern_type': pattern_type,
                            'user_id': request.user_id,
                            'platform': request.platform,
                            'timestamp': time.time()
                        })
        
        # Sentiment-based alerts
        if sentiment_result and hasattr(sentiment_result, 'toxicity_score'):
            if sentiment_result.toxicity_score >= 0.9:
                alerts.append({
                    'type': 'extreme_toxicity',
                    'severity': 'HIGH',
                    'toxicity_score': sentiment_result.toxicity_score,
                    'user_id': request.user_id,
                    'platform': request.platform,
                    'timestamp': time.time()
                })
        
        return alerts

    def _generate_cache_key(self, request: AnalysisRequest) -> str:
        """Generate cache key for analysis request"""
        import hashlib
        
        content_hash = hashlib.md5(request.content.encode()).hexdigest()
        context_str = str(sorted(request.context.items())) if request.context else ""
        context_hash = hashlib.md5(context_str.encode()).hexdigest()
        
        return f"{content_hash}_{context_hash}_{request.mode.value}"

    def _cache_response(self, cache_key: str, response: AnalysisResponse):
        """Cache analysis response"""
        if len(self.analysis_cache) >= self.cache_max_size:
            # Remove oldest entry
            self.analysis_cache.popitem(last=False)
        
        # Remove request_id from cached response
        cached_response = AnalysisResponse(**response.__dict__)
        cached_response.request_id = ""
        
        self.analysis_cache[cache_key] = cached_response

    def _update_statistics(self, response: AnalysisResponse):
        """Update engine statistics"""
        self.stats['total_analyses'] += 1
        
        if response.is_abusive:
            self.stats['abusive_detected'] += 1
        
        if response.suggestions:
            self.stats['suggestions_generated'] += 1
        
        # Update average processing time
        total_time = (self.stats['average_processing_time'] * 
                     (self.stats['total_analyses'] - 1) + 
                     response.processing_time_ms)
        self.stats['average_processing_time'] = total_time / self.stats['total_analyses']
        
        # Update component usage
        for component in response.components_used or []:
            self.stats['component_usage'][component] = (
                self.stats['component_usage'].get(component, 0) + 1
            )
        
        # Update mode usage
        self.stats['mode_usage'][response.analysis_mode.value] += 1

    def _create_error_response(self, request_id: str, error_message: str, 
                              processing_time_ms: float = 0.0) -> AnalysisResponse:
        """Create error response"""
        return AnalysisResponse(
            request_id=request_id,
            is_abusive=False,
            risk_score=0.0,
            risk_level='UNKNOWN',
            confidence=0.0,
            suggestions=[],
            educational_message=f"Analysis failed: {error_message}",
            should_block=False,
            alerts=[{
                'type': 'analysis_error',
                'message': error_message,
                'timestamp': time.time()
            }],
            processing_time_ms=processing_time_ms,
            components_used=[],
            analysis_mode=AnalysisMode.REAL_TIME
        )

    def get_statistics(self) -> Dict[str, Any]:
        """Get comprehensive engine statistics"""
        stats = dict(self.stats)
        
        # Add component-specific statistics
        stats['content_detector_stats'] = self.content_detector.get_stats()
        stats['sentiment_analyzer_stats'] = {}  # Add if available
        
        # Add stream processor statistics
        if self.stream_processor:
            stats['stream_processor_stats'] = self.stream_processor.get_statistics()
        
        # Add cache statistics
        if self.analysis_cache:
            stats['cache_stats'] = {
                'size': len(self.analysis_cache),
                'max_size': self.cache_max_size,
                'hit_rate': 'Not tracked'  # Could implement hit tracking
            }
        
        return stats

    def clear_statistics(self):
        """Clear all statistics"""
        self.stats = {
            'total_analyses': 0,
            'abusive_detected': 0,
            'suggestions_generated': 0,
            'average_processing_time': 0.0,
            'component_usage': {},
            'mode_usage': {mode.value: 0 for mode in AnalysisMode}
        }
        
        # Clear component statistics
        self.content_detector.reset_stats()
        if self.stream_processor:
            self.stream_processor.clear_statistics()
        
        logger.info("All statistics cleared")

    def shutdown(self):
        """Shutdown the engine and all components"""
        logger.info("Shutting down TypeAware engine...")
        
        if self.stream_processor:
            self.stream_processor.stop_processing()
        
        # Clear caches
        if self.analysis_cache:
            self.analysis_cache.clear()
        
        logger.info("TypeAware engine shutdown complete")

    def configure(self, **config_updates):
        """Update engine configuration"""
        self.config.update(config_updates)
        
        # Update stream processor configuration
        if self.stream_processor:
            stream_config = {k: v for k, v in config_updates.items() 
                           if k.startswith('blocking_') or k.startswith('high_risk_')}
            self.stream_processor.configure(**stream_config)
        
        logger.info(f"Engine configuration updated: {config_updates}")

    def health_check(self) -> Dict[str, Any]:
        """Perform health check on all components"""
        health_status = {
            'overall': 'healthy',
            'components': {},
            'timestamp': time.time()
        }
        
        try:
            # Test content detector
            test_result = self.content_detector.detect_abusive_content("test", {})
            health_status['components']['content_detector'] = 'healthy'
        except Exception as e:
            health_status['components']['content_detector'] = f'error: {str(e)}'
            health_status['overall'] = 'degraded'
        
        try:
            # Test sentiment analyzer
            test_result = self.sentiment_analyzer.analyze_sentiment("test", {})
            health_status['components']['sentiment_analyzer'] = 'healthy'
        except Exception as e:
            health_status['components']['sentiment_analyzer'] = f'error: {str(e)}'
            health_status['overall'] = 'degraded'
        
        # Check stream processor
        if self.stream_processor:
            queue_status = self.stream_processor.get_queue_status()
            if queue_status['is_processing']:
                health_status['components']['stream_processor'] = 'healthy'
            else:
                health_status['components']['stream_processor'] = 'stopped'
                health_status['overall'] = 'degraded'
        
        return health_status