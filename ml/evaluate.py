from __future__ import annotations

import math


def recall_at_k(relevant_ids: set[str], ranked_ids: list[str], k: int) -> float:
    if not relevant_ids:
        return 0.0
    return len(relevant_ids & set(ranked_ids[:k])) / len(relevant_ids)


def ndcg_at_k(relevance_by_id: dict[str, int], ranked_ids: list[str], k: int) -> float:
    def gain(rel: int) -> float:
        return (2**rel - 1)

    dcg = sum(gain(relevance_by_id.get(item_id, 0)) / math.log2(idx + 2) for idx, item_id in enumerate(ranked_ids[:k]))
    ideal = sorted(relevance_by_id.values(), reverse=True)[:k]
    idcg = sum(gain(rel) / math.log2(idx + 2) for idx, rel in enumerate(ideal))
    return 0.0 if idcg == 0 else round(dcg / idcg, 4)
