from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from detection.content_detection_engine import ContentDetectionEngine
from detection.obfuscation_detector import ObfuscationDetector
from detection.fuzzy_matcher import FuzzyMatcher
from detection.pattern_analyzer import PatternAnalyzer
from nlp.sentiment_analyzer import SentimentAnalyzer
from suggestions.rephrasing_engine import RephrasingEngine

# Initialize FastAPI
app = FastAPI(title="TypeAware AI API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load models/services
content_engine = ContentDetectionEngine()
obfuscation_detector = ObfuscationDetector()
fuzzy_matcher = FuzzyMatcher(min_similarity=0.70)
pattern_analyzer = PatternAnalyzer()
sentiment_analyzer = SentimentAnalyzer()
rephrasing_engine = RephrasingEngine()

# Request / Response models
class PredictRequest(BaseModel):
    text: str

class PredictResponse(BaseModel):
    scores: Dict[str, float]
    overall_score: float
    confidence: float
    processing_time: float
    detected_patterns: List[str]

@app.get("/health")
async def health():
    return {"status": "ok", "service": "TypeAware AI"}

@app.post("/test")
async def test():
    return {"message": "test endpoint works"}

@app.post("/predict")
async def predict(req: PredictRequest):
    import logging
    logging.info("Received /predict request")
    print("DEBUG: Received /predict request")  # Add print for immediate visibility
    text = req.text
    logging.info(f"Text received: {text}")
    print(f"DEBUG: Text received: {text}")  # Add print for immediate visibility

    try:
        logging.info("Starting content detection")
        detection_result = content_engine.detect_abusive_content(text)
        logging.info(f"Content detection result: {detection_result}")

        logging.info("Starting sentiment analysis")
        sentiment = sentiment_analyzer.analyze_sentiment(text)
        logging.info(f"Sentiment analysis result: {sentiment}")

        logging.info("Starting obfuscation detection")
        # Use detect_obfuscated_words with a list of suspicious words for better detection
        suspicious_words = ['idiot', 'stupid', 'hate', 'kill']
        obfuscation_matches = obfuscation_detector.detect_obfuscated_words(text, suspicious_words)
        obfuscation = len(obfuscation_matches) > 0
        logging.info(f"Obfuscation detection matches: {obfuscation_matches}")

        logging.info("Starting pattern analysis")
        patterns = pattern_analyzer.analyze_message_patterns(text, {})
        logging.info(f"Pattern analysis result: {patterns}")

        logging.info("Starting fuzzy matching")
        fuzzy_matches = fuzzy_matcher.find_fuzzy_matches(text, suspicious_words, context_size=10)
        logging.info(f"Fuzzy matching result: {fuzzy_matches}")

        toxicity_score = detection_result.risk_score / 100.0  # Normalize to 0-1
        flagged = toxicity_score > 0.7 or obfuscation or bool(patterns)
        reasons = []
        if toxicity_score > 0.7:
            reasons.append("High toxicity")
        if obfuscation:
            reasons.append("Obfuscation detected")
        if patterns:
            reasons.append("Suspicious patterns found")
        if fuzzy_matches:
            reasons.append("Possible fuzzy match")

        logging.info("Returning prediction response")
        return PredictResponse(
            scores={
                "harassment": toxicity_score,
                "hate_speech": toxicity_score * 0.8,
                "threats": 0.0 if "threats" not in str(detection_result.categories) else 1.0,
                "obscenity": 0.0 if not obfuscation else 0.5
            },
            overall_score=toxicity_score,
            confidence=0.8,  # Placeholder confidence
            processing_time=0.1,  # Placeholder processing time
            detected_patterns=reasons
        )
    except Exception as e:
        import logging
        import traceback
        logging.error(f"Error in predict endpoint: {str(e)}", exc_info=True)
        logging.error(traceback.format_exc())
        # Return a default response on error
        return {"error": "Internal Server Error", "message": str(e)}

@app.post("/rephrase")
async def rephrase(req: PredictRequest):
    import logging
    logging.info("Received /rephrase request")
    print("DEBUG: Received /rephrase request")
    text = req.text
    logging.info(f"Text received: {text}")
    print(f"DEBUG: Text received: {text}")

    try:
        logging.info("Starting rephrasing")
        rephrasing_result = rephrasing_engine.generate_suggestions(text)
        logging.info(f"Rephrasing result: {rephrasing_result}")

        # Extract suggestions from the result
        suggestions = [s.suggested_text for s in rephrasing_result.suggestions]

        return {
            "original_text": text,
            "rephrased_suggestions": suggestions
        }
    except Exception as e:
        import logging
        import traceback
        logging.error(f"Error in rephrase endpoint: {str(e)}", exc_info=True)
        logging.error(traceback.format_exc())
        return {"error": "Internal Server Error", "message": str(e)}

if __name__ == "__main__":
    import uvicorn
    import logging
    logging.info("Starting TypeAware AI Server...")
    logging.info("MongoDB URL: mongodb://localhost:27017")
    logging.info("API Host: 0.0.0.0:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)
