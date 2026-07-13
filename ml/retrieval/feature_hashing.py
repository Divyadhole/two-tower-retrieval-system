from __future__ import annotations

import hashlib
import math
import re
from dataclasses import dataclass


TOKEN_RE = re.compile(r"[a-z0-9]+")


@dataclass(frozen=True)
class Product:
    product_id: str
    title: str
    category: str
    price: float
    rating: float
    review_count: int
    popularity: float


@dataclass(frozen=True)
class UserContext:
    segment: str = "general"
    preferred_categories: tuple[str, ...] = ()
    price_sensitivity: float = 0.5


class FeatureHasher:
    """Small dependency-free embedding helper for local demo and tests.

    The training folder includes the PyTorch two-tower skeleton. This class keeps
    the API runnable without GPU libraries by using signed feature hashing.
    """

    def __init__(self, dimensions: int = 64) -> None:
        self.dimensions = dimensions

    def encode_query(self, query: str, context: UserContext | None = None) -> list[float]:
        tokens = self._tokens(query)
        features = [f"term:{token}" for token in tokens]
        features.extend(f"q:{token}" for token in tokens)
        if context:
            features.extend(f"seg:{context.segment}:{token}" for token in tokens)
            features.extend(f"pref:{category.lower()}" for category in context.preferred_categories)
            features.append(f"price_sensitivity:{round(context.price_sensitivity, 1)}")
        return self._normalize(self._hash_features(features))

    def encode_product(self, product: Product) -> list[float]:
        tokens = self._tokens(product.title)
        features = [f"term:{token}" for token in tokens]
        features.extend(f"title:{token}" for token in tokens)
        features.extend(
            [
                f"category:{product.category.lower()}",
                f"price_bucket:{self._price_bucket(product.price)}",
                f"rating_bucket:{math.floor(product.rating)}",
                f"reviews_bucket:{min(product.review_count // 500, 10)}",
                f"popularity:{round(product.popularity, 1)}",
            ]
        )
        return self._normalize(self._hash_features(features))

    def score(self, query_embedding: list[float], item_embedding: list[float]) -> float:
        return sum(left * right for left, right in zip(query_embedding, item_embedding))

    def _tokens(self, text: str) -> list[str]:
        return [token for token in TOKEN_RE.findall(text.lower()) if len(token) > 1]

    def _hash_features(self, features: list[str]) -> list[float]:
        vector = [0.0] * self.dimensions
        for feature in features:
            digest = hashlib.blake2b(feature.encode("utf-8"), digest_size=8).digest()
            hashed = int.from_bytes(digest, "big")
            index = hashed % self.dimensions
            sign = 1 if (hashed >> 8) % 2 == 0 else -1
            vector[index] += sign
        return vector

    def _normalize(self, vector: list[float]) -> list[float]:
        norm = math.sqrt(sum(value * value for value in vector))
        if norm == 0:
            return vector
        return [value / norm for value in vector]

    def _price_bucket(self, price: float) -> str:
        if price < 25:
            return "budget"
        if price < 100:
            return "mid"
        return "premium"
