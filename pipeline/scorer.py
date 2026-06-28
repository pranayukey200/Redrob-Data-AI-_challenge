"""
scorer.py — Multi-signal scoring engine for IntelliRank.

Each sub-score returns 0-100. Missing signals are excluded from fusion
and remaining weights are renormalized (never silently zero).

Scoring for the Senior AI Engineer JD at Redrob AI.
"""

from __future__ import annotations
import math
import re
from typing import Any

from .jd_config import JD


# ---------------------------------------------------------------------------
# Consulting firms (penalized if entire career is at these)
# ---------------------------------------------------------------------------
CONSULTING_FIRMS = set(JD["consulting_firms"])

# Tier-1 Indian locations
TIER1_LOCATIONS = set(JD["preferred_locations"]["tier1"])


# ---------------------------------------------------------------------------
# 1. Skill Match Score (0-100)
# ---------------------------------------------------------------------------

def skill_match_score(candidate: dict[str, Any]) -> float:
    skill_names = candidate.get("skill_names", [])     # lowercase list
    skills_raw = candidate.get("skills_raw", [])       # full objects
    career_text = _career_text(candidate).lower()
    summary_text = (candidate.get("summary", "") + " " + candidate.get("headline", "")).lower()
    all_text = " ".join(skill_names) + " " + career_text + " " + summary_text

    # Skill object lookup for proficiency/duration weighting
    skill_lookup: dict[str, dict] = {s["name"].lower(): s for s in skills_raw}

    must_have_clusters = JD["must_have_skill_clusters"]
    nice_to_have = JD["nice_to_have_skills"]
    wrong_domain = JD["wrong_domain_skills"]

    # --- Must-have cluster scoring ---
    cluster_scores = {}
    for cluster_name, keywords in must_have_clusters.items():
        # Match against skills list + career text + summary
        matched_skill_score = 0.0
        matched_in_text = False

        for kw in keywords:
            kw_lower = kw.lower()
            # Direct skill match (higher weight)
            if kw_lower in skill_lookup:
                s = skill_lookup[kw_lower]
                prof_mult = _proficiency_mult(s.get("proficiency", "intermediate"))
                dur_mult = _duration_mult(s.get("duration_months", 0))
                end_mult = _endorsement_mult(s.get("endorsements", 0))
                skill_score = prof_mult * 0.5 + dur_mult * 0.3 + end_mult * 0.2
                matched_skill_score = max(matched_skill_score, skill_score)
            # Partial match in skill name
            elif any(kw_lower in sn for sn in skill_names):
                matched_skill_score = max(matched_skill_score, 0.6)
            # Mention in career text / summary
            if kw_lower in career_text or kw_lower in summary_text:
                matched_in_text = True

        # Combine: direct skill match is worth more than text mention
        if matched_skill_score > 0:
            score = matched_skill_score
        elif matched_in_text:
            score = 0.4  # mentioned in context but not explicit skill
        else:
            score = 0.0

        cluster_scores[cluster_name] = score

    # Cluster weights (embeddings_retrieval and nlp_ir most important)
    cluster_weights = {
        "embeddings_retrieval": 0.30,
        "vector_db": 0.20,
        "python": 0.15,
        "ranking_evaluation": 0.20,
        "nlp_ir": 0.15,
    }
    must_have_raw = sum(cluster_weights[k] * cluster_scores.get(k, 0) for k in cluster_weights)

    # --- Nice-to-have scoring ---
    nice_matches = sum(1 for kw in nice_to_have if kw.lower() in all_text)
    nice_score = min(1.0, nice_matches / 5.0)  # saturates at 5 matches

    # --- Wrong-domain penalty ---
    wrong_domain_count = sum(1 for kw in wrong_domain if kw.lower() in all_text)
    # Penalty: -10 per wrong-domain keyword, capped at -30
    wrong_penalty = min(0.3, wrong_domain_count * 0.10)

    # --- Skill assessment bonus (Redrob platform assessments) ---
    assessment_scores = candidate.get("skill_assessment_scores", {})
    relevant_assessments = [
        v for k, v in assessment_scores.items()
        if any(kw in k.lower() for kw in ["nlp", "ml", "ai", "python", "search", "retrieval", "embedding"])
    ]
    assessment_bonus = (sum(relevant_assessments) / len(relevant_assessments) / 100.0 * 0.05) if relevant_assessments else 0.0

    # Combine
    raw = must_have_raw * 0.80 + nice_score * 0.15 + assessment_bonus
    raw = max(0.0, raw - wrong_penalty)

    return round(min(100.0, raw * 100), 2)


