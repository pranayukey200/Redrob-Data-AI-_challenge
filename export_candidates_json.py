"""
export_candidates_json.py — Pre-compute all candidate scores and export top-N to a
static JSON file for Firebase Hosting.

Run once:
    python export_candidates_json.py

Output: frontend/public/candidates_data.json  (~600 KB)
The frontend fetches this file at runtime and re-ranks in-browser (< 100ms).
"""

import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from pipeline.adapter import normalize
from pipeline import scorer as sc
from pipeline.tfidf_semantic import load_tfidf, score_candidates, JD_QUERY
from pipeline.jd_config import JD

CANDIDATES_PATH = Path("data/raw/candidates.jsonl")
OUTPUT_PATH = Path("frontend/public/candidates_data.json")
TOP_N = 500
DEFAULT_WEIGHTS = {"semantic": 0.20, "skill": 0.35, "career": 0.30, "behavioral": 0.15}

def main():
    t0 = time.time()

    # ── 1. Load TF-IDF cache ────────────────────────────────────────────────
    print("Loading TF-IDF cache (this takes ~30s for the 421 MB matrix)...")
    vectorizer, matrix, tfidf_ids = load_tfidf()
    semantic_scores: dict[str, float] = {}
    if vectorizer is not None:
        print(f"  Loaded {len(tfidf_ids):,} TF-IDF vectors. Scoring against JD query...")
        raw_sims = score_candidates(vectorizer, matrix, tfidf_ids, JD_QUERY)
        # Convert 0-1 cosine sim to 0-100
        semantic_scores = {cid: min(v * 100, 100.0) for cid, v in raw_sims.items()}
        print(f"  TF-IDF scoring done. {time.time()-t0:.1f}s elapsed.")
    else:
        print("  No TF-IDF cache found — semantic scores will be null.")

    # ── 2. Load + score all candidates ──────────────────────────────────────
    print(f"\nLoading candidates from {CANDIDATES_PATH} ...")
    if not CANDIDATES_PATH.exists():
        print(f"ERROR: {CANDIDATES_PATH} not found.")
        sys.exit(1)

    results = []
    errors = 0
    with open(CANDIDATES_PATH, encoding="utf-8") as f:
        for i, line in enumerate(f):
            if i % 10_000 == 0:
                print(f"  {i:,} / ~100,000  ({time.time()-t0:.0f}s)")
            line = line.strip()
            if not line:
                continue
            try:
                raw = json.loads(line)
                cand = normalize(raw)
                cid = cand["candidate_id"]

                skill    = sc.skill_match_score(cand)
                career   = sc.career_fit_score(cand)
                behavioral = sc.behavioral_score(cand)
                semantic = semantic_scores.get(cid)  # None if no cache

                final, _ = sc.fuse_scores(
                    semantic=semantic,
                    skill=skill,
                    career=career,
                    behavioral=behavioral,
                    weights=DEFAULT_WEIGHTS,
                )
                reasoning = sc.build_reasoning(cand, {"final_score": final})

                results.append({
                    "candidate_id": cid,
                    "name":         cand.get("name", ""),
                    "headline":     cand.get("headline", ""),
                    "current_title": cand.get("current_title", ""),
                    "years_experience": cand.get("years_experience", 0),
                    "country":      cand.get("country", ""),
                    "location":     cand.get("location", ""),
                    "skill_names":  cand.get("skill_names", [])[:25],
                    "open_to_work": cand.get("open_to_work", False),
                    "notice_period_days": cand.get("notice_period_days", 90),
                    "recruiter_response_rate": cand.get("recruiter_response_rate", 0),
                    "final_score":        round(final, 4),
                    "skill_match_score":  round(skill, 4),
                    "career_fit_score":   round(career, 4),
                    "behavioral_score":   round(behavioral, 4),
                    "semantic_score":     round(semantic, 4) if semantic is not None else None,
                    "reasoning":    reasoning,
                })
            except Exception as e:
                errors += 1

    print(f"\nLoaded {len(results):,} candidates ({errors} errors). {time.time()-t0:.1f}s elapsed.")

    # ── 3. Sort + take top-N ────────────────────────────────────────────────
    results.sort(key=lambda x: (-x["final_score"], x["candidate_id"]))
    top = results[:TOP_N]

    print(f"Top {TOP_N}: scores {top[0]['final_score']:.2f} -> {top[-1]['final_score']:.2f}")

    # ── 4. Build output ─────────────────────────────────────────────────────
    output = {
        "jd": {
            "title":               JD["title"],
            "company":             JD["company"],
            "must_have_clusters":  list(JD["must_have_skill_clusters"].keys()),
            "experience_range":    f"{JD['min_experience_years']}–{JD['max_experience_years']} years",
        },
        "total_candidates": len(results),
        "generated_at":     "2026-06-28",
        "default_weights":  DEFAULT_WEIGHTS,
        "candidates":       top,
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, separators=(",", ":"))

    size_kb = OUTPUT_PATH.stat().st_size / 1024
    print(f"\nWrote {OUTPUT_PATH}  ({size_kb:.0f} KB)  in {time.time()-t0:.1f}s total.")
    print("Done! Deploy frontend to Firebase and the site will work without a backend.")

if __name__ == "__main__":
    main()
