# IntelliRank — AI-Powered Candidate Discovery & Ranking

Redrob "Data & AI Challenge: Intelligent Candidate Discovery" hackathon submission.

## What it does

Ranks 100,000 candidates against a Senior AI Engineer job description using four signals:

| Signal | Weight | What it measures |
|--------|--------|-----------------|
| **Skill Match** | 35% | Coverage of must-have skill clusters (embeddings, vector DB, Python, ranking eval, NLP/IR) with proficiency/duration/endorsement weighting |
| **Career Fit** | 30% | Experience years (Gaussian around 7yr ideal), title relevance, India location, product vs consulting background, production deployment signals |
| **Behavioral** | 15% | Platform availability (open_to_work, recency, notice period), responsiveness, reliability, GitHub/engagement |
| **Semantic** | 20% | TF-IDF cosine similarity between JD query and candidate profile text (bigrams, sublinear TF) |

Missing signals are renormalized out of the weighted average — never zeroed.

## Quick Start

### 1. Install dependencies

```bash
pip install -r requirements.txt
```

### 2. Copy dataset

```bash
# Copy from the original dataset location:
cp "[PUB] India_runs_data_and_ai_challenge/India_runs_data_and_ai_challenge/candidates.jsonl" \
   data/raw/candidates.jsonl
```

### 3. Precompute TF-IDF index (~3-5 min, run once)

```bash
python precompute.py --candidates ./data/raw/candidates.jsonl
```

Saves to `./cache/` (~50 MB). Skip this and pass `--no-semantic` to `rank.py` if you want rule-only scoring.

### 4. Generate submission CSV (< 3 min)

```bash
python rank.py --candidates ./data/raw/candidates.jsonl --out ./output/submission.csv
```

### 5. Validate submission

```bash
python validate_submission.py ./output/submission.csv
```

### 6. Run the web app (optional)

```bash
# Terminal 1 — Backend
uvicorn api.main:app --port 8000 --reload

# Terminal 2 — Frontend
cd frontend && npm install && npm run dev
# Open http://localhost:5173
```

## Architecture

```
candidates.jsonl (100K)
        │
        ▼
   adapter.py          ← raw record → CandidateProfile (field mapping)
        │
   scorer.py           ← 4 sub-scores (0–100 each)
   ├── skill_match_score()    TF-IDF query + proficiency/duration weighting
   ├── career_fit_score()     Gaussian exp falloff + title/location/company heuristics
   ├── behavioral_score()     Availability + responsiveness + reliability + engagement
   └── fuse_scores()          Weighted average with missing-signal renormalization
        │
   rank.py             ← CLI: loads JSONL, scores all, sorts, writes top-100 CSV
        │
   output/submission.csv
```

For the web app, `api/main.py` (FastAPI) serves the same pipeline via REST. `frontend/` is a Vite/React/TypeScript/Tailwind app with dark theme, weight preset selector, score breakdown radar chart, and XLSX/CSV export.

## Semantic Engine (offline)

`all-MiniLM-L6-v2` (sentence-transformers) is listed in requirements but requires network access to download. If unavailable, `precompute.py` builds a **TF-IDF** index instead:

- `TfidfVectorizer(max_features=50K, ngram_range=(1,2), sublinear_tf=True)`
- Bigrams capture "vector search", "sentence transformers", "information retrieval"
- JD query is a 150-word concatenation of must-have skills and role context
- Cosine similarity (0–1) scaled to 0–100 for fusion

TF-IDF cosine similarity for text retrieval is a well-established method (BM25/TF-IDF are still competitive with dense retrieval for in-domain keyword matching tasks).

## Dataset Notes

See `docs/00_DATASET_NOTES.md` for:
- Real field names vs. assumed schema
- What the 23 behavioral signals map to
- Honeypot detection approach
- Key design decisions (output is CSV not XLSX, single JD, offline ranking constraint)

## Judging Criteria Self-Check

| Ask | Implementation |
|-----|---------------|
| Deep Job Understanding | JD parsed into 5 must-have skill clusters + experience range + location + disqualifiers |
| Contextual Relevance | TF-IDF semantic similarity on bigram profile text, not keyword counting |
| Signal Integration | 4-way weighted fusion with renormalization; weights tunable via UI presets |
| Lightning-fast | 34 seconds for 100K candidates on CPU (0.6s TF-IDF + 33s JSONL streaming + scoring) |
| Highly accurate | Top 10 are ML Engineers/NLP Engineers/Search Engineers/Rec-sys Engineers in India |
| Output compliance | CSV with `candidate_id, rank, score, reasoning` — validated with `validate_submission.py` |

## Known Limitations

- **TF-IDF semantic** is less nuanced than dense neural embeddings (sentence-transformers); would improve with MiniLM-L6-v2 if network access is available
- **Honeypot detection** relies on natural signal degradation (0-month expert skills score low, impossible dates hurt career fit) rather than explicit checks
- **JD is hardcoded** — the system is built around one JD, not a general-purpose multi-JD ranker (appropriate given the challenge has one JD)

## Compute Environment

- Python 3.11+, CPU-only
- Runtime: ~3 min total (precompute once + ~35s ranking)
- RAM peak: ~4 GB (TF-IDF matrix + 100K candidate records)
- No GPU required, no network required during ranking
