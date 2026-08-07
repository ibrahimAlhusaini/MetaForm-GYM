"""Centralized Body-weight Prediction V1 configuration."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class WeightModelConfig:
    """Validated constants defining the complete V1 experiment contract."""

    forecast_horizon_days: int = 7
    target_tolerance_days: int = 2
    minimum_prior_measurements: int = 5
    rolling_short_window: int = 3
    rolling_long_window: int = 5
    measurement_frequency_days: int = 30
    trend_window: int = 5
    minimum_training_rows: int = 8
    meaningful_improvement_percent: float = 5.0
    random_seed: int = 20_260_807
    model_version: str = "body-weight-v1"

    def __post_init__(self) -> None:
        positive_values = {
            "forecast_horizon_days": self.forecast_horizon_days,
            "minimum_prior_measurements": self.minimum_prior_measurements,
            "rolling_short_window": self.rolling_short_window,
            "rolling_long_window": self.rolling_long_window,
            "measurement_frequency_days": self.measurement_frequency_days,
            "trend_window": self.trend_window,
            "minimum_training_rows": self.minimum_training_rows,
        }
        invalid = [name for name, value in positive_values.items() if value <= 0]
        if invalid:
            raise ValueError(
                f"Model configuration must be positive: {', '.join(invalid)}"
            )
        if self.target_tolerance_days < 0:
            raise ValueError("target_tolerance_days cannot be negative")
        if self.target_tolerance_days >= self.forecast_horizon_days:
            raise ValueError("target tolerance must be smaller than forecast horizon")
        if self.rolling_short_window > self.rolling_long_window:
            raise ValueError("short rolling window cannot exceed long rolling window")
        if self.meaningful_improvement_percent < 0:
            raise ValueError("meaningful improvement threshold cannot be negative")
        if not self.model_version.strip():
            raise ValueError("model_version cannot be blank")

    @property
    def target_minimum_days(self) -> int:
        return self.forecast_horizon_days - self.target_tolerance_days

    @property
    def target_maximum_days(self) -> int:
        return self.forecast_horizon_days + self.target_tolerance_days