# ---------------------------------------------------------------------------
# 2. Career Fit Score (0-100)
# ---------------------------------------------------------------------------

def career_fit_score(candidate: dict[str, Any]) -> float:
    years_exp = candidate.get("years_experience", 0)
    current_title = candidate.get("current_title", "").lower()
    career = candidate.get("career_history", [])
    country = candidate.get("country", "").lower()
    location = (candidate.get("location", "") + " " + country).lower()
    current_industry = candidate.get("current_industry", "").lower()
    avg_tenure = candidate.get("avg_tenure_months", 0)
    current_company = candidate.get("current_company", "").lower()

    # --- Experience years score (Gaussian around ideal=7, band 5-9) ---
    exp_score = _exp_years_score(years_exp, ideal=7.0, soft_min=5.0, soft_max=9.0)

    # --- Title relevance score ---
    title_score = _title_relevance_score(current_title, career)

    # --- Location score ---
    loc_score = _location_score(location, country)

    # --- Company type score (penalize all-consulting backgrounds) ---
    company_score = _company_type_score(career, current_company)

    # --- Production deployment signal (heuristic from career descriptions) ---
    prod_score = _production_signal_score(career)

    # --- Tenure stability (prefer avg tenure 12-48 months) ---
    tenure_score = _tenure_score(avg_tenure)

    # --- Industry overlap ---
    industry_score = _industry_score(current_industry, career)

    # Weighted combination
    career_raw = (
        exp_score * 0.20
        + title_score * 0.30
        + loc_score * 0.15
        + company_score * 0.15
        + prod_score * 0.10
        + tenure_score * 0.05
        + industry_score * 0.05
    )

    return round(min(100.0, career_raw * 100), 2)


# ---------------------------------------------------------------------------
# 3. Behavioral Score (0-100)
# ---------------------------------------------------------------------------

def behavioral_score(candidate: dict[str, Any]) -> float:
    # --- Availability sub-score ---
    open_flag = 1.0 if candidate.get("open_to_work") else 0.3
    recency = _recency_score(candidate.get("days_since_active", 999))
    notice = _notice_score(candidate.get("notice_period_days", 90))
    apps = min(1.0, candidate.get("applications_30d", 0) / 5.0)

    availability = open_flag * 0.35 + recency * 0.35 + notice * 0.20 + apps * 0.10

    # --- Responsiveness sub-score ---
    response_rate = candidate.get("recruiter_response_rate", 0)
    resp_time = candidate.get("avg_response_time_hours", 999)
    resp_time_score = max(0.0, 1.0 - (resp_time / 240.0))  # 0 hrs = 1.0, 240 hrs = 0.0

    responsiveness = response_rate * 0.60 + resp_time_score * 0.40

    # --- Reliability sub-score ---
    completion = candidate.get("interview_completion_rate", 0)
    offer_acc = candidate.get("offer_acceptance_rate", -1)
    offer_score = offer_acc if offer_acc >= 0 else 0.5  # treat no-history as neutral
    verified = (0.5 if candidate.get("verified_email") else 0) + (0.5 if candidate.get("verified_phone") else 0)

    reliability = completion * 0.45 + offer_score * 0.30 + verified * 0.25

    # --- Engagement sub-score ---
    github = candidate.get("github_score", -1)
    github_score = (github / 100.0) if github >= 0 else 0.3  # no GitHub = neutral
    completeness = candidate.get("profile_completeness", 0) / 100.0
    saved = min(1.0, candidate.get("saved_by_recruiters_30d", 0) / 5.0)
    connections = min(1.0, candidate.get("connection_count", 0) / 300.0)

    engagement = github_score * 0.35 + completeness * 0.30 + saved * 0.20 + connections * 0.15

    # Combine sub-scores
    raw = (
        availability * 0.35
        + responsiveness * 0.25
        + reliability * 0.25
        + engagement * 0.15
    )

    return round(min(100.0, raw * 100), 2)


