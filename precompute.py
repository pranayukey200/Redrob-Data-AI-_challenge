#!/usr/bin/env python3
"""
precompute.py — Offline precomputation of TF-IDF semantic index.

Run this ONCE before rank.py. Saves index to ./cache/ so rank.py can run
fully offline in < 5 minutes on CPU.

Usage:
    python precompute.py --candidates ./data/raw/candidates.jsonl

Runtime: ~3-5 minutes on CPU for 100K candidates.
Output:  ./cache/tfidf_vectorizer.pkl
         ./cache/tfidf_matrix.pkl
         ./cache/tfidf_ids.pkl

Note: sentence-transformers (neural embeddings) are also supported if
      the model can be downloaded. TF-IDF is the offline fallback.
"""

import argparse
import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from pipeline.adapter import normalize
from pipeline.tfidf_semantic import (
    build_tfidf_index,
    save_tfidf,
    JD_QUERY,
)


def precompute_tfidf(candidates_path: str) -> None:
    print(f"Loading candidates from: {candidates_path}")

    texts: list[str] = []
    candidate_ids: list[str] = []

    with open(candidates_path, encoding="utf-8") as f:
        for i, line in enumerate(f):
            try:
                raw = json.loads(line)
                cand = normalize(raw)
                candidate_ids.append(cand["candidate_id"])
                texts.append(cand["profile_text"])
            except Exception as e:
                print(f"  Warning: skipping line {i}: {e}")

            if (i + 1) % 20000 == 0:
                print(f"  Loaded {i+1:,} candidates...")

    print(f"Total candidates: {len(texts):,}")

    t0 = time.time()
    vectorizer, matrix = build_tfidf_index(candidate_ids, texts)
    elapsed = time.time() - t0
    print(f"TF-IDF index built in {elapsed:.1f}s")

    save_tfidf(vectorizer, matrix, candidate_ids)
    print("Precomputation complete.")

    # Quick sanity check — top 5 by TF-IDF similarity
    from pipeline.tfidf_semantic import score_candidates
    scores = score_candidates(vectorizer, matrix, candidate_ids, JD_QUERY)
    top5 = sorted(scores.items(), key=lambda x: -x[1])[:5]
    print("\nTF-IDF top-5 sanity check:")
    for cid, score in top5:
        print(f"  {cid}  {score:.4f}")


def main():
    parser = argparse.ArgumentParser(description="Precompute TF-IDF index for IntelliRank")
    parser.add_argument(
        "--candidates",
        default="./data/raw/candidates.jsonl",
        help="Path to candidates.jsonl",
    )
    args = parser.parse_args()

    if not Path(args.candidates).exists():
        print(f"Error: candidates file not found: {args.candidates}")
        sys.exit(1)

    precompute_tfidf(args.candidates)
    print("\nRun: python rank.py --candidates <path> --out submission.csv")


if __name__ == "__main__":
    main()
