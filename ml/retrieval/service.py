from __future__ import annotations

from dataclasses import asdict

from ml.retrieval.catalog import DEMO_CATALOG
from ml.retrieval.feature_hashing import FeatureHasher, Product, UserContext


class RetrievalService:
    def __init__(self, products: list[Product] | None = None, dimensions: int = 96) -> None:
        self.products = products or DEMO_CATALOG
        self.encoder = FeatureHasher(dimensions=dimensions)
        self.item_embeddings = {
            product.product_id: self.encoder.encode_product(product) for product in self.products
        }

    def search(self, query: str, context: UserContext | None = None, top_k: int = 5) -> list[dict]:
        query_embedding = self.encoder.encode_query(query, context)
        scored = []
        for product in self.products:
            base_score = self.encoder.score(query_embedding, self.item_embeddings[product.product_id])
            metadata_score = self._metadata_boost(product, context)
            score = round(base_score + metadata_score, 4)
            scored.append(
                {
                    "product": asdict(product),
                    "score": score,
                    "signals": {
                        "semantic": round(base_score, 4),
                        "metadata": round(metadata_score, 4),
                        "category": product.category,
                        "rating": product.rating,
                        "popularity": product.popularity,
                    },
                }
            )
        return sorted(scored, key=lambda item: item["score"], reverse=True)[:top_k]

    def _metadata_boost(self, product: Product, context: UserContext | None) -> float:
        quality = (product.rating - 4.0) * 0.05 + product.popularity * 0.08
        if not context:
            return quality
        category_match = 0.12 if product.category in context.preferred_categories else 0
        price_alignment = (1 - min(product.price / 250, 1)) * context.price_sensitivity * 0.08
        return quality + category_match + price_alignment
