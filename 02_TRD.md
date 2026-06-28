# Technical Requirements Document (TRD)
## Project: IntelliRank — AI-Powered Candidate Discovery & Ranking Engine

---

## 1. System Overview

A pipeline + lightweight web app with four logical stages:

```
JD (raw text) ──► [1] JD Understanding ──► Structured Role Profile
                                                    │
Candidate Dataset ──► [2] Profile Normalization ──► Structured Candidate Records
                                                    │
                              [3] Multi-Signal Scoring Engine
                                  ├─ Semantic Score (embeddings + cosine sim)
                                  ├─ Career Fit Score (rule-weighted)
                                  ├─ Behavioral Score (rule-weighted)
                                  └─ Skill Match Score (structured overlap + semantic)
                                                    │
                                          Weighted Fusion → Final Score → Rank
                                                    │
                              [4] Explanation Generation (templated + LLM polish)
                                                    │
                                          UI display + XLSX export
```

(A rendered version of this is shown in the chat as an inline diagram.)

---

## 2. Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Language | Python 3.11 (pipeline/ML) + TypeScript (frontend) | Standard for ML tooling; matches your existing React/TS stack from prior projects |
| Backend API | FastAPI | Fast to scaffold, async-friendly, auto OpenAPI docs (nice for a judge to poke at) |
| Frontend | React + Vite + TypeScript, Tailwind | Consistent with ElectED / Carbon Footprint Platform stack already in your muscle memory |
| Embeddings | `sentence-transformers` (e.g. `all-MiniLM-L6-v2` or `bge-base-en-v1.5`) — local, free, fast | No API quota risk (Gemini free-tier quota has bitten you before); deterministic; good enough quality for semantic similarity at this scale |
| JD parsing / explanation generation | LLM API (Claude or Gemini) — used sparingly, with disk caching | Needed for nuanced JD understanding + natural-language explanations; NOT used for the core numeric score (keep that deterministic) |
| Vector similarity | In-memory cosine similarity via NumPy (dataset size doesn't justify FAISS/a vector DB for a PoC) | Simpler, fewer moving parts, faster to ship; mention FAISS as a "scales to" note in the deck |
| Storage | SQLite (or just structured JSON/Parquet for the PoC pipeline) | No infra overhead; trivially upgrades to Postgres (see Backend Schema doc) |
| Output | `openpyxl` / `pandas.to_excel` | Required XLSX deliverable |

---

## 3. Stage Detail

### Stage 1 — JD Understanding
- Input: raw JD text.
- Process: single LLM call with a strict JSON-schema-constrained prompt, extracting:
  - `must_have_skills: string[]`
  - `nice_to_have_skills: string[]`
  - `min_experience_years: number`
  - `max_experience_years: number | null`
  - `seniority_level: enum [entry, mid, senior, lead, exec]`
  - `domain: string` (e.g. fintech, healthcare, e-commerce)
  - `education_requirements: string[]`
  - `soft_skills: string[]`
  - `role_summary: string` (a 2–3 sentence normalized summary used for embedding)
- Output is cached keyed by a hash of the JD text, so re-runs during dev don't burn API quota.
- **Fallback**: if the LLM call fails/quota-exhausted, fall back to a regex/keyword-based extraction for must-have skills so the pipeline never hard-fails.

### Stage 2 — Candidate Profile Normalization
- Input: dataset record per candidate (exact fields TBD against real dataset — see "Dataset Adapter" below).
- Process: map raw fields into the same structured shape used by Stage 1 (skills list, experience years, education, etc.), and construct a `profile_summary` text blob used for embedding — concatenation of title, skills, role history, summary.
- **Dataset Adapter pattern**: a single `adapter.py` module with one function `normalize(raw_record) -> CandidateProfile`. If the real dataset's field names differ from our assumption, only this file changes — nothing downstream does.

### Stage 3 — Multi-Signal Scoring Engine
Four sub-scores, each normalized to 0–100, then combined:

1. **Semantic Score** — cosine similarity between JD `role_summary` embedding and candidate `profile_summary` embedding.
2. **Skill Match Score** — structured overlap: weighted Jaccard/coverage of `must_have_skills` (high weight) and `nice_to_have_skills` (lower weight) against candidate's parsed skill list, with fuzzy/synonym matching (e.g. via embedding similarity per-skill, not exact string match) so "GCP" matches "Google Cloud".
3. **Career Fit Score** — rule-based:
   - experience-years match (Gaussian falloff around the JD's min/max range, not a hard cutoff)
   - seniority/title progression match
   - domain/industry overlap between past employers and JD domain
   - tenure stability (avg. time per role — flags excessive job-hopping or, conversely, stagnation, depending on role level)
4. **Behavioral Score** — rule-based, computed from whatever activity signals exist in the dataset (e.g. platform activity recency, engagement/endorsement counts, profile completeness). This is intentionally the most dataset-dependent score and the adapter must clearly document which raw fields feed it.

**Fusion**:
```
final_score = w_sem * semantic_score
            + w_skill * skill_match_score
            + w_career * career_fit_score
            + w_behavior * behavioral_score
```
Default weights (tunable via config, see below): `w_sem=0.30, w_skill=0.30, w_career=0.25, w_behavior=0.15`.
Weights are exposed in the UI as sliders/presets (e.g. a "Senior Hire" preset boosts `w_career`, a "High-Growth/IC" preset boosts `w_behavior`).

**Missing-data handling**: if a signal can't be computed for a candidate (missing field), that sub-score is excluded from the weighted average and the remaining weights are renormalized — never silently treated as zero (which would unfairly penalize candidates with sparse data).

### Stage 4 — Explanation Generation
- Template-first: build a deterministic bullet list of *evidence* (e.g. "8 yrs experience vs. JD's 5–8 yr ask", "5/6 must-have skills matched: Python, AWS, Docker, Kubernetes, Terraform", "Career trajectory: 3 promotions in 6 years at fintech companies").
- LLM polish pass (optional, cached): turn the evidence bullets into 1–2 fluent sentences. The LLM is explicitly instructed to only rephrase given evidence, never introduce new claims — this caps hallucination risk.

---

## 4. API Design (FastAPI)

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/jd/parse` | POST | Parse raw JD text → structured role profile |
| `/api/candidates/load` | POST | Trigger dataset load + normalization + embedding pre-computation (cached) |
| `/api/rank` | POST | Body: `{ jd_id, weights?, top_k? }` → ranked list with score breakdown + explanation |
| `/api/export/xlsx` | GET | Stream the last ranking run as a formatted `.xlsx` |
| `/api/health` | GET | Liveness check (for the judge running it locally) |

---

## 5. Evaluation Plan (for the deck — "how we know it works")

Since there's likely no labeled ground truth, validate via:
1. **Face validity tests**: hand-craft 3 JDs spanning different seniority/domains, manually inspect top-5 for each, document reasoning in the deck.
2. **Ablation note**: show what changes in the ranking when behavioral/career weights are zeroed out vs. included — demonstrates the signal integration is actually doing something, not decorative.
3. **Latency benchmark**: report actual wall-clock time for a full ranking run on the provided dataset size, screenshot it in the deck.

---

## 6. Known Technical Risks

- **Embedding model choice for nuance**: MiniLM is fast but lower-fidelity than e.g. `bge-large` or an OpenAI/Gemini embedding API. If time allows, A/B the local model vs. an API embedding model on the 3 test JDs and report which gave better face-validity in the deck — gives you a credible "we considered tradeoffs" talking point.
- **LLM JSON parsing reliability**: enforce structured output (JSON mode / strict schema) and validate with Pydantic; retry once on parse failure before falling back to regex extraction.
- **Quota exhaustion** (recurring issue in your past sessions): keep the LLM-dependent stages (JD parsing, explanation polish) behind a cache and a `--offline` flag that uses template-only explanations, so a demo never breaks live in front of a judge due to quota.
