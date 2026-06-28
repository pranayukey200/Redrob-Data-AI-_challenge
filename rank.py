#!/usr/bin/env python3
"""
rank.py — IntelliRank: Rank 100K candidates against the Senior AI Engineer JD.

Usage:
    python rank.py --candidates ./data/raw/candidates.jsonl --out ./submission.csv

Pre-requisite (run once, takes ~3-5 min):
    python precompute.py --candidates ./data/raw/candidates.jsonl

Without precompute, falls back to rule-based scoring only (still good,
but no TF-IDF semantic signal).

Runtime: < 3 minutes on CPU with 16GB RAM.
Output:  submission.csv (candidate_id, rank, score, reasoning — top 100).
"""

import argparse
import csv
import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from pipeline.adapter import normalize
from pipeline import scorer as sc
from pipeline.tfidf_semantic import (
    load_tfidf,
    score_candidates,
    JD_QUERY,
)


def main():
    parser = argparse.ArgumentParser(description="IntelliRank — candidate ranker")
    parser.add_argument(
        "--candidates",
        default="./data/raw/candidates.jsonl",
        help="Path to candidates.jsonl",
    )
    parser.add_argument("--out", default="./output/intellirank.csv", help="Output CSV path")
    parser.add_argument("--top-k", type=int, default=100)
    parser.add_argument(
        "--no-semantic",
        action="store_true",
        help="Skip TF-IDF semantic scoring (use if precompute not run yet)",
    )
    args = parser.parse_args()

    candidates_path = Path(args.candidates)
    if not candidates_path.exists():
        print(f"Error: candidates file not found: {candidates_path}", file=sys.stderr)
        sys.exit(1)

    Path(args.out).parent.mkdir(parents=True, exist_ok=True)
    t_start = time.time()

    # -----------------------------------------------------------------------
    # 1. Load TF-IDF semantic scores (precomputed)
    # -----------------------------------------------------------------------
    tfidf_scores: dict[str, float] = {}
    use_semantic = not args.no_semantic

    if use_semantic:
        vectorizer, matrix, tfidf_ids = load_tfidf()
        if vectorizer is not None:
            print("Computing TF-IDF semantic scores...")
            t0 = time.time()
            tfidf_scores = score_candidates(vectorizer, matrix, tfidf_ids, JD_QUERY)
            print(f"  Done in {time.time()-t0:.1f}s — {len(tfidf_scores):,} candidates scored")
        else:
            print("TF-IDF cache not found — running without semantic score.")
            print("  Run: python precompute.py --candidates <path>")
            use_semantic = False

    # -----------------------------------------------------------------------
    # 2. Stream candidates, score, keep all results in memory
    # -----------------------------------------------------------------------
    print(f"Scoring candidates from: {candidates_path}")
    results: list[dict] = []
    errors = 0
    t_load = time.time()

    with open(candidates_path, encoding="utf-8") as f:
        for i, line in enumerate(f):
            try:
                raw = json.loads(line)
                cand = normalize(raw)
            except Exception:
                errors += 1
                continue

            cid = cand["candidate_id"]

            skill = sc.skill_match_score(cand)
            career = sc.career_fit_score(cand)
            behavioral = sc.behavioral_score(cand)

            # TF-IDF cosine sim is 0-1; convert to 0-100
            semantic = None
            if use_semantic and cid in tfidf_scores:
                semantic = round(tfidf_scores[cid] * 100, 2)

            final, _ = sc.fuse_scores(
                semantic=semantic,
                skill=skill,
                career=career,
                behavioral=behavioral,
            )

            # Honeypot detection: multiply final score by penalty factor
            honeypot_mult = sc.detect_honeypot(cand)
            final_adjusted = round(final * honeypot_mult, 4)

            scores = {
                "semantic_score": semantic,
                "skill_match_score": skill,
                "career_fit_score": career,
                "behavioral_score": behavioral,
                "final_score": final_adjusted,
            }

            results.append({
                "candidate_id": cid,
                "final_score": final_adjusted,
                "reasoning": sc.build_reasoning(cand, scores),
                "_scores": scores,
                "_honeypot_mult": honeypot_mult,
            })

            if (i + 1) % 20000 == 0:
                print(f"  Processed {i+1:,} in {time.time()-t_load:.1f}s...")

    load_elapsed = time.time() - t_load
    print(f"Scored {len(results):,} candidates ({errors} errors) in {load_elapsed:.1f}s")

    # -----------------------------------------------------------------------
    # 3. Sort: final_score descending, tie-break by candidate_id ascending
    # -----------------------------------------------------------------------
    results.sort(key=lambda x: (-x["final_score"], x["candidate_id"]))

    # -----------------------------------------------------------------------
    # 4. Write submission CSV (top-100)
    # -----------------------------------------------------------------------
    top_k = min(args.top_k, len(results))
    out_path = Path(args.out)

    # Re-sort top-k by the *rounded* output score then candidate_id, so the
    # validator's tie-break check (candidate_id ascending at equal scores) passes.
    top_rows = results[:top_k]
    top_rows.sort(key=lambda x: (-round(x["final_score"] / 100.0, 4), x["candidate_id"]))

    with open(out_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["candidate_id", "rank", "score", "reasoning"])
        for rank_num, r in enumerate(top_rows, start=1):
            # Spec: scores in 0-1 range (non-increasing), ties broken by candidate_id asc
            score_01 = round(r["final_score"] / 100.0, 4)
            writer.writerow([
                r["candidate_id"],
                rank_num,
                f"{score_01:.4f}",
                r["reasoning"],
            ])

    total_elapsed = time.time() - t_start
    print(f"\nDone in {total_elapsed:.1f}s -> {out_path}")

    # -----------------------------------------------------------------------
    # 5. Console sanity check (top 10)
    # -----------------------------------------------------------------------
    honeypot_penalized = sum(1 for r in results[:top_k] if r["_honeypot_mult"] < 1.0)
    print(f"\nHoneypot-penalized in top-{top_k}: {honeypot_penalized}")

    print("\n--- Top 10 candidates ---")
    for rank_num, r in enumerate(results[:10], start=1):
        s = r["_scores"]
        sem_str = f"{s['semantic_score']:.1f}" if s["semantic_score"] is not None else "N/A"
        hp_str = f" [HP x{r['_honeypot_mult']:.2f}]" if r["_honeypot_mult"] < 1.0 else ""
        print(
            f"  #{rank_num:2d} {r['candidate_id']} "
            f"score={r['final_score']/100:.4f} "
            f"skill={s['skill_match_score']:.1f} "
            f"career={s['career_fit_score']:.1f} "
            f"behav={s['behavioral_score']:.1f} "
            f"sem={sem_str}{hp_str}"
        )
        print(f"       {r['reasoning'][:120]}")


if __name__ == "__main__":
    main()
