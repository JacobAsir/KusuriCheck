"""Explainer provider factory."""
from __future__ import annotations

from app.core.config import settings
from app.services.explainer.base import ExplainerProvider
from app.services.explainer.groq_provider import GroqExplainer
from app.services.explainer.template_provider import TemplateExplainer


def get_explainer() -> ExplainerProvider:
    if settings.groq_api_key:
        return GroqExplainer()
    return TemplateExplainer()


# The deterministic template explainer. Used as the safe fallback when an
# LLM call fails AND as the hard-gated explainer at escalation >= 3 where the
# LLM must never get a chance to override the rule engine.
fallback_explainer = TemplateExplainer()
deterministic_explainer = fallback_explainer
