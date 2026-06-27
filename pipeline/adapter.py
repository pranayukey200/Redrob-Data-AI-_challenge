"""
adapter.py — Raw candidate record → normalized CandidateProfile dict.

Maps from the real dataset's field names to the normalized internal schema.
Only this file should change if dataset field names change.
"""

from __future__ import annotations
from datetime import date, datetime
from typing import Any


def normalize(raw: dict[str, Any]) -> dict[str, Any]:
    """Convert raw JSONL record into normalized CandidateProfile dict."""
    profile = raw.get("profile", {})
    signals = raw.get("redrob_signals", {})
    skills_raw = raw.get("skills", [])
    career = raw.get("career_history", [])
    education = raw.get("education", [])
    certs = raw.get("certifications", [])

    # Derive skill name list (lowercase for matching)
    skill_names = [s["name"].lower() for s in skills_raw if s.get("name")]

    # Derive avg tenure
    tenures = [r.get("duration_months", 0) for r in career if r.get("duration_months")]
    avg_tenure = sum(tenures) / len(tenures) if tenures else 0

    # Education tier (best tier seen)
    tier_order = {"tier_1": 4, "tier_2": 3, "tier_3": 2, "tier_4": 1, "unknown": 0}
    edu_tiers = [tier_order.get(e.get("tier", "unknown"), 0) for e in education]
    best_edu_tier = max(edu_tiers) if edu_tiers else 0

    # Days since last active
    last_active_str = signals.get("last_active_date", "")
    days_since_active = _days_since(last_active_str)

    # Build profile text for embedding
    headline = profile.get("headline", "")
    summary = profile.get("summary", "")
    skill_text = " ".join(s["name"] for s in skills_raw)
    career_text = " ".join(
        f"{r.get('title','')} {r.get('company','')} {r.get('description','')}"
        for r in career[:3]
    )
    profile_text = f"{headline}. {summary} Skills: {skill_text}. {career_text}"

    return {
        # Identity
        "candidate_id": raw.get("candidate_id", ""),
        "name": profile.get("anonymized_name", ""),
        "headline": headline,
        "summary": summary,
        "location": profile.get("location", ""),
        "country": profile.get("country", ""),

        # Career
        "years_experience": float(profile.get("years_of_experience", 0) or 0),
        "current_title": profile.get("current_title", ""),
        "current_company": profile.get("current_company", ""),
        "current_company_size": profile.get("current_company_size", ""),
        "current_industry": profile.get("current_industry", ""),
        "career_history": career,
        "avg_tenure_months": round(avg_tenure, 1),

        # Skills
        "skills_raw": skills_raw,          # full objects with proficiency/endorsements
        "skill_names": skill_names,         # lowercase name list

        # Education
        "education": education,
        "best_edu_tier": best_edu_tier,    # 0-4 scale

        # Certifications
        "certifications": certs,

        # Behavioral signals (direct mapping)
        "profile_completeness": float(signals.get("profile_completeness_score", 0) or 0),
        "last_active_date": last_active_str,
        "days_since_active": days_since_active,
        "open_to_work": bool(signals.get("open_to_work_flag", False)),
        "profile_views_30d": int(signals.get("profile_views_received_30d", 0) or 0),
        "applications_30d": int(signals.get("applications_submitted_30d", 0) or 0),
        "recruiter_response_rate": float(signals.get("recruiter_response_rate", 0) or 0),
        "avg_response_time_hours": float(signals.get("avg_response_time_hours", 999) or 999),
        "skill_assessment_scores": signals.get("skill_assessment_scores", {}),
        "connection_count": int(signals.get("connection_count", 0) or 0),
        "endorsements_received": int(signals.get("endorsements_received", 0) or 0),
        "notice_period_days": int(signals.get("notice_period_days", 90) or 90),
        "salary_min_lpa": float(signals.get("expected_salary_range_inr_lpa", {}).get("min", 0) or 0),
        "salary_max_lpa": float(signals.get("expected_salary_range_inr_lpa", {}).get("max", 0) or 0),
        "preferred_work_mode": signals.get("preferred_work_mode", ""),
        "willing_to_relocate": bool(signals.get("willing_to_relocate", False)),
        "github_score": float(signals.get("github_activity_score", -1) or -1),
        "search_appearance_30d": int(signals.get("search_appearance_30d", 0) or 0),
        "saved_by_recruiters_30d": int(signals.get("saved_by_recruiters_30d", 0) or 0),
        "interview_completion_rate": float(signals.get("interview_completion_rate", 0) or 0),
        "offer_acceptance_rate": float(signals.get("offer_acceptance_rate", -1) if signals.get("offer_acceptance_rate") is not None else -1),
        "verified_email": bool(signals.get("verified_email", False)),
        "verified_phone": bool(signals.get("verified_phone", False)),
        "linkedin_connected": bool(signals.get("linkedin_connected", False)),

        # For embedding
        "profile_text": profile_text,
    }


def _days_since(date_str: str) -> int:
    """Returns days since a YYYY-MM-DD date string from 2026-06-27."""
    if not date_str:
        return 999
    try:
        d = datetime.strptime(date_str, "%Y-%m-%d").date()
        today = date(2026, 6, 27)
        return max(0, (today - d).days)
    except Exception:
        return 999
