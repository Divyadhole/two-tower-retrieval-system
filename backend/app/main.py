from __future__ import annotations

import sys
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

ROOT = Path(__file__).resolve().parents[2]
sys.path.append(str(ROOT))

from ml.retrieval.feature_hashing import UserContext  # noqa: E402
from ml.retrieval.service import RetrievalService  # noqa: E402


class SearchRequest(BaseModel):
    query: str = Field(min_length=2)
    segment: str = "general"
    preferred_categories: list[str] = []
    price_sensitivity: float = Field(default=0.5, ge=0, le=1)
    top_k: int = Field(default=5, ge=1, le=8)


app = FastAPI(
    title="Two-Tower Product Retrieval System",
    description="Scalable e-commerce retrieval API with query/item towers, metadata signals, and personalization.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5190", "http://127.0.0.1:5190"],
    allow_methods=["*"],
    allow_headers=["*"],
)

retrieval_service = RetrievalService()


@app.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "index_size": len(retrieval_service.products),
        "model": "two-tower-hashed-demo",
    }


@app.post("/search")
def search(payload: SearchRequest) -> dict:
    context = UserContext(
        segment=payload.segment,
        preferred_categories=tuple(payload.preferred_categories),
        price_sensitivity=payload.price_sensitivity,
    )
    results = retrieval_service.search(payload.query, context=context, top_k=payload.top_k)
    return {
        "query": payload.query,
        "segment": payload.segment,
        "results": results,
    }
