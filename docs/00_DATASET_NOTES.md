# Dataset Notes — IntelliRank

Generated: 2026-06-27. Dataset path: `[PUB] India_runs_data_and_ai_challenge/India_runs_data_and_ai_challenge/`

---

## Files

| File | Size | Description |
|------|------|-------------|
| `candidates.jsonl` | 487 MB | 100,000 candidate records, one JSON per line |
| `candidate_schema.json` | 10 KB | JSON Schema (draft-07) for candidate records |
| `job_description.docx` | 40 KB | Single JD: Senior AI Engineer — Redrob AI, Pune/Noida |
| `sample_candidates.json` | 300 KB | 50 sample candidates (same schema) |
| `sample_submission.csv` | 9 KB | Format reference only — NOT a quality baseline |
| `submission_spec.docx` | — | Detailed submission rules |
| `redrob_signals_doc.docx` | 37 KB | Documentation for the 23 behavioral signals |
| `submission_metadata_template.yaml` | 5 KB | Template for `submission_metadata.yaml` |
| `validate_submission.py` | 5 KB | Official CSV validator |
| `README.docx` | 10 KB | Hackathon README |

---

## Candidate Record Schema (actual field names)

```json
{
  "candidate_id": "CAND_XXXXXXX",   // 7-digit, e.g. CAND_0000001
  "profile": {
    "anonymized_name", "headline", "summary", "location", "country",
    "years_of_experience", "current_title", "current_company",
    "current_company_size", "current_industry"
  },
  "career_history": [{
    "company", "title", "start_date", "end_date", "duration_months",
    "is_current", "industry", "company_size", "description"
  }],
  "education": [{"institution", "degree", "field_of_study", "start_year", "end_year", "grade", "tier"}],
  "skills": [{"name", "proficiency", "endorsements", "duration_months"}],
  "certifications": [{"name", "issuer", "year"}],  // 24.5% of candidates have these
  "languages": [{"language", "proficiency"}],       // 100% have languages
  "redrob_signals": { /* 23 behavioral signals — see below */ }
}
```

---

## Mapping to 04_Backend_Schema.md Normalized Model

| Schema field | Real dataset field | Notes |
|---|---|---|
| `candidate_id` | `candidate_id` | Exact match |
| `name_or_handle` | `profile.anonymized_name` | Anonymized in dataset |
| `headline` | `profile.headline` | Exact match |
| `summary_text` | `profile.summary` | Was called `bio` in schema assumption |
| `skills` | `skills[*].name` | Array of skill objects with proficiency/endorsements/duration_months |
| `total_experience_years` | `profile.years_of_experience` | Exact match |
| `current_company` | `profile.current_company` | Exact match |
| `education` | `education` | Exact match |
| `past_roles` | `career_history` | Field names differ: `description` not `summary` |
| `avg_tenure_months` | Derived from `career_history[*].duration_months` | |
| `platform_activity_score` | Composite of `redrob_signals` fields | See behavioral section |
| `endorsements_or_recommendations_count` | `redrob_signals.endorsements_received` | |
| `profile_completeness_pct` | `redrob_signals.profile_completeness_score` (0-100) | |
| `last_active_date` | `redrob_signals.last_active_date` | |

---

## Dataset Statistics (5,000 candidate sample)

- **Total candidates**: 100,000
- **Experience years**: min=1.0, median=6.8, max=15.0
- **Skills per candidate**: min=5, avg=9.6, max=23
- **Career history entries**: min=1, avg=3.0, max=9
- **India-based**: 75.1%
- **Open to work**: 36.7%
- **Has GitHub score**: 34.2%
- **Verified email**: 72.6%

**Top countries**: India (75.1%), USA (9.8%), Australia (2.7%), Singapore (2.7%), Canada (2.6%)

**Top titles** (very diverse, mostly non-AI):
- HR Manager, Sales Executive, Mechanical Engineer, Business Analyst, Accountant (each ~3%)
- ML Engineer, AI Specialist, Data Scientist (~0.2% each)

**Top industries**: IT Services (28.8%), Software (23.3%), Manufacturing (22%), Paper Products (7.8%)

---

## The Job Description (summary)

