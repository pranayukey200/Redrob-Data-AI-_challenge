# Backend Schema
## Project: IntelliRank — AI-Powered Candidate Discovery & Ranking Engine

> **Important caveat**: the exact field names below are an informed assumption based on the challenge brief's three named signal categories (profile attributes, career metadata, behavioral/activity signals). Once you pull the actual RedRob dataset, only `adapter.py` (Stage 2 in the TRD) and the field-mapping config below should need to change — the rest of the pipeline is written against the normalized schema, not the raw dataset.

---

## 1. Normalized Data Model (Pydantic / logical schema)

### `JobDescription`
| Field | Type | Notes |
|---|---|---|
| `jd_id` | string | hash of raw text, used as cache key |
| `raw_text` | string | original pasted JD |
| `must_have_skills` | string[] | from LLM parse |
| `nice_to_have_skills` | string[] | from LLM parse |
| `min_experience_years` | float | |
| `max_experience_years` | float \| null | |
| `seniority_level` | enum | entry / mid / senior / lead / exec |
| `domain` | string | e.g. fintech, healthcare |
| `education_requirements` | string[] | |
| `soft_skills` | string[] | |
| `role_summary` | string | normalized text used for embedding |
| `embedding` | float[] | cached vector |

### `CandidateProfile` (normalized, post-adapter)
| Field | Type | Notes |
|---|---|---|
| `candidate_id` | string | from dataset |
| `name_or_handle` | string | |
| `headline` | string | current title |
| `summary_text` | string | bio/about section if present |
| `skills` | string[] | parsed/normalized |
| `total_experience_years` | float | |
| `current_company` | string | |
| `education` | Education[] | |
| `profile_summary` | string | concatenated text used for embedding |
| `embedding` | float[] | cached vector |

### `CareerMetadata` (sub-object of CandidateProfile)
| Field | Type | Notes |
|---|---|---|
| `past_roles` | Role[] | `{title, company, industry, start_date, end_date}` |
| `avg_tenure_months` | float | derived |
| `promotions_count` | int | derived heuristically from title progression within same company |
| `industry_history` | string[] | derived from `past_roles.industry` |

### `BehavioralSignal` (sub-object of CandidateProfile)
| Field | Type | Notes |
|---|---|---|
| `platform_activity_score` | float | however the dataset expresses recent activity/engagement |
| `endorsements_or_recommendations_count` | int | |
| `profile_completeness_pct` | float | |
| `last_active_date` | date | |
| *(extend this object once real field names are known — this is the part of the schema most likely to need adjustment)* | | |

### `ScoreBreakdown` (output of ranking, one per candidate per JD run)
| Field | Type | Notes |
|---|---|---|
| `candidate_id` | string | |
| `jd_id` | string | |
| `semantic_score` | float (0–100) | |
| `skill_match_score` | float (0–100) | |
| `career_fit_score` | float (0–100) | |
| `behavioral_score` | float (0–100) \| null | null if signal unavailable for this candidate |
| `final_score` | float (0–100) | weighted fusion |
| `rank` | int | 1 = best fit |
| `evidence_bullets` | string[] | deterministic facts feeding the explanation |
| `explanation_text` | string | LLM-polished explanation |

### `RankingRun` (metadata for reproducibility)
| Field | Type | Notes |
|---|---|---|
| `run_id` | string | |
| `jd_id` | string | |
| `timestamp` | datetime | |
| `weights_used` | object | `{w_sem, w_skill, w_career, w_behavior}` |
| `embedding_model_version` | string | |
| `candidate_pool_size` | int | |

---

## 2. Persistence Options

For a PoC, two valid paths — pick based on remaining time:

**Option A — File-based (recommended given the timeline)**
- Candidate dataset loaded once, normalized, embeddings cached to a local `.parquet`/`.pkl` file.
- Ranking runs are computed on-demand in-memory, results returned directly to the API response and optionally written to `/output/run_<id>.xlsx`.
- Zero infra setup, fastest to ship, still fully demonstrates the architecture.

**Option B — SQLite (if you want a "real backend" talking point in the deck)**
```sql
CREATE TABLE job_descriptions (
  jd_id TEXT PRIMARY KEY,
  raw_text TEXT,
  must_have_skills TEXT,      -- JSON array as text
  nice_to_have_skills TEXT,
  min_experience_years REAL,
  max_experience_years REAL,
  seniority_level TEXT,
  domain TEXT,
  role_summary TEXT,
  embedding BLOB
);

CREATE TABLE candidates (
  candidate_id TEXT PRIMARY KEY,
  name_or_handle TEXT,
  headline TEXT,
  skills TEXT,                -- JSON array as text
  total_experience_years REAL,
  current_company TEXT,
  profile_summary TEXT,
  embedding BLOB
);

CREATE TABLE career_metadata (
  candidate_id TEXT PRIMARY KEY REFERENCES candidates(candidate_id),
  past_roles TEXT,            -- JSON array as text
  avg_tenure_months REAL,
  promotions_count INTEGER,
  industry_history TEXT
);

CREATE TABLE behavioral_signals (
  candidate_id TEXT PRIMARY KEY REFERENCES candidates(candidate_id),
  platform_activity_score REAL,
  endorsements_count INTEGER,
  profile_completeness_pct REAL,
  last_active_date TEXT
);

CREATE TABLE ranking_runs (
  run_id TEXT PRIMARY KEY,
  jd_id TEXT REFERENCES job_descriptions(jd_id),
  timestamp TEXT,
  weights_used TEXT,          -- JSON
  embedding_model_version TEXT,
  candidate_pool_size INTEGER
);

CREATE TABLE score_breakdowns (
  run_id TEXT REFERENCES ranking_runs(run_id),
  candidate_id TEXT REFERENCES candidates(candidate_id),
  semantic_score REAL,
  skill_match_score REAL,
  career_fit_score REAL,
  behavioral_score REAL,
  final_score REAL,
  rank INTEGER,
  evidence_bullets TEXT,       -- JSON
  explanation_text TEXT,
  PRIMARY KEY (run_id, candidate_id)
);
```
This upgrades cleanly from Option A — same logical model, just persisted. Recommend starting with Option A and only moving to B if there's slack time after the ranking engine and UI are solid.

---

## 3. Output File Spec (XLSX deliverable)

One sheet, one row per ranked candidate, columns:

| rank | candidate_id | name | final_score | semantic_score | skill_match_score | career_fit_score | behavioral_score | top_matched_skills | explanation |
|---|---|---|---|---|---|---|---|---|---|

Sorted ascending by `rank`. Keep column names exactly matching whatever the official submission template specifies, once you have it — this is a strict deliverable, worth double-checking against the actual template rather than assuming.
