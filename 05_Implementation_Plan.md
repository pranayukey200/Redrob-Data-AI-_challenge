# Implementation Plan
## Project: IntelliRank — AI-Powered Candidate Discovery & Ranking Engine
**Today:** June 27, 2026 | **Deadline:** July 2, 2026, 11:59 PM IST (~6 days)

---

## 0. Before Day 1 (do this first, blocks everything else)

- [ ] Pull the actual RedRob dataset and the PPT/deck template from the hackathon portal.
- [ ] Diff real dataset fields against the assumed schema in `04_Backend_Schema.md` — update `adapter.py`'s field mapping accordingly. This is the single highest-leverage 30 minutes of the whole project, since everything downstream depends on it.
- [ ] Confirm team size/roles so the day-by-day tasks below can be split or run solo.
- [ ] Set up repo skeleton (`/data`, `/pipeline`, `/api`, `/frontend`, `/output`, `README.md`), confirm GitHub repo is public.

---

## Day 1 — Jun 27 (today): Data + JD Understanding
- Load and explore the real dataset (`pandas.read_csv`/`read_json`); document field names, null rates, and any surprises directly in `README.md` under a "Dataset Notes" section.
- Build `adapter.py`: raw record → `CandidateProfile` (per Backend Schema doc).
- Build the JD parsing module (`/api/jd/parse`): LLM call with strict JSON schema + Pydantic validation + regex fallback.
- **Checkpoint**: can load N candidates into normalized form, and can parse a raw JD string into structured fields. No scoring yet.

## Day 2 — Jun 28: Semantic + Skill Matching
- Wire up `sentence-transformers` embedding generation for both JD `role_summary` and candidate `profile_summary`.
- Implement cosine similarity → `semantic_score`.
- Implement `skill_match_score` (structured overlap + per-skill embedding similarity for fuzzy matches like "GCP" ↔ "Google Cloud").
- **Checkpoint**: for one hand-picked JD, can produce a semantic + skill score per candidate and eyeball-sanity-check the top 10.

## Day 3 — Jun 29: Career + Behavioral Scoring, Fusion
- Implement `career_fit_score` (experience-range Gaussian falloff, tenure stability, domain overlap).
- Implement `behavioral_score` from whatever real activity fields exist post-adapter-update.
- Implement weighted fusion with configurable weights + graceful renormalization for missing signals.
- Implement `/api/rank` end-to-end.
- **Checkpoint**: full ranked list with all 4 sub-scores, for at least 2 different test JDs (ideally one senior, one junior/different domain, to stress-test that weighting actually changes outcomes meaningfully).

## Day 4 — Jun 30: Explanation Layer + Frontend Core
- Implement evidence-bullet generation (deterministic) + LLM polish pass with caching and the offline/template-only fallback.
- Frontend: JD input screen + ranked list screen (per UI/UX brief) wired to the live API.
- **Checkpoint**: can paste a JD in the UI, see a ranked, explained shortlist render.

## Day 5 — Jul 1: XLSX Export, Polish, Testing
- Implement `/api/export/xlsx` matching the required output spec exactly (re-check against the real template if you have it by now).
- Score breakdown panel/chart in the UI (Recharts).
- Dark-theme styling pass, loading-state sequence, basic accessibility check (contrast, keyboard nav).
- Write/clean the README: setup steps, architecture diagram (reuse the one from this conversation or regenerate), how to run end-to-end with one command.
- Smoke-test the full flow on a clean clone (pretend you're the judge).

## Day 6 — Jul 2 (deadline day): Deck + Final Submission
- Fill the official PPT template: problem framing, architecture diagram, the 4-signal scoring explanation, demo screenshots following the 5-step demo flow from the UI/UX brief, evaluation section (face-validity + latency benchmark), known limitations/future work.
- Export deck to PDF.
- Run the pipeline fresh on the full dataset, export the final ranked XLSX.
- Submit: GitHub repo URL (verify public access in an incognito window), PDF deck, ranked XLSX.
- Buffer: leave the last 2–3 hours before 11:59 PM IST genuinely free for last-minute fixes — don't schedule real work into that window.

---

## Judging-Criteria Self-Check (run this before submitting)

| Brief's ask | Where it's addressed |
|---|---|
| Deep Job Understanding | JD parsing module (Day 1), structured role profile, not keyword extraction |
| Contextual Relevance | Semantic embedding similarity, not exact keyword match (Day 2) |
| Signal Integration | 4-way weighted fusion across profile/career/behavioral (Day 3) |
| Lightning-fast | Latency benchmark in the deck (Day 5/6) |
| Highly accurate / expertly ranked | Explanation + evidence layer demonstrating *why*, plus the weighting ablation as proof signals matter (Day 4, demo flow step 4) |
| Output format compliance | XLSX spec matched exactly to template (Day 5) |