# ---------------------------------------------------------------------------
# 4. Semantic Score (0-100) — computed from embeddings in rank.py
#    This module provides a stub; rank.py fills this in.
# ---------------------------------------------------------------------------

def semantic_score_from_cosine(cosine_sim: float) -> float:
    """Map cosine similarity [-1, 1] to 0-100."""
    return round(max(0.0, min(100.0, (cosine_sim + 1) / 2 * 100)), 2)


# ---------------------------------------------------------------------------
# 5. Fusion
# ---------------------------------------------------------------------------

def fuse_scores(
    semantic: float | None,
    skill: float | None,
    career: float | None,
    behavioral: float | None,
    weights: dict | None = None,
) -> tuple[float, dict]:
    """
    Weighted fusion with missing-signal renormalization.
    Returns (final_score_0_to_100, weights_used_dict).
    """
    if weights is None:
        weights = JD["weights"]

    signals = {
        "semantic": (semantic, weights["semantic"]),
        "skill": (skill, weights["skill"]),
        "career": (career, weights["career"]),
        "behavioral": (behavioral, weights["behavioral"]),
    }

    available = {k: (v, w) for k, (v, w) in signals.items() if v is not None}
    if not available:
        return 0.0, {}

    # Renormalize weights for available signals
    total_w = sum(w for _, w in available.values())
    final = sum((v * w / total_w) for v, w in available.values())
    effective_weights = {k: w / total_w for k, (_, w) in available.items()}

    return round(final, 4), effective_weights


# ---------------------------------------------------------------------------
# 6. Evidence bullets (deterministic, for reasoning column)
# ---------------------------------------------------------------------------
# Honeypot detection
# ---------------------------------------------------------------------------

# Specific JD skill keywords for reasoning extraction
_JD_SKILL_DISPLAY: list[tuple[str, str]] = [
    ("faiss", "FAISS"), ("pinecone", "Pinecone"), ("weaviate", "Weaviate"),
    ("qdrant", "Qdrant"), ("milvus", "Milvus"), ("elasticsearch", "Elasticsearch"),
    ("opensearch", "OpenSearch"), ("sentence-transformers", "sentence-transformers"),
    ("bge", "BGE"), ("e5 embed", "E5"), ("pytorch", "PyTorch"),
    ("tensorflow", "TensorFlow"), ("rag", "RAG"), ("bert", "BERT"),
    ("hugging face", "HuggingFace"), ("transformers", "transformers"),
    ("lora", "LoRA"), ("peft", "PEFT"), ("qlora", "QLoRA"),
    ("ndcg", "NDCG"), ("mrr", "MRR"), ("xgboost", "XGBoost"),
    ("lightgbm", "LightGBM"), ("bm25", "BM25"), ("ann", "ANN indexing"),
    ("recommendation", "recommendation systems"), ("ranking", "ranking"),
    ("information retrieval", "IR"), ("dense retrieval", "dense retrieval"),
    ("hybrid search", "hybrid search"), ("vector search", "vector search"),
    ("embeddings", "embeddings"), ("python", "Python"), ("numpy", "NumPy"),
    ("nlp", "NLP"), ("text classification", "text classification"),
    ("named entity", "NER"),
]


