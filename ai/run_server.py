from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
from ai.detection.content_detection_engine import ContentDetectionEngine
from ai.detection.obfuscation_detector import ObfuscationDetector
from ai.detection.fuzzy_matcher import FuzzyMatcher
from ai.detection.pattern_analyzer import PatternAnalyzer
from ai.nlp.sentiment_analyzer import SentimentAnalyzer

# Initialize FastAPI
app = FastAPI(title="TypeAware AI API", version="1.0.0")

# Load models/services
content_engine = ContentDetectionEngine()
obfuscation_detector = ObfuscationDetector()
fuzzy_matcher = FuzzyMatcher(min_similarity=0.70)
pattern_analyzer = PatternAnalyzer()
sentiment_analyzer = SentimentAnalyzer()

# Request / Response models
class PredictRequest(BaseModel):
    text: str

class PredictResponse(BaseModel):
    text: str
    toxicity_score: float
    sentiment: str
    flagged: bool
    reasons: List[str]

@app.get("/health")
async def health():
    return {"status": "ok", "service": "TypeAware AI"}

@app.post("/predict", response_model=PredictResponse)
async def predict(req: PredictRequest):
    text = req.text

    toxicity_score = content_engine.analyze(text)
    sentiment = sentiment_analyzer.analyze(text)
    obfuscation = obfuscation_detector.detect(text)
    patterns = pattern_analyzer.find_patterns(text)
    fuzzy_matches = fuzzy_matcher.match(text)

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

    return PredictResponse(
        text=text,
        toxicity_score=toxicity_score,
        sentiment=sentiment,
        flagged=flagged,
        reasons=reasons
    )
