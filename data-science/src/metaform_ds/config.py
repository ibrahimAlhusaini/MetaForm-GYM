"""Centralized, typed environment configuration."""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


class ConfigurationError(ValueError):
    """Raised when required data-science configuration is invalid."""


@dataclass(frozen=True, slots=True)
class DataScienceConfig:
    """Runtime settings loaded once rather than scattered across modules."""

    database_url: str | None = None
    anonymization_secret: str | None = None
    artifact_dir: Path = Path("artifacts")
    synthetic_seed: int = 20_260_807

    @classmethod
    def from_env(cls) -> DataScienceConfig:
        """Load settings without requiring database access for pure workflows."""
        seed_value = os.getenv("DATA_SCIENCE_SYNTHETIC_SEED", "20260807")
        try:
            seed = int(seed_value)
        except ValueError as error:
            raise ConfigurationError(
                "DATA_SCIENCE_SYNTHETIC_SEED must be an integer"
            ) from error
        return cls(
            database_url=os.getenv("DATA_SCIENCE_DATABASE_URL") or None,
            anonymization_secret=(
                os.getenv("DATA_SCIENCE_ANONYMIZATION_SECRET") or None
            ),
            artifact_dir=Path(os.getenv("DATA_SCIENCE_ARTIFACT_DIR", "artifacts")),
            synthetic_seed=seed,
        )

    def require_database_url(self) -> str:
        """Return a validated PostgreSQL URL only when extraction is requested."""
        if not self.database_url:
            raise ConfigurationError(
                "DATA_SCIENCE_DATABASE_URL is required for database extraction"
            )
        accepted = (
            "postgresql://",
            "postgres://",
            "postgresql+psycopg://",
            "postgres+psycopg://",
        )
        if not self.database_url.startswith(accepted):
            raise ConfigurationError(
                "DATA_SCIENCE_DATABASE_URL must be a PostgreSQL URL"
            )
        return self.database_url
