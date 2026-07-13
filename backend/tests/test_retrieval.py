from ml.evaluate import recall_at_k
from ml.retrieval.feature_hashing import UserContext
from ml.retrieval.service import RetrievalService


def test_search_returns_ranked_products_with_signals():
    service = RetrievalService()

    results = service.search("wireless headphones", top_k=3)

    assert len(results) == 3
    assert results[0]["score"] >= results[1]["score"]
    assert results[0]["product"]["product_id"] in {"B001", "B002"}
    assert "semantic" in results[0]["signals"]
    assert "metadata" in results[0]["signals"]


def test_personalization_boosts_preferred_category():
    service = RetrievalService()
    context = UserContext(
        segment="home_office",
        preferred_categories=("Furniture",),
        price_sensitivity=0.2,
    )

    results = service.search("comfortable chair for desk", context=context, top_k=3)

    assert any(item["product"]["category"] == "Furniture" for item in results)


def test_recall_at_k_metric():
    score = recall_at_k({"B001", "B002"}, ["B001", "B008", "B003"], 2)

    assert score == 0.5
