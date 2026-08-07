"""One interpretable sklearn pipeline fitted only inside temporal folds."""

from __future__ import annotations

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LinearRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

from metaform_ds.modeling.weight.targets import (
    CATEGORICAL_FEATURE_COLUMNS,
    MODEL_FEATURE_COLUMNS,
    NUMERIC_FEATURE_COLUMNS,
)


def model_input(frame: pd.DataFrame) -> pd.DataFrame:
    """Copy and normalize missing markers without learning from the full dataset."""
    result = frame.reindex(columns=MODEL_FEATURE_COLUMNS).copy(deep=True)
    for column in NUMERIC_FEATURE_COLUMNS:
        result[column] = pd.to_numeric(result[column], errors="coerce")
    for column in CATEGORICAL_FEATURE_COLUMNS:
        result[column] = (
            result[column].astype("object").where(result[column].notna(), np.nan)
        )
    return result


def build_weight_regression_pipeline() -> Pipeline:
    """Create numeric/categorical preprocessing followed by LinearRegression."""
    numeric = Pipeline([("imputer", SimpleImputer(strategy="median"))])
    categorical = Pipeline(
        [
            ("imputer", SimpleImputer(strategy="constant", fill_value="UNKNOWN")),
            (
                "one_hot",
                OneHotEncoder(handle_unknown="ignore", sparse_output=False),
            ),
        ]
    )
    preprocessing = ColumnTransformer(
        [
            ("numeric", numeric, NUMERIC_FEATURE_COLUMNS),
            ("categorical", categorical, CATEGORICAL_FEATURE_COLUMNS),
        ],
        remainder="drop",
    )
    return Pipeline(
        [("preprocessing", preprocessing), ("regression", LinearRegression())]
    )
