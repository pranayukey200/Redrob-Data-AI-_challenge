# UI/UX Brief
## Project: IntelliRank — AI-Powered Candidate Discovery & Ranking Engine

---

## 1. Design Principles

1. **Trust through transparency** — every score on screen must be one click away from its breakdown. No bare numbers.
2. **Recruiter-speed** — the core loop (paste JD → see shortlist) should take 2 actions, not a multi-step wizard.
3. **Cinematic but legible** — dark, technical aesthetic consistent with your prior builds (ElectED, Carbon Footprint Platform, GitHub profile), but information density must win over flourish — this is a tool a recruiter trusts, not a landing page.

**Visual language** (consistent with your established palette):
- Background: `#0d1117` (near-black navy)
- Primary accent: `#7c3aed` (violet)
- Secondary accent: `#a78bfa` (light violet, for hover/active states)
- Success/high-score: a controlled green (`#22c55e`) used sparingly — only for score badges, not decoratively
- Typography: monospace or technical sans for data/scores (e.g. JetBrains Mono for numbers), clean sans for prose (explanations)
- Motion: Framer Motion for list entry/stagger on ranked results, subtle — score bars animate in, not bounce

---

## 2. Core Screens

### Screen 1 — JD Input
- Large textarea for pasting raw JD text (primary path).
- Optional: dropdown to pick a pre-loaded sample JD (useful for the demo video/judge run).
- A weight-preset selector: `Balanced | Senior Hire | High-Activity/IC | Custom` — Custom reveals 4 sliders (Semantic / Skill / Career / Behavioral) that must sum to 100%, with live-updating percentage labels.
- Primary CTA: **"Find Best-Fit Candidates"** — triggers `/api/jd/parse` then `/api/rank`.
- While processing: a short staged loading sequence ("Reading job description…" → "Scoring candidate pool…" → "Ranking…") rather than a generic spinner — cheap win for the "cinematic" feel, and doubles as implicit explainability (the user sees the *stages* the system goes through).

### Screen 2 — Ranked Shortlist (primary results view)
- Left: scrollable ranked list of candidate cards. Each card shows:
  - Rank number + final score (large, badge-styled, color-coded by score band)
  - Name/ID, current title, years of experience
  - Top 3 matched skills as chips
  - One-line explanation snippet (truncated, expandable)
- Right (on card click) or modal: **Score Breakdown Panel**
  - Horizontal bar or radial chart (4 segments: Semantic / Skill / Career / Behavioral) — Recharts, matches your existing stack
  - Full explanation paragraph
  - "Evidence" bullet list (the deterministic facts the explanation was built from — gives a recruiter something concrete to defend the rank with)
- Top of list: a sticky bar showing JD summary (parsed must-haves as chips) so the recruiter can sanity-check what the system *understood* before trusting the ranking.
- Export button: **"Export Ranked List (.xlsx)"** — calls `/api/export/xlsx`, triggers download.

### Screen 3 — (Optional, time-permitting) Weight Tuning / Comparison View
- Side-by-side: re-run the same JD with two different weight presets, diff the top-5 to visually demonstrate that signal integration changes outcomes (this is also useful as a deck slide screenshot).

---

## 3. Empty / Edge States

- No JD entered → CTA disabled with a one-line hint, not a blocking error.
- Candidate with missing behavioral/career data → score breakdown panel shows that segment as "Not available" (greyed, not zeroed) rather than silently scoring it low — reinforces the "graceful degradation" design decision from the TRD.
- Dataset load failure → explicit error state with the actual exception surfaced (judges/devs debugging > friendly-but-vague messaging, in this context).

---

## 4. Accessibility Notes (cheap wins worth doing even under time pressure)

- Color is never the *only* signal for score bands — pair with text labels ("Strong fit", "Possible fit").
- Sufficient contrast on the dark theme for body text (test `#a78bfa` on `#0d1117` — verify AA contrast for small text, increase weight if needed for explanation paragraphs specifically since that's the highest-reading-load text on screen).
- All interactive elements (sliders, cards, export button) keyboard-navigable.

---

## 5. Demo Flow (for the deck/video, and for a judge running it live)

1. Land on JD input, paste/select a sample JD.
2. Hit "Find Best-Fit Candidates" — watch the staged loading sequence.
3. Land on ranked list — top card highlighted, click into score breakdown.
4. Show one candidate with a *lower* score and a *higher* skill-match-only score, to visually prove the system isn't just keyword matching (key story beat for "Contextual Relevance").
5. Export XLSX, show the file briefly.

This 5-step flow should be the backbone of both the live demo and the deck's "how it works" section — build the UI with this exact flow in mind so build effort and demo narrative stay aligned.
