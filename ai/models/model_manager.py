"""
Model Manager Module
Handles saving, loading, and versioning of trained ML models
"""

import os
import json
import joblib
from datetime import datetime
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class ModelManager:
    """
    Manages ML model storage, loading, and versioning
    """
    
    def __init__(self, models_dir: str = "ai/models/saved"):
        self.models_dir = models_dir
        os.makedirs(models_dir, exist_ok=True)
    
    def save_model(self, model, model_name: str, metadata: Dict[str, Any] = None) -> str:
        """
        Save a trained model with metadata.
        Args:
            model: Trained ML model
            model_name: Name of the model
            metadata: Additional metadata (accuracy, training date, etc.)
        Returns:
            Path to saved model
        """
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        model_filename = f"{model_name}_{timestamp}.pkl"
        metadata_filename = f"{model_name}_{timestamp}_metadata.json"
        
        model_path = os.path.join(self.models_dir, model_filename)
        metadata_path = os.path.join(self.models_dir, metadata_filename)
        
        # Save model
        joblib.dump(model, model_path)
        
        # Save metadata
        metadata = metadata or {}
        metadata.update({
            'model_name': model_name,
            'saved_at': timestamp,
            'model_path': model_path
        })
        
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        logger.info(f"Model saved: {model_path}")
        return model_path
    
    def load_model(self, model_name: str) -> Optional[Any]:
        """
        Load the latest version of a model.
        Args:
            model_name: Name of the model to load
        Returns:
            Loaded model or None if not found
        """
        # Exclude vectorizer, encoder, and metadata files
        model_files = [f for f in os.listdir(self.models_dir) 
                      if f.startswith(model_name) and f.endswith('.pkl') and
                      not f.endswith('_vectorizer.pkl') and
                      not f.endswith('_encoder.pkl') and
                      not f.endswith('_metadata.json')]
        
        if not model_files:
            logger.warning(f"No model found for {model_name}")
            return None
        
        # Load the most recent model
        model_files.sort(reverse=True)
        model_path = os.path.join(self.models_dir, model_files[0])
        
        try:
            model = joblib.load(model_path)
            logger.info(f"Model loaded: {model_path}")
            return model
        except Exception as e:
            logger.error(f"Error loading model {model_path}: {e}")
            return None
    
    def get_model_metadata(self, model_name: str) -> Optional[Dict[str, Any]]:
        """
        Get metadata for the latest version of a model.
        Args:
            model_name: Name of the model
        Returns:
            Metadata dictionary or None
        """
        metadata_files = [f for f in os.listdir(self.models_dir) 
                         if f.startswith(model_name) and f.endswith('_metadata.json')]
        
        if not metadata_files:
            return None
        
        metadata_files.sort(reverse=True)
        metadata_path = os.path.join(self.models_dir, metadata_files[0])
        
        try:
            with open(metadata_path, 'r') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error loading metadata {metadata_path}: {e}")
            return None
    
    def list_models(self) -> Dict[str, list]:
        """
        List all available models and their versions.
        Returns:
            Dictionary of model names to list of versions
        """
        models = {}
        for filename in os.listdir(self.models_dir):
            if filename.endswith('.pkl'):
                model_name = filename.split('_')[0]
                if model_name not in models:
                    models[model_name] = []
                models[model_name].append(filename)
        
        return models
