from __future__ import annotations

import argparse


def main() -> None:
    parser = argparse.ArgumentParser(description="Train a two-tower retrieval model on ESCI-style data.")
    parser.add_argument("--train-path", default="ml/data/esci_train.csv")
    parser.add_argument("--epochs", type=int, default=5)
    parser.add_argument("--embedding-dim", type=int, default=128)
    args = parser.parse_args()

    try:
        import torch  # noqa: F401
        from ml.training.two_tower_model import TwoTowerRetrievalModel
    except ImportError as exc:
        raise SystemExit(
            "Install optional ML dependencies first: pip install torch pandas scikit-learn"
        ) from exc

    print("Training scaffold ready.")
    print(f"Input: {args.train_path}")
    print(f"Epochs: {args.epochs}")
    print(f"Embedding dimension: {args.embedding_dim}")
    print(f"Model class: {TwoTowerRetrievalModel.__name__}")


if __name__ == "__main__":
    main()
