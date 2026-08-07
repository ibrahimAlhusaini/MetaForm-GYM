"""Ordered, public analytical dataset contracts."""

from __future__ import annotations

from contextlib import suppress
from dataclasses import dataclass

import pandas as pd


@dataclass(frozen=True, slots=True)
class DatasetContract:
    """Stable dataset name, column order, and pandas dtypes."""

    name: str
    dtypes: dict[str, str]

    @property
    def columns(self) -> list[str]:
        return list(self.dtypes)

    def empty_frame(self) -> pd.DataFrame:
        return pd.DataFrame(
            {column: pd.Series(dtype=dtype) for column, dtype in self.dtypes.items()}
        )

    def conform(self, frame: pd.DataFrame) -> pd.DataFrame:
        """Add missing columns, remove extras, and preserve stable ordering."""
        result = frame.copy()
        for column, dtype in self.dtypes.items():
            if column not in result:
                result[column] = pd.Series(index=result.index, dtype=dtype)
        result = result.loc[:, self.columns]
        for column, dtype in self.dtypes.items():
            # Conversion details are intentionally reported by quality checks.
            with suppress(TypeError, ValueError):
                result[column] = result[column].astype(dtype)  # type: ignore[call-overload]
        return result


BODY_WEIGHT_CONTRACT = DatasetContract(
    "body_weight",
    {
        "anonymous_user_id": "string",
        "measured_at": "datetime64[ns, UTC]",
        "weight_kg": "Float64",
        "height_cm": "Float64",
        "fitness_goal": "string",
        "activity_level": "string",
    },
)

STRENGTH_CONTRACT = DatasetContract(
    "strength_progression",
    {
        "anonymous_user_id": "string",
        "session_id_anonymous": "string",
        "session_date": "datetime64[ns, UTC]",
        "source_type": "string",
        "source_key_anonymous": "string",
        "source_name": "string",
        "max_weight_kg": "Float64",
        "max_reps_at_max_weight": "Int64",
        "total_volume_kg": "Float64",
        "working_set_count": "Int64",
        "primary_muscle": "string",
        "equipment_type": "string",
    },
)

WORKOUT_ACTIVITY_CONTRACT = DatasetContract(
    "workout_activity",
    {
        "anonymous_user_id": "string",
        "session_id_anonymous": "string",
        "session_date": "datetime64[ns, UTC]",
        "completed": "boolean",
        "duration_minutes": "Float64",
        "exercise_count": "Int64",
        "working_set_count": "Int64",
        "total_volume_kg": "Float64",
        "workout_plan_used": "boolean",
    },
)

NUTRITION_CONTRACT = DatasetContract(
    "nutrition",
    {
        "anonymous_user_id": "string",
        "calculated_at": "datetime64[ns, UTC]",
        "weight_kg_used": "Float64",
        "fitness_goal": "string",
        "activity_level": "string",
        "maintenance_calories": "Int64",
        "recommended_calories": "Int64",
        "protein_grams": "Float64",
        "carbohydrate_grams": "Float64",
        "fat_grams": "Float64",
        "water_liters": "Float64",
        "calculation_version": "string",
    },
)

USER_FITNESS_CONTEXT_CONTRACT = DatasetContract(
    "user_fitness_context",
    {
        "anonymous_user_id": "string",
        "age": "Int64",
        "gender": "string",
        "height_cm": "Float64",
        "current_weight_kg": "Float64",
        "activity_level": "string",
        "fitness_goal": "string",
    },
)

DATASET_CONTRACTS = {
    contract.name: contract
    for contract in (
        BODY_WEIGHT_CONTRACT,
        STRENGTH_CONTRACT,
        WORKOUT_ACTIVITY_CONTRACT,
        NUTRITION_CONTRACT,
        USER_FITNESS_CONTEXT_CONTRACT,
    )
}