**Role**: Senior AI Engineer — Founding Team at Redrob AI  
**Location**: Pune/Noida (hybrid) | Open to Tier-1 Indian city candidates  
**Experience**: 5–9 years (soft range, 6–8 years ideal)

**Must-have skills**:
1. Production embeddings-based retrieval (sentence-transformers, BGE, E5, etc.)
2. Vector databases (FAISS, Pinecone, Weaviate, Qdrant, Milvus, Elasticsearch, OpenSearch)
3. Strong Python
4. Ranking evaluation frameworks (NDCG, MRR, MAP, A/B testing)
5. NLP / Information Retrieval background

**Nice-to-have**: LLM fine-tuning (LoRA, QLoRA, PEFT), learning-to-rank, RAG systems, distributed systems, open-source contributions

**Explicit disqualifiers** (noted in JD, used in scoring):
- Pure research / academic roles without production deployment
- Only consulting firm experience (TCS, Infosys, Wipro, Accenture, Cognizant, Capgemini)
- Primary expertise in computer vision / speech / robotics (not NLP/IR)
- No production code in 18+ months
- LangChain-only "AI experience" (< 12 months)

**Behavioral priority**: Active platform presence, short notice period (< 30 days ideal), responsive to recruiters

---

## Behavioral Signals (redrob_signals) — All 23 fields present

All candidates have all 23 behavioral signals. Key fields used in scoring:

| Signal | Range | Used in scoring |
|--------|-------|-----------------|
| `profile_completeness_score` | 0–100 | Yes — profile quality |
| `last_active_date` | date | Yes — recency decay |
| `open_to_work_flag` | bool | Yes — availability |
| `recruiter_response_rate` | 0–1 | Yes — responsiveness |
| `avg_response_time_hours` | ≥0 | Yes — responsiveness |
| `interview_completion_rate` | 0–1 | Yes — reliability |
| `offer_acceptance_rate` | -1 to 1 | Yes — reliability |
| `notice_period_days` | 0–180 | Yes — availability modifier |
| `github_activity_score` | -1 to 100 | Yes (-1 = no GitHub) |
| `skill_assessment_scores` | dict str→0-100 | Yes — skill verification |
| `applications_submitted_30d` | ≥0 | Yes — engagement |
| `verified_email` + `verified_phone` | bool | Yes — profile trust |
| `saved_by_recruiters_30d` | ≥0 | Yes — market demand |

---

## Schema Divergence from 04_Backend_Schema.md Assumptions

| Assumption | Reality | Impact |
|---|---|---|
| Output is XLSX | Output is **CSV** with `candidate_id, rank, score, reasoning` | Changed exporter entirely |
| Multiple JDs | **Single JD** in dataset | JD is hardcoded; no `/api/jd/parse` needed for submission |
| `bio` field | `profile.summary` | adapter.py updated |
| Separate career metadata | Embedded as `career_history` array | adapter.py flattens it |
| Behavioral signals = unknown | 23 well-documented signals | All 23 mapped explicitly |
| XLSX deliverable | **CSV deliverable** (top 100 rows) | Submission format corrected |

---

## Honeypots (~80 in dataset)

Per submission spec: ~80 candidates have deliberately impossible profiles:
- 8 years experience at a company founded 3 years ago
- "expert" proficiency in 10 skills with 0 duration_months

These are forced to relevance tier 0 in ground truth. Our scoring naturally penalizes them:
- Career history date inconsistencies → detected by duration checks
- Expert skills with 0 months → duration_months weighted in skill scoring

---

## Key Design Decisions (not in original docs)

1. **Submission is CSV, not XLSX** — the output spec in 04_Backend_Schema.md was wrong about format
2. **Single JD** — the entire hackathon has one JD, so JD parsing is pre-computed once, not a runtime feature
3. **No network during ranking** — submission_spec.docx mandates 5-min CPU-only ranking; LLM is only used in precompute phase
4. **`rank.py` is the primary deliverable** — must run: `python rank.py --candidates ./candidates.jsonl --out ./submission.csv`
5. **Pre-computation**: embeddings generated offline via `precompute.py`, cached to `./cache/`
