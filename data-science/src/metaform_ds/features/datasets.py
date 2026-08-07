"""Future training contracts only; this module deliberately fits no models."""

from __future__ import annotations

from dataclasses import dataclass

import pandas as pd

from metaform_ds.features.causal import add_body_weight_features, add_strength_features


@dataclass(frozen=True, slots=True)
class PreparedDataset:
    features: pd.DataFrame
    target: pd.Series
    metadata: pd.DataFrame


def prepare_weight_model_dataset(frame: pd.DataFrame) -> PreparedDataset:
    enriched = add_body_weight_features(frame)
    feature_columns = [
        "days_since_first_measurement",
        "previous_weight_kg",
        "rolling_mean_7",
        "rolling_mean_14",
        "recent_change_kg",
        "measurement_frequency_30d",
    ]
    metadata_columns = ["anonymous_user_id", "measured_at"]
    usable = enriched.loc[enriched["weight_kg"].notna()].reset_index(drop=True)
    return PreparedDataset(
        features=usable.reindex(columns=feature_columns),
        target=usable["weight_kg"].rename("target_weight_kg"),
        metadata=usable.reindex(columns=metadata_columns),
    )


def prepare_strength_model_dataset(frame: pd.DataFrame) -> PreparedDataset:
    enriched = add_strength_features(frame)
    feature_columns = [
        "session_index",
        "days_since_first_session",
        "previous_max_weight",
        "rolling_max_5",
        "recent_average_weight_5",
        "recent_volume_5",
        "days_since_previous_session",
    ]
    metadata_columns = [
        "anonymous_user_id",
        "source_key_anonymous",
        "session_date",
    ]
    usable = enriched.loc[enriched["max_weight_kg"].notna()].reset_index(drop=True)
    return PreparedDataset(
        features=usable.reindex(columns=feature_columns),
        target=usable["max_weight_kg"].rename("target_max_weight_kg"),
        metadata=usable.reindex(columns=metadata_columns),
    )
