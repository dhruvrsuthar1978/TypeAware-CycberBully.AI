"""
AI Main Engine - Central orchestrator for all AI detection services
Integrates multiple detection methods including HuggingFace, Ollama, and ML models
"""

import asyncio
import logging
import time
from typing import Dict, List, Any, Optional, Union
from concurrent.futures import ThreadPoolExecutor
import json

# Import detection modules
try:
    from detection.huggingface_detector import HuggingFaceDetector
except ImportError:
    HuggingFaceDetector = None

try:
    from detection.ollama_analyzer import OllamaAnalyzer
except ImportError:
    OllamaAnalyzer = None

try:
    from detection.ml_detection_engine import MLDetector
except ImportError:
    MLDetector = None

try:
    from detection.content_detection_engine import ContentDetectionEngine
except ImportError:
    ContentDetectionEngine = None

logger = logging.getLogger(__name__)

class AIMainEngine:
    """
    Main AI engine that orchestrates multiple detection methods
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the AI main engine.

        Args:
            config: Configuration dictionary for detectors
        """
        self.config = config or {}
        self.detectors = {}
        self.executor = ThreadPoolExecutor(max_workers=4)

        # Initialize available detectors
        self._initialize_detectors()

        logger.info("AI Main Engine initialized successfully")

    def _initialize_detectors(self):
        """Initialize all available detection modules."""
        # HuggingFace GPT detector
        if HuggingFaceDetector:
            try:
                hf_config = self.config.get('huggingface', {})
                model_name = hf_config.get('model', 'microsoft/DialoGPT-small')
                self.detectors['huggingface'] = HuggingFaceDetector(
                    model_name=model_name,
                    device=hf_config.get('device', 'auto')
                )
                logger.info("HuggingFace detector initialized")
            except Exception as e:
                logger.warning(f"Failed to initialize HuggingFace detector: {e}")

        # Ollama detector
        if OllamaAnalyzer:
            try:
                ollama_config = self.config.get('ollama', {})
                self.detectors['ollama'] = OllamaAnalyzer(
                    model=ollama_config.get('model', 'llama2'),
                    host=ollama_config.get('host', 'http://localhost:11434')
                )
                logger.info("Ollama detector initialized")
            except Exception as e:
                logger.warning(f"Failed to initialize Ollama detector: {e}")

        # ML detector
        if MLDetector:
            try:
                ml_config = self.config.get('ml', {})
                self.detectors['ml'] = MLDetector(
                    model_path=ml_config.get('model_path'),
                    threshold=ml_config.get('threshold', 0.5)
                )
                logger.info("ML detector initialized")
            except Exception as e:
                logger.warning(f"Failed to initialize ML detector: {e}")

        # Content detection engine (fallback)
        if ContentDetectionEngine:
            try:
                self.detectors['content'] = ContentDetectionEngine()
                logger.info("Content detection engine initialized")
            except Exception as e:
                logger.warning(f"Failed to initialize content detection engine: {e}")

        if not self.detectors:
            logger.warning("No detectors were successfully initialized!")

    async def analyze_text(self, text: str, context: Optional[Dict[str, Any]] = None,
                          methods: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Analyze text using multiple AI detection methods.

        Args:
            text: Text to analyze
            context: Additional context information
            methods: List of detection methods to use (None = all available)

        Returns:
            Combined analysis results
        """
        if not text or not text.strip():
            return self._empty_result()

        start_time = time.time()
        available_methods = methods or list(self.detectors.keys())

        # Run detections in parallel
        tasks = []
        for method in available_methods:
            if method in self.detectors:
                task = asyncio.get_event_loop().run_in_executor(
                    self.executor,
                    self._run_single_detection,
                    method, text, context
                )
                tasks.append(task)

        # Wait for all detections to complete
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Process results
        combined_result = self._combine_results(results, available_methods, text, context)
        combined_result['processing_time'] = time.time() - start_time

        return combined_result

    def _run_single_detection(self, method: str, text: str, context: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Run a single detection method."""
        try:
            detector = self.detectors[method]
            if hasattr(detector, 'analyze_text'):
                result = detector.analyze_text(text, context)
            elif hasattr(detector, 'detectAbusiveContent'):
                # For content detection engine
                result = detector.detectAbusiveContent(text, context)
            else:
                logger.warning(f"Detector {method} has no analyze_text or detectAbusiveContent method")
                return self._empty_result()

            # Add method identifier
            result['method'] = method
            return result

        except Exception as e:
            logger.error(f"Error in {method} detection: {e}")
            return {
                'error': str(e),
                'method': method,
                'is_abusive': False,
                'risk_score': 0.0,
                'risk_level': 'ERROR'
            }

    def _combine_results(self, results: List[Any], methods: List[str], text: str,
                        context: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Combine results from multiple detection methods."""
        valid_results = []
        errors = []

        for i, result in enumerate(results):
            if isinstance(result, Exception):
                errors.append({
                    'method': methods[i] if i < len(methods) else 'unknown',
                    'error': str(result)
                })
            elif isinstance(result, dict) and 'error' not in result:
                valid_results.append(result)
            elif isinstance(result, dict) and 'error' in result:
                errors.append(result)

        if not valid_results:
            return {
                'is_abusive': False,
                'risk_score': 0.0,
                'risk_level': 'NONE',
                'detections': [],
                'categories': [],
                'confidence': 0.0,
                'methods_used': methods,
                'errors': errors,
                'processing_time': 0
            }

        # Combine detections
        all_detections = []
        categories = set()
        risk_scores = []
        confidences = []

        for result in valid_results:
            if 'detections' in result:
                all_detections.extend(result['detections'])
            if 'categories' in result:
                categories.update(result['categories'])
            if 'risk_score' in result:
                risk_scores.append(result['risk_score'])
            if 'confidence' in result:
                confidences.append(result['confidence'])

        # Calculate combined risk score (weighted average)
        combined_risk_score = sum(risk_scores) / len(risk_scores) if risk_scores else 0.0
        combined_confidence = sum(confidences) / len(confidences) if confidences else 0.0

        # Determine overall risk level
        risk_level = self._calculate_combined_risk_level(combined_risk_score)

        # Generate combined suggestions
        suggestions = self._generate_combined_suggestions(valid_results)

        return {
            'is_abusive': combined_risk_score > 30,
            'risk_score': round(combined_risk_score, 2),
            'risk_level': risk_level,
            'detections': all_detections,
            'suggestions': suggestions,
            'categories': list(categories),
            'confidence': round(combined_confidence, 2),
            'methods_used': [r.get('method', 'unknown') for r in valid_results],
            'errors': errors,
            'processing_time': 0  # Will be set by caller
        }

    def _calculate_combined_risk_level(self, risk_score: float) -> str:
        """Calculate risk level from combined score."""
        if risk_score >= 80:
            return "CRITICAL"
        elif risk_score >= 60:
            return "HIGH"
        elif risk_score >= 30:
            return "MEDIUM"
        elif risk_score > 0:
            return "LOW"
        else:
            return "NONE"

    def _generate_combined_suggestions(self, results: List[Dict[str, Any]]) -> List[str]:
        """Generate combined suggestions from all results."""
        all_suggestions = set()

        for result in results:
            if 'suggestions' in result:
                all_suggestions.update(result['suggestions'])

        return list(all_suggestions)

    def _empty_result(self) -> Dict[str, Any]:
        """Return empty result structure."""
        return {
            'is_abusive': False,
            'risk_score': 0.0,
            'risk_level': 'NONE',
            'detections': [],
            'suggestions': [],
            'categories': [],
            'confidence': 0.0,
            'methods_used': [],
            'errors': [],
            'processing_time': 0
        }

    def get_available_methods(self) -> List[str]:
        """Get list of available detection methods."""
        return list(self.detectors.keys())

    def get_stats(self) -> Dict[str, Any]:
        """Get statistics from all detectors."""
        stats = {}

        for method, detector in self.detectors.items():
            try:
                if hasattr(detector, 'getStats'):
                    stats[method] = detector.getStats()
                elif hasattr(detector, 'get_stats'):
                    stats[method] = detector.get_stats()
                else:
                    stats[method] = {'status': 'no_stats_available'}
            except Exception as e:
                stats[method] = {'error': str(e)}

        return stats

    def cleanup(self):
        """Clean up resources."""
        for detector in self.detectors.values():
            try:
                if hasattr(detector, 'unload_model'):
                    detector.unload_model()
                elif hasattr(detector, 'cleanup'):
                    detector.cleanup()
            except Exception as e:
                logger.warning(f"Error cleaning up detector: {e}")

        self.executor.shutdown(wait=True)
        logger.info("AI Main Engine cleaned up")

# Global instance
_engine_instance = None

def get_ai_engine(config: Optional[Dict[str, Any]] = None) -> AIMainEngine:
    """Get or create the global AI engine instance."""
    global _engine_instance
    if _engine_instance is None:
        _engine_instance = AIMainEngine(config)
    return _engine_instance

async def analyze_text_async(text: str, context: Optional[Dict[str, Any]] = None,
                           methods: Optional[List[str]] = None) -> Dict[str, Any]:
    """Convenience function for async text analysis."""
    engine = get_ai_engine()
    return await engine.analyze_text(text, context, methods)

def analyze_text_sync(text: str, context: Optional[Dict[str, Any]] = None,
                     methods: Optional[List[str]] = None) -> Dict[str, Any]:
    """Convenience function for synchronous text analysis."""
    engine = get_ai_engine()
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(engine.analyze_text(text, context, methods))
    finally:
        loop.close()