def detect_honeypot(candidate: dict) -> float:
    """
    Return a penalty multiplier in [0, 1]. Values < 1 signal honeypot risk.
    Honeypots have subtly impossible profiles, e.g. Expert in 8 skills with
    0 months experience in each, or total career months >> claimed years.
    """
    skills_raw = candidate.get("skills_raw", [])
    years_exp = float(candidate.get("years_experience", 0))
    career = candidate.get("career_history", [])

    # Expert skills with 0 duration months — impossible to be expert at in 0 months
    expert_zero = sum(
        1 for s in skills_raw
        if str(s.get("proficiency", "")).lower() == "expert"
        and int(s.get("duration_months", -1)) == 0
    )
    if expert_zero >= 5:
        return 0.05   # almost certainly honeypot
    if expert_zero >= 3:
        return 0.30
    if expert_zero >= 1:
        return 0.80

    # Total career duration >> claimed years (suspicious inflation)
    total_career_months = sum(int(r.get("duration_months", 0) or 0) for r in career)
    if total_career_months > (years_exp + 5) * 12 and total_career_months > 0:
        return 0.25   # claims 5+ extra years not in career history

    return 1.0


def build_reasoning(candidate: dict, scores: dict, jd: dict = JD) -> str:
    """
    Build a specific, non-templated 1-2 sentence reasoning string for the
    CSV reasoning column.  Every fact mentioned must exist in the profile.
    """
    title = candidate.get("current_title", "Candidate")
    yoe = candidate.get("years_experience", 0)
    skill_names_set = set(s.lower() for s in candidate.get("skill_names", []))
    career = candidate.get("career_history", [])
    loc = candidate.get("location", "")
    country = candidate.get("country", "")
    open_wk = candidate.get("open_to_work", False)
    notice = candidate.get("notice_period_days", 90)
    rr = candidate.get("recruiter_response_rate", 0.0)
    days_inactive = candidate.get("days_since_active", 999)
    final_score = scores.get("final_score", 0)

    # ── Specific JD-matching skills ────────────────────────────────────────
    matched_skills = [
        display for key, display in _JD_SKILL_DISPLAY
        if key in skill_names_set
    ][:4]

    # ── Cluster coverage ───────────────────────────────────────────────────
    clusters_hit = [
        name for name, kws in jd["must_have_skill_clusters"].items()
        if any(kw.lower() in skill_names_set for kw in kws)
    ]
    n_clusters = len(clusters_hit)

    # ── Company type ───────────────────────────────────────────────────────
    companies_str = " ".join(r.get("company", "").lower() for r in career)
    consulting_count = sum(1 for f in CONSULTING_FIRMS if f in companies_str)
    all_consulting = consulting_count >= max(1, len(career) * 0.8)
    product_bg = not all_consulting and career

    # ── Career description — production signals ───────────────────────────
    career_desc = " ".join(r.get("description", "") for r in career).lower()
    prod_words = [w for w in ["production", "deployed", "shipped", "at scale", "live", "serving"]
                  if w in career_desc]
    has_prod_signal = len(prod_words) >= 1

    # ── Location ──────────────────────────────────────────────────────────
    loc_str = loc.split(",")[0].strip() if loc else country
    in_india = country.lower() == "india"
    tier1 = any(t in loc.lower() for t in TIER1_LOCATIONS) if in_india else False

    # ── Build sentence pieces ─────────────────────────────────────────────
    s1_parts = []

    # Lead: title + experience
    exp_qualifier = (
        "strong experience" if 5 <= yoe <= 9
        else "early-career" if yoe < 4
        else f"{yoe:.0f} yrs"
    )
    s1_parts.append(f"{title} ({yoe:.1f} yrs)")

    # Skills: name actual matches from JD
    if matched_skills:
        s1_parts.append(f"hands-on with {', '.join(matched_skills)}")
    elif n_clusters >= 3:
        s1_parts.append(f"covers {n_clusters}/5 must-have JD skill clusters")
    else:
        s1_parts.append(f"partial skill overlap ({n_clusters}/5 clusters)")

    # Career background
    if all_consulting:
        s1_parts.append("career exclusively at consulting firms — JD explicit disqualifier")
    elif has_prod_signal and product_bg:
        s1_parts.append("production deployment experience at product companies")
    elif product_bg:
        s1_parts.append("product-company background")

    # Location
    if loc_str:
        loc_note = f"{loc_str} (Tier-1)" if tier1 else loc_str
        s1_parts.append(f"based in {loc_note}")

    # ── Sentence 2: behavioral + concern ─────────────────────────────────
    s2_parts = []

    if open_wk:
        s2_parts.append("actively open to work")
    elif days_inactive > 180:
        s2_parts.append(f"inactive for {days_inactive} days — likely passive")

    if rr >= 0.80:
        s2_parts.append(f"high recruiter response rate ({rr:.0%})")
    elif rr <= 0.30:
        s2_parts.append(f"low response rate ({rr:.0%}) — availability concern")

    if notice <= 15:
        s2_parts.append(f"immediately available ({notice}d notice)")
    elif notice <= 30:
        s2_parts.append(f"short notice ({notice}d)")
    elif notice >= 90:
        s2_parts.append(f"long notice period ({notice}d) reduces urgency")

    # Honest gap if low score
    if final_score < 40 and n_clusters <= 2:
        s2_parts.append(
            "limited overlap with JD's core retrieval and ranking requirements"
        )

    sentence1 = "; ".join(s1_parts) + "."
    sentence2 = ("; ".join(s2_parts) + ".") if s2_parts else ""

    return (sentence1 + " " + sentence2).strip()


# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------

def _proficiency_mult(prof: str) -> float:
    return {"expert": 1.0, "advanced": 0.85, "intermediate": 0.65, "beginner": 0.40}.get(prof, 0.65)


def _duration_mult(months: int) -> float:
    if months >= 36:
        return 1.0
    if months >= 18:
        return 0.85
    if months >= 6:
        return 0.65
    if months > 0:
        return 0.40
    return 0.20  # 0 months (possible honeypot)


def _endorsement_mult(endorsements: int) -> float:
    if endorsements >= 20:
        return 1.0
    if endorsements >= 10:
        return 0.85
    if endorsements >= 3:
        return 0.70
    return 0.50


def _exp_years_score(years: float, ideal: float, soft_min: float, soft_max: float) -> float:
    """Gaussian falloff around [soft_min, soft_max], peak at ideal."""
    if soft_min <= years <= soft_max:
        # Gaussian within the band, peak=1.0 at ideal
        sigma = (soft_max - soft_min) / 3.0
        return math.exp(-0.5 * ((years - ideal) / sigma) ** 2)
    elif years < soft_min:
        # Below minimum: sharp falloff
        return math.exp(-0.5 * ((years - soft_min) / 1.5) ** 2) * 0.7
    else:
        # Above maximum: gentle falloff (more exp is less bad than too little)
        return math.exp(-0.5 * ((years - soft_max) / 2.0) ** 2) * 0.9


def _title_relevance_score(current_title: str, career: list[dict]) -> float:
    """Score how relevant the candidate's title is to ML/AI engineering."""
    all_titles = [current_title] + [r.get("title", "").lower() for r in career]
    all_titles_str = " ".join(all_titles).lower()

    # Strong positive signals
    strong_ai = [
        "ml engineer", "machine learning engineer", "ai engineer", "nlp engineer",
        "applied scientist", "research scientist", "data scientist", "ai specialist",
        "senior ai", "senior ml", "senior data scientist", "search engineer",
        "ranking engineer", "applied ml", "recsys", "recommendation",
    ]
    # Moderate positive
    moderate_ai = [
        "data engineer", "backend engineer", "software engineer", "full stack",
        "backend developer", "platform engineer", "infrastructure engineer",
    ]
    # Negative signals
    non_ai = [
        "hr manager", "sales executive", "mechanical", "civil engineer", "accountant",
        "content writer", "graphic designer", "marketing manager", "operations manager",
        "customer support", "project manager", "procurement", "ui designer", "ux designer",
        "business analyst", "finance", "legal", "admin",
    ]
    # Explicitly wrong specialty
    wrong_specialty = ["computer vision engineer", "speech engineer", "robotics"]

    if any(t in all_titles_str for t in strong_ai):
        return 0.90

    if any(t in all_titles_str for t in wrong_specialty):
        return 0.35  # CV/speech — adjacent but wrong per JD

    if any(t in all_titles_str for t in non_ai):
        return 0.05

    if any(t in all_titles_str for t in moderate_ai):
        return 0.55

    return 0.35  # unknown/other


