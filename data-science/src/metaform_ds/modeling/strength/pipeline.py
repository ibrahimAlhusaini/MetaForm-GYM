"""Fold-local interpretable strength regression pipelines."""

from __future__ import annotations

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

from metaform_ds.modeling.strength.targets import (
    CATEGORICAL_FEATURE_COLUMNS,
    MODEL_FEATURE_COLUMNS,
    NUMERIC_FEATURE_COLUMNS,
)


def model_input(frame: pd.DataFrame) -> pd.DataFrame:
    result = frame.reindex(columns=MODEL_FEATURE_COLUMNS).copy(deep=True)
    for column in NUMERIC_FEATURE_COLUMNS:
        result[column] = pd.to_numeric(result[column], errors="coerce")
    for column in CATEGORICAL_FEATURE_COLUMNS:
        result[column] = (
            result[column].astype("object").where(result[column].notna(), np.nan)
        )
    return result


def _preprocessing() -> ColumnTransformer:
    return ColumnTransformer(
        [
            (
                "numeric",
                Pipeline([("imputer", SimpleImputer(strategy="median"))]),
                NUMERIC_FEATURE_COLUMNS,
            ),
            (
                "categorical",
                Pipeline(
                    [
                        (
                            "imputer",
                            SimpleImputer(strategy="constant", fill_value="UNKNOWN"),
                        ),
                        (
                            "one_hot",
                            OneHotEncoder(handle_unknown="ignore", sparse_output=False),
                        ),
                    ]
                ),
                CATEGORICAL_FEATURE_COLUMNS,
            ),
        ],
        remainder="drop",
    )


def build_linear_pipeline() -> Pipeline:
    return Pipeline(
        [("preprocessing", _preprocessing()), ("regression", LinearRegression())]
    )


def build_ridge_pipeline(alpha: float = 1.0) -> Pipeline:
    if alpha <= 0:
        raise ValueError("Ridge alpha must be positive")
    return Pipeline(
        [("preprocessing", _preprocessing()), ("regression", Ridge(alpha=alpha))]
    )
