from __future__ import annotations

try:
    import torch
    from torch import nn
except ImportError:  # pragma: no cover - documented optional dependency
    torch = None
    nn = None


if nn:

    class Tower(nn.Module):
        def __init__(self, input_dim: int, embedding_dim: int = 128) -> None:
            super().__init__()
            self.network = nn.Sequential(
                nn.Linear(input_dim, 256),
                nn.ReLU(),
                nn.LayerNorm(256),
                nn.Dropout(0.1),
                nn.Linear(256, embedding_dim),
            )

        def forward(self, features):
            return nn.functional.normalize(self.network(features), dim=-1)


    class TwoTowerRetrievalModel(nn.Module):
        def __init__(self, query_dim: int, item_dim: int, embedding_dim: int = 128) -> None:
            super().__init__()
            self.query_tower = Tower(query_dim, embedding_dim)
            self.item_tower = Tower(item_dim, embedding_dim)

        def forward(self, query_features, item_features):
            query_embedding = self.query_tower(query_features)
            item_embedding = self.item_tower(item_features)
            return query_embedding @ item_embedding.T

        def loss(self, query_features, positive_item_features):
            logits = self.forward(query_features, positive_item_features)
            labels = torch.arange(logits.shape[0], device=logits.device)
            return nn.functional.cross_entropy(logits, labels)
else:
    Tower = None
    TwoTowerRetrievalModel = None
