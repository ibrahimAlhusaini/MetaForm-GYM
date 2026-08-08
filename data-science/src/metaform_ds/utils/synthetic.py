"""Small deterministic, obviously synthetic datasets; never writes to PostgreSQL."""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd

from metaform_ds.contracts import (
    BODY_WEIGHT_CONTRACT,
    NUTRITION_CONTRACT,
    STRENGTH_CONTRACT,
    WORKOUT_ACTIVITY_CONTRACT,
)


@dataclass(frozen=True, slots=True)
class SyntheticDatasets:
    body_weight: pd.DataFrame
    strength: pd.DataFrame
    workouts: pd.DataFrame
    nutrition: pd.DataFrame
    metadata: dict[str, object]


def generate_synthetic_datasets(seed: int = 20_260_807) -> SyntheticDatasets:
    """Generate realistic-enough paths solely to exercise analytics code."""
    rng = np.random.default_rng(seed)
    user = "synthetic_user_001"
    weight_dates = pd.date_range("2026-01-05", periods=24, freq="4D", tz="UTC")
    body = BODY_WEIGHT_CONTRACT.conform(
        pd.DataFrame(
            {
                "anonymous_user_id": user,
                "measured_at": weight_dates,
                "weight_kg": 82 - np.arange(24) * 0.12 + rng.normal(0, 0.25, 24),
                "height_cm": 178.0,
                "fitness_goal": "LOSE_FAT",
                "activity_level": "MODERATE",
            }
        )
    )
    strength_rows: list[dict[str, object]] = []
    source_specs = [
        (
            user,
            "EXERCISE",
            "synthetic_exercise_progressive",
            "Synthetic Press",
            "CHEST",
            "BARBELL",
            45.0,
            0.9,
            "progressive",
        ),
        (
            user,
            "CUSTOM_MACHINE",
            "synthetic_machine_stable",
            None,
            None,
            None,
            62.0,
            0.0,
            "stable",
        ),
        (
            "synthetic_user_002",
            "EXERCISE",
            "synthetic_exercise_noisy",
            "Synthetic Row",
            "BACK",
            "CABLE",
            52.0,
            0.35,
            "noisy",
        ),
        (
            "synthetic_user_002",
            "CUSTOM_MACHINE",
            "synthetic_machine_deload",
            None,
            None,
            None,
            78.0,
            0.45,
            "deload",
        ),
    ]
    for source_index, (
        source_user,
        source_type,
        source_key,
        source_name,
        muscle,
        equipment,
        start,
        slope,
        pattern,
    ) in enumerate(source_specs):
        elapsed = np.cumsum(rng.integers(4, 11, 22))
        weights = (
            start
            + slope * np.arange(22)
            + rng.normal(0, 0.8 if pattern == "noisy" else 0.35, 22)
        )
        if pattern == "deload":
            weights[[7, 15]] -= np.array([7.0, 9.0])
        for index, (elapsed_days, weight) in enumerate(
            zip(elapsed, weights, strict=True)
        ):
            reps = int(rng.integers(5, 9))
            sets = int(rng.integers(3, 6))
            strength_rows.append(
                {
                    "anonymous_user_id": source_user,
                    "session_id_anonymous": (
                        f"synthetic_strength_{source_index}_{index:03d}"
                    ),
                    "session_date": pd.Timestamp("2026-01-01", tz="UTC")
                    + pd.Timedelta(days=int(elapsed_days)),
                    "source_type": source_type,
                    "source_key_anonymous": source_key,
                    "source_name": source_name,
                    "max_weight_kg": max(1.0, float(weight)),
                    "max_reps_at_max_weight": reps,
                    "total_volume_kg": max(1.0, float(weight)) * reps * sets,
                    "working_set_count": sets,
                    "primary_muscle": muscle,
                    "equipment_type": equipment,
                    "synthetic_pattern": pattern,
                }
            )
    strength = STRENGTH_CONTRACT.conform(pd.DataFrame(strength_rows))
    workout_dates = pd.date_range("2026-01-06", periods=30, freq="3D", tz="UTC")
    workouts = WORKOUT_ACTIVITY_CONTRACT.conform(
        pd.DataFrame(
            {
                "anonymous_user_id": user,
                "session_id_anonymous": [
                    f"synthetic_workout_{i:03d}" for i in range(30)
                ],
                "session_date": workout_dates,
                "completed": True,
                "duration_minutes": rng.integers(42, 76, 30),
                "exercise_count": rng.integers(4, 8, 30),
                "working_set_count": rng.integers(12, 25, 30),
                "total_volume_kg": rng.normal(6_000, 800, 30).clip(2_000),
                "workout_plan_used": rng.random(30) > 0.25,
            }
        )
    )
    nutrition_dates = pd.date_range("2026-01-05", periods=8, freq="14D", tz="UTC")
    nutrition = NUTRITION_CONTRACT.conform(
        pd.DataFrame(
            {
                "anonymous_user_id": user,
                "calculated_at": nutrition_dates,
                "weight_kg_used": np.linspace(82, 79.4, 8),
                "fitness_goal": "LOSE_FAT",
                "activity_level": "MODERATE",
                "maintenance_calories": 2_450,
                "recommended_calories": 2_050,
                "protein_grams": 160.0,
                "carbohydrate_grams": 210.0,
                "fat_grams": 65.0,
                "water_liters": 3.0,
                "calculation_version": "SYNTHETIC_V1",
            }
        )
    )
    for frame in (body, strength, workouts, nutrition):
        frame.attrs.update({"synthetic": True, "seed": seed})
    return SyntheticDatasets(
        body,
        strength,
        workouts,
        nutrition,
        {"synthetic": True, "seed": seed, "database_written": False},
    )
