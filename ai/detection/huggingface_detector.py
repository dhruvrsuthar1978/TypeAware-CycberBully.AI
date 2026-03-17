"""
HuggingFace GPT-OSS Uncensored Content Detector
Uses transformers library with uncensored GPT models for content analysis
"""

import os
import logging
from typing import Dict, List, Any, Optional
import torch
from transformers import (
    AutoTokenizer,
    AutoModelForCausalLM,
    pipeline,
    BitsAndBytesConfig
)
import numpy as np

logger = logging.getLogger(__name__)

class HuggingFaceDetector:
    """
    Content detection using Hugging Face transformers with uncensored GPT models.
    Uses lightweight models to avoid large downloads.
    """

    def __init__(self, model_name: str = "microsoft/DialoGPT-small", device: str = "auto"):
        """
        Initialize the HuggingFace detector.

        Args:
            model_name: HuggingFace model name (default: small uncensored model)
            device: Device to run on ('auto', 'cpu', 'cuda')
        """
        self.model_name = model_name
        self.device = device if device != "auto" else ("cuda" if torch.cuda.is_available() else "cpu")

        # Model will be loaded on first use to avoid immediate download
        self.tokenizer = None
        self.model = None
        self.pipeline = None

        # Content analysis prompts
        self.analysis_prompts = {
            "toxicity": "Analyze if this text contains toxic or harmful content: '{text}'. Rate from 0-10 where 10 is most toxic. Respond with only a number.",
            "harassment": "Does this text contain harassment or bullying? '{text}'. Rate from 0-10 where 10 is most harassing. Respond with only a number.",
            "hate_speech": "Does this text contain hate speech or discrimination? '{text}'. Rate from 0-10 where 10 is most hateful. Respond with only a number.",
            "threats": "Does this text contain threats or violence? '{text}'. Rate from 0-10 where 10 is most threatening. Respond with only a number.",
            "profanity": "How much profanity does this text contain? '{text}'. Rate from 0-10 where 10 is most profane. Respond with only a number."
        }

        logger.info(f"HuggingFace detector initialized with model: {model_name}")

    def _load_model(self):
        """Lazy load the model to avoid download on import."""
        if self.model is None:
            try:
                logger.info(f"Loading HuggingFace model: {self.model_name}")

                # Use 4-bit quantization to reduce memory usage
                quantization_config = BitsAndBytesConfig(
                    load_in_4bit=True,
                    bnb_4bit_compute_dtype=torch.float16,
                    bnb_4bit_use_double_quant=True,
                    bnb_4bit_quant_type="nf4"
                )

                self.tokenizer = AutoTokenizer.from_pretrained(
                    self.model_name,
                    trust_remote_code=True
                )

                # Add padding token if missing
                if self.tokenizer.pad_token is None:
                    self.tokenizer.pad_token = self.tokenizer.eos_token

                self.model = AutoModelForCausalLM.from_pretrained(
                    self.model_name,
                    quantization_config=quantization_config,
                    device_map="auto",
                    trust_remote_code=True
                )

                # Create text generation pipeline
                self.pipeline = pipeline(
                    "text-generation",
                    model=self.model,
                    tokenizer=self.tokenizer,
                    device_map="auto",
                    max_new_tokens=50,
                    temperature=0.1,
                    do_sample=True,
                    pad_token_id=self.tokenizer.eos_token_id
                )

                logger.info("HuggingFace model loaded successfully")

            except Exception as e:
                logger.error(f"Failed to load HuggingFace model: {e}")
                raise

    def analyze_text(self, text: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Analyze text for abusive content using HuggingFace model.

        Args:
            text: Text to analyze
            context: Optional context information

        Returns:
            Dictionary with analysis results
        """
        if not text or not text.strip():
            return self._empty_result()

        try:
            # Load model if not already loaded
            self._load_model()

            results = {}
            scores = {}

            # Analyze each category
            for category, prompt_template in self.analysis_prompts.items():
                try:
                    prompt = prompt_template.format(text=text[:500])  # Limit text length

                    # Generate response
                    outputs = self.pipeline(
                        prompt,
                        max_new_tokens=10,
                        num_return_sequences=1,
                        temperature=0.1,
                        do_sample=False,
                        pad_token_id=self.tokenizer.eos_token_id
                    )

                    response = outputs[0]['generated_text'].replace(prompt, '').strip()

                    # Extract numeric score
                    score = self._extract_score(response)
                    scores[category] = score

                except Exception as e:
                    logger.warning(f"Error analyzing {category}: {e}")
                    scores[category] = 0.0

            # Calculate overall risk score
            risk_score = self._calculate_risk_score(scores)

            # Determine risk level
            risk_level = self._get_risk_level(risk_score)

            # Generate detections
            detections = self._generate_detections(scores, text)

            return {
                "is_abusive": risk_score > 30,
                "risk_score": round(risk_score, 2),
                "risk_level": risk_level,
                "detections": detections,
                "categories": list(scores.keys()),
                "confidence": 0.8,  # Model confidence
                "processing_time": 0,  # Will be set by caller
                "method": "huggingface_gpt",
                "model": self.model_name
            }

        except Exception as e:
            logger.error(f"Error in HuggingFace analysis: {e}")
            return self._empty_result()

    def _extract_score(self, response: str) -> float:
        """Extract numeric score from model response."""
        import re

        # Look for numbers in the response
        numbers = re.findall(r'\d+\.?\d*', response)
        if numbers:
            score = float(numbers[0])
            return min(max(score, 0), 10)  # Clamp to 0-10

        # Fallback: try to interpret text responses
        response_lower = response.lower()
        if 'high' in response_lower or 'toxic' in response_lower:
            return 8.0
        elif 'medium' in response_lower or 'moderate' in response_lower:
            return 5.0
        elif 'low' in response_lower or 'mild' in response_lower:
            return 2.0
        else:
            return 0.0

    def _calculate_risk_score(self, scores: Dict[str, float]) -> float:
        """Calculate overall risk score from category scores."""
        if not scores:
            return 0.0

        # Weight different categories
        weights = {
            "toxicity": 0.3,
            "harassment": 0.25,
            "hate_speech": 0.2,
            "threats": 0.15,
            "profanity": 0.1
        }

        weighted_score = 0.0
        total_weight = 0.0

        for category, score in scores.items():
            weight = weights.get(category, 0.2)
            weighted_score += (score / 10) * 100 * weight  # Convert to 0-100 scale
            total_weight += weight

        return weighted_score / total_weight if total_weight > 0 else 0.0

    def _get_risk_level(self, risk_score: float) -> str:
        """Determine risk level from score."""
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

    def _generate_detections(self, scores: Dict[str, float], text: str) -> List[Dict[str, Any]]:
        """Generate detection objects from scores."""
        detections = []

        for category, score in scores.items():
            if score > 3:  # Only include detections above threshold
                detections.append({
                    "detection_type": "ai_analysis",
                    "category": category.replace("_", " ").title(),
                    "severity": min(int(score), 4),  # Convert to 1-4 scale
                    "match": f"AI detected {category.replace('_', ' ')}",
                    "position": 0,
                    "confidence": min(score / 10, 1.0),
                    "method": "huggingface_gpt",
                    "actual_word": None
                })

        return detections

    def _empty_result(self) -> Dict[str, Any]:
        """Return empty result for invalid input."""
        return {
            "is_abusive": False,
            "risk_score": 0.0,
            "risk_level": "NONE",
            "detections": [],
            "categories": [],
            "confidence": 1.0,
            "processing_time": 0,
            "method": "huggingface_gpt",
            "model": self.model_name
        }

    def unload_model(self):
        """Unload the model to free memory."""
        if self.model is not None:
            del self.model
            del self.tokenizer
            del self.pipeline
            self.model = None
            self.tokenizer = None
            self.pipeline = None
            torch.cuda.empty_cache() if torch.cuda.is_available() else None
            logger.info("HuggingFace model unloaded")

# Alternative lightweight uncensored models that can be used:
# - "microsoft/DialoGPT-small" (fast, small)
# - "distilgpt2" (very fast, minimal)
# - "gpt2" (standard GPT-2)
# - "EleutherAI/gpt-neo-125M" (better quality, still small)
# - "microsoft/DialoGPT-medium" (balanced quality/speed)