def _location_score(location: str, country: str) -> float:
    if country == "india":
        for city in TIER1_LOCATIONS:
            if city in location:
                return 1.0
        return 0.75  # India but not Tier-1 city listed
    if country in ("", "unknown"):
        return 0.5
    return 0.3  # international — JD says case-by-case, no visa sponsorship


def _company_type_score(career: list[dict], current_company: str) -> float:
    """Score based on whether background is consulting-only or product companies."""
    if not career:
        return 0.5

    companies = [r.get("company", "").lower() for r in career]
    companies_str = " ".join(companies) + " " + current_company.lower()

    consulting_count = sum(
        1 for firm in CONSULTING_FIRMS
        if firm in companies_str
    )
    total = len([c for c in companies if c])

    if total == 0:
        return 0.5

    consulting_ratio = consulting_count / total

    if consulting_ratio >= 0.9:
        return 0.15  # all-consulting — JD says bad fit
    elif consulting_ratio >= 0.5:
        return 0.45  # mixed
    elif consulting_ratio > 0:
        return 0.75  # mostly product, some consulting
    else:
        return 0.95  # all product companies


def _production_signal_score(career: list[dict]) -> float:
    """Heuristic: does career history mention production deployment?"""
    prod_keywords = [
        "production", "deployed", "shipped", "launch", "real user", "live",
        "at scale", "serving", "inference", "prod", "release", "million", "billion",
    ]
    career_descriptions = " ".join(r.get("description", "") for r in career).lower()
    if not career_descriptions:
        return 0.5

    hits = sum(1 for kw in prod_keywords if kw in career_descriptions)
    return min(1.0, 0.3 + hits * 0.10)  # base 0.3, +0.1 per hit, cap at 1.0


def _tenure_score(avg_tenure_months: float) -> float:
    """Prefer avg tenure 12-48 months. Too short = job-hopper. Too long = stagnation."""
    if avg_tenure_months <= 0:
        return 0.5
    if 12 <= avg_tenure_months <= 48:
        return 1.0
    elif avg_tenure_months < 12:
        # Short tenure (job hopping)
        return max(0.2, avg_tenure_months / 12.0)
    else:
        # Very long tenure (stagnation risk for startup role)
        return max(0.5, 1.0 - (avg_tenure_months - 48) / 72.0)


def _industry_score(current_industry: str, career: list[dict]) -> float:
    preferred = set(JD["preferred_industries"])
    all_industries = [current_industry.lower()] + [
        r.get("industry", "").lower() for r in career
    ]
    hits = sum(1 for ind in all_industries if any(p in ind for p in preferred))
    return min(1.0, hits / max(1, len(all_industries)))


def _recency_score(days: int) -> float:
    """Exponential decay: active today = 1.0, inactive 365+ days ≈ 0.05."""
    if days <= 7:
        return 1.0
    if days <= 30:
        return 0.90
    if days <= 90:
        return 0.70
    if days <= 180:
        return 0.45
    if days <= 365:
        return 0.20
    return 0.05


def _notice_score(days: int) -> float:
    """JD prefers < 30 days. Can buy out up to 30. 30+ gets penalized."""
    if days <= 0:
        return 1.0
    if days <= 15:
        return 1.0
    if days <= 30:
        return 0.85
    if days <= 60:
        return 0.55
    if days <= 90:
        return 0.30
    return 0.10


def _career_text(candidate: dict) -> str:
    career = candidate.get("career_history", [])
    return " ".join(
        f"{r.get('title','')} {r.get('description','')}"
        for r in career
    )
