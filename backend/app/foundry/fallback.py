"""Hardcoded fallback per CLAUDE.md's critical UX rule: the demo must never
visibly break if the Foundry call is slow or flaky."""

from app.foundry.validation import RawRecommendation

FALLBACK_RECOMMENDATION = RawRecommendation(
    activity="10-minute walk and hydration break",
    category="physical",
    duration_minutes=10,
    intensity="easy",
    reason="We couldn't reach the AI planner right now, so here's a safe default to keep you moving.",
)


def fallback_for(usable_minutes: int) -> RawRecommendation:
    duration = min(FALLBACK_RECOMMENDATION.duration_minutes, max(usable_minutes, 1))
    return FALLBACK_RECOMMENDATION.model_copy(update={"duration_minutes": duration})
