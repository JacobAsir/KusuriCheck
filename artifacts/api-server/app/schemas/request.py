"""Pydantic request schemas."""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class CautionProfile(BaseModel):
    pregnant_breastfeeding: bool = False
    elderly: bool = False
    child_use: bool = False
    liver_concern: bool = False
    kidney_concern: bool = False


class UserPreferences(BaseModel):
    language: Literal["ja", "en"] = "ja"
    audience_mode: Literal["standard", "simple", "caregiver"] = "standard"
    caution_profile: CautionProfile = Field(default_factory=CautionProfile)


class AnalyzeDemoRequest(BaseModel):
    demo_id: str
    preferences: UserPreferences
