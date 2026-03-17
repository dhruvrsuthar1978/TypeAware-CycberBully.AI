from __future__ import annotations

import hashlib
import math
import re
from dataclasses import dataclass


@dataclass
class ModerationEngine:
    blocked_terms: tuple[str, ...] = (
        "idiot",
        "stupid",
        "moron",
        "loser",
        "dumb",
        "fool",
        "hateyou",
        "shutup",
        "fuck",
        "fucking",
        "motherfucker",
        "bitch",
        "whore",
        "slut",
        "rape",
        "rapeyou",
        "killyourself",
    )

    safe_terms: tuple[str, ...] = (
        "please",
        "thanks",
        "sorry",
        "help",
        "kindly",
        "appreciate",
        "good",
        "great",
    )

    leet_map: dict[str, str] = None
    vector_size: int = 4096
    epochs: int = 20
    learning_rate: float = 0.14
    weights: list[float] = None
    bias: float = 0.0

    def __post_init__(self) -> None:
        if self.leet_map is None:
            self.leet_map = {
                "0": "o",
                "1": "i",
                "3": "e",
                "4": "a",
                "5": "s",
                "7": "t",
                "8": "b",
                "!": "i",
                "@": "a",
                "$": "s",
            }
        if self.weights is None:
            self.weights = [0.0] * self.vector_size
        self._train_classifier()

    def _normalize(self, text: str) -> str:
        lowered = text.lower()
        chars: list[str] = []
        for ch in lowered:
            mapped = self.leet_map.get(ch, ch)
            if mapped.isalnum():
                chars.append(mapped)
        return "".join(chars)

    def _normalize_for_model(self, text: str) -> str:
        lowered = text.lower()
        mapped_chars: list[str] = []
        for ch in lowered:
            mapped = self.leet_map.get(ch, ch)
            if mapped.isalnum() or mapped.isspace():
                mapped_chars.append(mapped)
        compact = "".join(mapped_chars)
        return re.sub(r"\s+", " ", compact).strip()

    def _stable_hash(self, value: str) -> int:
        digest = hashlib.blake2b(value.encode("utf-8"), digest_size=8).digest()
        return int.from_bytes(digest, "big") % self.vector_size

    def _vectorize(self, text: str) -> dict[int, float]:
        normalized = self._normalize_for_model(text)
        features: dict[int, float] = {}

        tokens = [t for t in normalized.split(" ") if t]
        for token in tokens:
            idx = self._stable_hash(f"w:{token}")
            features[idx] = features.get(idx, 0.0) + 1.0

        for i in range(len(tokens) - 1):
            idx = self._stable_hash(f"b:{tokens[i]}_{tokens[i + 1]}")
            features[idx] = features.get(idx, 0.0) + 1.0

        compact = normalized.replace(" ", "")
        for n in (3, 4, 5):
            if len(compact) < n:
                continue
            for i in range(len(compact) - n + 1):
                gram = compact[i : i + n]
                idx = self._stable_hash(f"c{n}:{gram}")
                features[idx] = features.get(idx, 0.0) + 0.35

        length_idx = self._stable_hash("meta:length")
        features[length_idx] = min(len(compact), 200) / 200.0
        return features

    def _sigmoid(self, value: float) -> float:
        if value >= 35:
            return 1.0
        if value <= -35:
            return 0.0
        return 1.0 / (1.0 + math.exp(-value))

    def _obfuscate_word(self, word: str) -> set[str]:
        variants = {word}
        reverse_map = {
            "a": "@",
            "e": "3",
            "i": "1",
            "o": "0",
            "s": "$",
            "t": "7",
        }
        chars = [reverse_map.get(ch, ch) for ch in word]
        variants.add("".join(chars))
        variants.add(" ".join(list(word)))
        variants.add(word.replace("i", "1").replace("o", "0"))
        return variants

    def _build_training_data(self) -> list[tuple[str, int]]:
        toxic_templates = [
            "you are {w}",
            "shut up {w}",
            "go away {w}",
            "nobody likes you {w}",
            "you are such a {w}",
            "everyone hates you {w}",
            "stop talking {w}",
            "{w}",
        ]
        safe_samples = [
            "can you please help me with this homework",
            "great job on the presentation",
            "thanks for sharing this",
            "let us work together on this task",
            "sorry for the confusion",
            "that was a useful comment",
            "i appreciate your support",
            "please explain this topic again",
            "you did well in the class activity",
            "let us keep this discussion respectful",
            "i disagree with your idea but i respect you",
            "good morning hope you are doing well",
            "can we discuss this calmly",
            "thank you for helping everyone",
        ]

        dataset: list[tuple[str, int]] = []
        for word in self.blocked_terms:
            variants = self._obfuscate_word(word)
            for variant in variants:
                for template in toxic_templates:
                    dataset.append((template.format(w=variant), 1))

        direct_toxic = [
            "you are useless",
            "you are pathetic",
            "go die",
            "kill yourself",
            "i hate you",
            "you are the worst person",
            "nobody wants you here",
        ]
        dataset.extend((sample, 1) for sample in direct_toxic)

        dataset.extend((sample, 0) for sample in safe_samples)

        for word in self.safe_terms:
            dataset.append((f"please {word} this message", 0))
            dataset.append((f"thanks {word} for your support", 0))
        return dataset

    def _train_classifier(self) -> None:
        dataset = self._build_training_data()
        lr = self.learning_rate

        for _ in range(self.epochs):
            for text, label in dataset:
                features = self._vectorize(text)
                logit = self.bias
                for idx, value in features.items():
                    logit += self.weights[idx] * value
                prob = self._sigmoid(logit)
                error = prob - float(label)
                self.bias -= lr * error
                for idx, value in features.items():
                    self.weights[idx] -= lr * error * value
            lr *= 0.94

    def _predict_toxic_probability(self, text: str) -> float:
        features = self._vectorize(text)
        logit = self.bias
        for idx, value in features.items():
            logit += self.weights[idx] * value
        return self._sigmoid(logit)

    def _levenshtein(self, a: str, b: str) -> int:
        if a == b:
            return 0
        if not a:
            return len(b)
        if not b:
            return len(a)

        previous = list(range(len(b) + 1))
        for i, ca in enumerate(a, start=1):
            current = [i]
            for j, cb in enumerate(b, start=1):
                insertions = previous[j] + 1
                deletions = current[j - 1] + 1
                substitutions = previous[j - 1] + (ca != cb)
                current.append(min(insertions, deletions, substitutions))
            previous = current
        return previous[-1]

    def _tokenize_soft(self, text: str) -> list[str]:
        return [token for token in re.split(r"\s+", text.lower()) if token]

    def _intent_score(self, text: str) -> float:
        normalized = self._normalize_for_model(text)
        score = 0.0

        if re.search(r"\byou are\b", normalized):
            score += 0.2
        if re.search(r"\beveryone hates you\b", normalized):
            score += 0.45
        if re.search(r"\bgo die\b|\bkill yourself\b", normalized):
            score += 0.7
        if re.search(r"\bshut up\b", normalized):
            score += 0.25
        if re.search(r"\b(stupid|idiot|moron|loser|dumb|fool)\b", normalized):
            score += 0.25
        if re.search(r"\b(fuck|fucking|motherfucker|bitch|whore|slut)\b", normalized):
            score += 0.45
        if re.search(r"\b(i will|i'll|im gonna|i am going to)\b.*\b(fuck|rape|hurt|kill)\b", normalized):
            score += 0.65
        return min(score, 1.0)

    def analyze(self, text: str) -> dict:
        normalized_full = self._normalize(text)
        tokens = self._tokenize_soft(text)
        normalized_tokens = [self._normalize(token) for token in tokens if token]

        matches: list[dict] = []
        for term in self.blocked_terms:
            if term in normalized_full:
                matches.append({"term": term, "mode": "normalized_contains"})
                continue

            for candidate in normalized_tokens:
                if not candidate:
                    continue
                max_distance = 1 if len(term) <= 5 else 2
                distance = self._levenshtein(candidate, term)
                if distance <= max_distance:
                    matches.append(
                        {
                            "term": term,
                            "mode": "fuzzy_token",
                            "distance": distance,
                            "candidate": candidate,
                        }
                    )
                    break

        ml_probability = self._predict_toxic_probability(text)
        intent_score = self._intent_score(text)
        rule_score = min(1.0, len(matches) / 2.0)
        risk_score = (0.55 * ml_probability) + (0.25 * rule_score) + (0.20 * intent_score)

        # Calibrate score downward for clearly non-rule, low-intent content.
        if len(matches) == 0:
            if intent_score < 0.2:
                risk_score *= 0.45
            elif intent_score < 0.35:
                risk_score *= 0.7

        flagged = len(matches) > 0 or risk_score >= 0.58
        suggestion = self._suggest_rephrase(text, [m["term"] for m in matches]) if flagged else text

        if risk_score >= 0.82:
            severity = "high"
        elif risk_score >= 0.58:
            severity = "medium"
        else:
            severity = "none"

        if flagged:
            message = f"Potential harmful content detected (risk {risk_score:.2f})."
        else:
            message = f"Looks respectful (risk {risk_score:.2f})."

        return {
            "flagged": flagged,
            "severity": severity,
            "risk_score": round(risk_score, 4),
            "ml_toxic_probability": round(ml_probability, 4),
            "intent_score": round(intent_score, 4),
            "matches": matches,
            "suggestion": suggestion,
            "message": message,
        }

    def _suggest_rephrase(self, text: str, terms: list[str]) -> str:
        normalized = self._normalize_for_model(text)

        threat_pattern = re.search(r"\b(kill yourself|go die|i will .*?(hurt|kill|rape)|i'll .*?(hurt|kill|rape))\b", normalized)
        profanity_pattern = re.search(r"\b(fuck|fucking|motherfucker|bitch|whore|slut)\b", normalized)
        insult_pattern = re.search(r"\b(idiot|stupid|moron|loser|dumb|fool)\b", normalized)
        hostility_pattern = re.search(r"\b(hate you|everyone hates you|nobody likes you|shut up)\b", normalized)

        if threat_pattern:
            return "I am upset right now. I need space before we continue this conversation respectfully."

        if hostility_pattern:
            return "I disagree strongly, but I want to discuss this respectfully."

        if insult_pattern and re.search(r"\byou are\b", normalized):
            return "I disagree with what you said. Can we discuss the specific issue calmly?"

        if profanity_pattern:
            return "I am frustrated. I want to explain my concern without using abusive language."

        # Generic fallback for other toxic or obfuscated cases.
        return "Please rewrite this message in respectful language and focus on the issue, not the person."


moderation_engine = ModerationEngine()
