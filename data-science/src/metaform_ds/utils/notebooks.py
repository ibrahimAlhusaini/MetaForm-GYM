"""Notebook loading helpers with explicit real-versus-synthetic modes."""

from __future__ import annotations

from dataclasses import dataclass

import pandas as pd

from metaform_ds.config import DataScienceConfig
from metaform_ds.db import create_read_only_engine
from metaform_ds.extraction import (
    extract_body_weight_dataset,
    extract_nutrition_dataset,
    extract_strength_progression_dataset,
    extract_user_fitness_context_dataset,
    extract_workout_activity_dataset,
)
from metaform_ds.utils.synthetic import generate_synthetic_datasets


@dataclass(frozen=True, slots=True)
class NotebookData:
    mode: str
    body_weight: pd.DataFrame
    strength: pd.DataFrame
    workouts: pd.DataFrame
    nutrition: pd.DataFrame
    fitness_context: pd.DataFrame


def load_notebook_data(config: DataScienceConfig | None = None) -> NotebookData:
    """Load all-real data when configured, otherwise all-synthetic data.

    Individual empty real datasets are never replaced with synthetic rows, which
    prevents accidental mixed-origin analysis.
    """
    settings = config or DataScienceConfig.from_env()
    if settings.database_url is None:
        synthetic = generate_synthetic_datasets(settings.synthetic_seed)
        return NotebookData(
            "SYNTHETIC",
            synthetic.body_weight,
            synthetic.strength,
            synthetic.workouts,
            synthetic.nutrition,
            pd.DataFrame(),
        )
    engine = create_read_only_engine(settings)
    try:
        return NotebookData(
            "READ_ONLY_DATABASE",
            extract_body_weight_dataset(engine, secret=settings.anonymization_secret),
            extract_strength_progression_dataset(
                engine, secret=settings.anonymization_secret
            ),
            extract_workout_activity_dataset(
                engine, secret=settings.anonymization_secret
            ),
            extract_nutrition_dataset(engine, secret=settings.anonymization_secret),
            extract_user_fitness_context_dataset(
                engine, secret=settings.anonymization_secret
            ),
        )
    finally:
        engine.dispose()
