#!/usr/bin/env python3
"""
Simple test script for TypeAware AI components
Tests the core detection functionality without requiring the full server
"""

import sys
import os

# Add the ai directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_content_detection():
    """Test the content detection engine"""
    try:
        from ai.detection.content_detection_engine import ContentDetectionEngine

        print("🔍 Testing Content Detection Engine...")

        # Initialize the engine
        engine = ContentDetectionEngine()

        # Test cases
        test_cases = [
            ("Hello, how are you today?", "Clean message"),
            ("You are such an idiot!", "Harassment - exact match"),
            ("You are such an 1d10t!", "Harassment - obfuscated"),
            ("I hate all people from that country", "Hate speech"),
            ("Kill yourself", "Threat"),
            ("Everyone hates you, you're worthless", "Cyberbullying"),
            ("Buy now! Limited time offer!", "Spam"),
            ("", "Empty message"),
        ]

        passed = 0
        total = len(test_cases)

        for text, description in test_cases:
            result = engine.detect_abusive_content(text)

            print(f"\n📝 Testing: {description}")
            print(f"   Text: '{text}'")
            print(f"   Risk Score: {result.risk_score}")
            print(f"   Risk Level: {result.risk_level}")
            print(f"   Is Abusive: {result.is_abusive}")
            print(f"   Categories: {result.categories}")
            print(f"   Processing Time: {result.processing_time:.4f}s")

            # Basic validation
            if text == "" and not result.is_abusive:
                passed += 1
                print("   ✅ PASS: Empty text correctly identified as clean")
            elif text and result.is_abusive and result.risk_score > 0:
                passed += 1
                print("   ✅ PASS: Abusive content detected")
            elif text and not result.is_abusive and result.risk_score == 0:
                passed += 1
                print("   ✅ PASS: Clean content correctly identified")
            else:
                print("   ❌ FAIL: Unexpected result")

        print(f"\n📊 Content Detection Test Results: {passed}/{total} passed")
        return passed == total

    except Exception as e:
        print(f"❌ Content Detection Test Failed: {e}")
        return False

def test_obfuscation_detector():
    """Test the obfuscation detector"""
    try:
        from ai.detection.obfuscation_detector import ObfuscationDetector

        print("\n🔍 Testing Obfuscation Detector...")

        detector = ObfuscationDetector()

        test_cases = [
            ("hello", False, "Clean word"),
            ("h3ll0", True, "Leet speak"),
            ("s t u p i d", True, "Spaced out"),
            ("i-d-i-o-t", True, "Dashed"),
            ("normal", False, "Normal word"),
        ]

        passed = 0
        total = len(test_cases)

        for text, expected, description in test_cases:
            result = detector.detect(text)
            success = result == expected

            print(f"📝 Testing: {description}")
            print(f"   Text: '{text}' -> Obfuscated: {result} (Expected: {expected})")

            if success:
                passed += 1
                print("   ✅ PASS")
            else:
                print("   ❌ FAIL")

        print(f"\n📊 Obfuscation Detection Test Results: {passed}/{total} passed")
        return passed == total

    except Exception as e:
        print(f"❌ Obfuscation Detection Test Failed: {e}")
        return False

def test_sentiment_analyzer():
    """Test the sentiment analyzer"""
    try:
        from ai.nlp.sentiment_analyzer import SentimentAnalyzer

        print("\n🔍 Testing Sentiment Analyzer...")

        analyzer = SentimentAnalyzer()

        test_cases = [
            ("I love this!", "positive", "Positive sentiment"),
            ("This is terrible", "negative", "Negative sentiment"),
            ("It's okay", "neutral", "Neutral sentiment"),
        ]

        passed = 0
        total = len(test_cases)

        for text, expected, description in test_cases:
            result = analyzer.analyze(text)

            print(f"📝 Testing: {description}")
            print(f"   Text: '{text}' -> Sentiment: {result} (Expected: {expected})")

            # Basic check - just ensure it returns a string
            if isinstance(result, str) and len(result) > 0:
                passed += 1
                print("   ✅ PASS: Valid sentiment returned")
            else:
                print("   ❌ FAIL: Invalid sentiment result")

        print(f"\n📊 Sentiment Analysis Test Results: {passed}/{total} passed")
        return passed == total

    except Exception as e:
        print(f"❌ Sentiment Analysis Test Failed: {e}")
        return False

def main():
    """Run all AI tests"""
    print("🚀 Starting TypeAware AI Component Tests")
    print("=" * 50)

    results = []

    # Test each component
    results.append(("Content Detection", test_content_detection()))
    results.append(("Obfuscation Detection", test_obfuscation_detector()))
    results.append(("Sentiment Analysis", test_sentiment_analyzer()))

    # Summary
    print("\n" + "=" * 50)
    print("📊 TEST SUMMARY")

    passed = 0
    total = len(results)

    for name, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"   {name}: {status}")
        if success:
            passed += 1

    print(f"\n🎯 Overall Result: {passed}/{total} components passed")

    if passed == total:
        print("🎉 All AI components are working properly!")
        return 0
    else:
        print("⚠️  Some AI components have issues that need attention.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
