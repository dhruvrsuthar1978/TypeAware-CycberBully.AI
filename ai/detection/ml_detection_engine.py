"""
ML Detection Engine
Machine learning-based content detection engine
"""

import os
import sys
import logging
from typing import Dict, List, Optional, Any, Tuple
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ai.models.model_manager import ModelManager

logger = logging.getLogger(__name__)

class MLDetectionEngine:
    """
    Machine learning-based detection engine for cyberbullying content
    """
    
    def __init__(self, models_dir: str = "ai/models/saved"):
        self.model_manager = ModelManager(models_dir)
        self.models = {}
        self.vectorizers = {}
        self.label_encoders = {}
        self.categories = [
            'harassment', 'hate_speech', 'spam', 'threats',
            'cyberbullying', 'sexual_harassment'
        ]
        self._load_models()
    
    def _load_models(self):
        """Load all available ML models"""
        logger.info("Loading ML models...")

        # First, try to load the cyberbullying_types multi-class model
        cyberbullying_model_names = [
            "cyberbullying_types_logistic_regression",
            "cyberbullying_types_random_forest",
            "cyberbullying_types_svm"
        ]

        for model_name in cyberbullying_model_names:
            model = self.model_manager.load_model(model_name)
            if model is not None:  # Check for None explicitly
                self.models['cyberbullying_types'] = model

                # Load corresponding vectorizer
                vectorizer_path = None
                encoder_path = None
                for filename in os.listdir(self.model_manager.models_dir):
                    if filename.startswith(model_name) and filename.endswith('_vectorizer.pkl'):
                        vectorizer_path = os.path.join(self.model_manager.models_dir, filename)
                    elif filename.startswith(model_name) and filename.endswith('_encoder.pkl'):
                        encoder_path = os.path.join(self.model_manager.models_dir, filename)

                if vectorizer_path and os.path.exists(vectorizer_path):
                    try:
                        self.vectorizers['cyberbullying_types'] = joblib.load(vectorizer_path)
                    except Exception as e:
                        logger.error(f"Error loading vectorizer {vectorizer_path}: {e}")

                if encoder_path and os.path.exists(encoder_path):
                    try:
                        self.label_encoders['cyberbullying_types'] = joblib.load(encoder_path)
                    except Exception as e:
                        logger.error(f"Error loading encoder {encoder_path}: {e}")

                if 'cyberbullying_types' in self.vectorizers:
                    logger.info(f"Loaded cyberbullying_types model: {model_name}")
                    break

        # Load individual category models
        for category in self.categories:
            # Try to load the best model for each category
            # Priority: logistic_regression > random_forest > svm
            model_names = [
                f"{category}_logistic_regression",
                f"{category}_random_forest",
                f"{category}_svm"
            ]

            for model_name in model_names:
                model = self.model_manager.load_model(model_name)
                if model:
                    self.models[category] = model

                    # Load corresponding vectorizer
                    vectorizer_path = None
                    for filename in os.listdir(self.model_manager.models_dir):
                        if filename.startswith(model_name) and filename.endswith('_vectorizer.pkl'):
                            vectorizer_path = os.path.join(self.model_manager.models_dir, filename)
                            break

                    if vectorizer_path and os.path.exists(vectorizer_path):
                        self.vectorizers[category] = joblib.load(vectorizer_path)
                        logger.info(f"Loaded model and vectorizer for {category}: {model_name}")
                        break  # Use the first available model
                    else:
                        logger.warning(f"Vectorizer not found for {model_name}")

        loaded_categories = list(self.models.keys())
        logger.info(f"ML models loaded for categories: {loaded_categories}")
    
    def detect_content(self, text: str, category: str = None) -> Dict[str, Any]:
        """
        Detect abusive content using ML models.
        Args:
            text: Text to analyze
            category: Specific category to check (optional)
        Returns:
            Detection results
        """
        results = {
            'is_abusive': False,
            'risk_score': 0.0,
            'confidence': 0.0,
            'category': None,
            'method': 'ml',
            'predictions': {}
        }

        if not text or not isinstance(text, str):
            return results

        # Preprocess text
        processed_text = self._preprocess_text(text)

        # First, try the cyberbullying_types multi-class model if available
        if 'cyberbullying_types' in self.models and 'cyberbullying_types' in self.vectorizers:
            try:
                text_vec = self.vectorizers['cyberbullying_types'].transform([processed_text])
                prediction = self.models['cyberbullying_types'].predict(text_vec)[0]

                # Get probabilities for all classes
                if hasattr(self.models['cyberbullying_types'], 'predict_proba'):
                    probas = self.models['cyberbullying_types'].predict_proba(text_vec)[0]
                    max_proba = max(probas)
                    results['confidence'] = float(max_proba)

                    # Decode the predicted class
                    if 'cyberbullying_types' in self.label_encoders:
                        predicted_class = self.label_encoders['cyberbullying_types'].inverse_transform([prediction])[0]
                        results['category'] = predicted_class
                        results['predictions']['cyberbullying_types'] = {
                            'prediction': predicted_class,
                            'confidence': float(max_proba),
                            'all_probabilities': {class_name: float(proba) for class_name, proba in
                                                zip(self.label_encoders['cyberbullying_types'].classes_, probas)}
                        }

                        # Map cyberbullying types to abusive detection
                        abusive_types = ['Cyberstalking', 'Doxing', 'Revenge Porn', 'Sexual Harassment', 'Slut Shaming']
                        if predicted_class in abusive_types:
                            results['is_abusive'] = True
                            results['risk_score'] = float(max_proba)
                        else:
                            # For non-abusive types, still consider it abusive if confidence is high
                            results['is_abusive'] = max_proba > 0.7
                            results['risk_score'] = float(max_proba) * 0.8
                    else:
                        results['is_abusive'] = True
                        results['risk_score'] = 0.8
                        results['category'] = 'cyberbullying'
                else:
                    results['is_abusive'] = True
                    results['risk_score'] = 0.7
                    results['category'] = 'cyberbullying'

                return results

            except Exception as e:
                logger.error(f"Error with cyberbullying_types model: {e}")

        # Fallback to individual category models
        # Check specific category or all categories
        categories_to_check = [category] if category else self.categories

        max_score = 0.0
        max_confidence = 0.0
        detected_category = None

        for cat in categories_to_check:
            if cat in self.models and cat in self.vectorizers:
                try:
                    # Vectorize text
                    text_vec = self.vectorizers[cat].transform([processed_text])

                    # Get prediction
                    prediction = self.models[cat].predict(text_vec)[0]

                    # Get probability/confidence
                    confidence = 0.5  # Default
                    if hasattr(self.models[cat], 'predict_proba'):
                        probas = self.models[cat].predict_proba(text_vec)[0]
                        confidence = max(probas)  # Highest probability

                    results['predictions'][cat] = {
                        'prediction': int(prediction),
                        'confidence': float(confidence)
                    }

                    # Update overall results
                    if prediction == 1 and confidence > max_confidence:
                        max_score = confidence
                        max_confidence = confidence
                        detected_category = cat
                        results['is_abusive'] = True

                except Exception as e:
                    logger.error(f"Error detecting {cat}: {e}")
                    continue

        results['risk_score'] = max_score
        results['confidence'] = max_confidence
        results['category'] = detected_category

        return results
    
    def detect_multiple_categories(self, text: str) -> Dict[str, Any]:
        """
        Detect content across all categories.
        Args:
            text: Text to analyze
        Returns:
            Multi-category detection results
        """
        return self.detect_content(text)
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get information about loaded models"""
        info = {
            'loaded_categories': list(self.models.keys()),
            'total_models': len(self.models),
            'available_categories': self.categories
        }
        
        # Get metadata for each model
        model_metadata = {}
        for category in self.models.keys():
            metadata = self.model_manager.get_model_metadata(f"{category}_logistic_regression")
            if metadata:
                model_metadata[category] = metadata
        
        info['model_metadata'] = model_metadata
        return info
    
    def _preprocess_text(self, text: str) -> str:
        """Basic text preprocessing"""
        # Convert to lowercase
        text = text.lower()
        
        # Remove excessive whitespace
        import re
        text = re.sub(r'\s+', ' ', text).strip()
        
        return text
    
    def reload_models(self):
        """Reload all models (useful for model updates)"""
        self.models.clear()
        self.vectorizers.clear()
        self.label_encoders.clear()
        self._load_models()
        logger.info("Models reloaded")
    
    def detect_abusive_content(self, text: str, context: Dict[str, Any] = None) -> Optional[Any]:
        """
        Detect abusive content using ML models - returns DetectionResult compatible format.
        This method is called by ContentDetectionEngine.
        Args:
            text: Text to analyze
            context: Additional context (optional)
        Returns:
            DetectionResult-like object or None if no detection
        """
        try:
            # Use the existing detect_content method
            result = self.detect_content(text)

            # Convert to DetectionResult-like format
            if result['is_abusive']:
                # Create a mock DetectionResult object
                from ai.detection.content_detection_engine import Detection, DetectionResult, SeverityLevel

                # Create detection objects
                detections = []
                if result['category']:
                    severity_map = {
                        'threats': SeverityLevel.CRITICAL,
                        'hate_speech': SeverityLevel.CRITICAL,
                        'harassment': SeverityLevel.HIGH,
                        'cyberbullying': SeverityLevel.HIGH,
                        'sexual_harassment': SeverityLevel.HIGH,
                        'spam': SeverityLevel.LOW
                    }

                    severity = severity_map.get(result['category'], SeverityLevel.MEDIUM)

                    detections.append(Detection(
                        detection_type='ml',
                        category=result['category'],
                        severity=severity,
                        match=text[:50] + '...' if len(text) > 50 else text,
                        position=0,
                        confidence=result['confidence'],
                        method='ml'
                    ))

                return DetectionResult(
                    is_abusive=result['is_abusive'],
                    risk_score=result['risk_score'],
                    risk_level='HIGH' if result['risk_score'] > 0.7 else 'MEDIUM' if result['risk_score'] > 0.3 else 'LOW',
                    detections=detections,
                    suggestions=["Consider reviewing your message for potentially harmful content."],
                    categories=[result['category']] if result['category'] else [],
                    confidence=result['confidence'],
                    processing_time=0.0
                )
            else:
                # Return None for non-abusive content
                return None

        except Exception as e:
            logger.error(f"Error in detect_abusive_content: {e}")
            return None

    def is_available(self) -> bool:
        """Check if ML engine is available (has at least one model)"""
        return len(self.models) > 0
