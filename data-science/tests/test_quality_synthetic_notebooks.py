from __future__ import annotations

import json
from pathlib import Path

import pandas as pd

from metaform_ds.quality import build_quality_report, quality_report_markdown
from metaform_ds.utils.notebooks import load_notebook_data
from metaform_ds.utils.synthetic import generate_synthetic_datasets


def test_quality_detects_nulls_negatives_duplicates_and_duplicate_times() -> None:
    frame = pd.DataFrame(
        {
            "anonymous_user_id": ["u", "u", "u"],
            "measured_at": pd.to_datetime(
                ["2026-01-01", "2026-01-01", "2026-01-01"], utc=True
            ),
            "weight_kg": [80.0, -1.0, -1.0],
            "duration_minutes": [30.0, -5.0, -5.0],
        }
    )
    report = build_quality_report(
        frame,
        dataset_name="test",
        timestamp_column="measured_at",
        duplicate_timestamp_keys=["anonymous_user_id", "measured_at"],
    )
    codes = set(report.issues["code"])
    assert {"duplicate_rows", "duplicate_timestamps", "non_positive_value"}.issubset(
        codes
    )
    assert "negative_value" in codes
    assert report.null_rates["null_count"].sum() == 0
    assert "Data quality: test" in quality_report_markdown(report)


def test_empty_quality_report_is_safe() -> None:
    report = build_quality_report(
        pd.DataFrame(columns=["weight_kg"]), dataset_name="empty"
    )
    assert report.row_count == 0
    assert report.issue_count == 0
    assert report.null_rates.loc[0, "null_rate"] == 0


def test_synthetic_generator_is_fixed_seed_and_explicit() -> None:
    first = generate_synthetic_datasets(42)
    second = generate_synthetic_datasets(42)
    pd.testing.assert_frame_equal(first.body_weight, second.body_weight)
    pd.testing.assert_frame_equal(first.strength, second.strength)
    assert first.metadata == {"synthetic": True, "seed": 42, "database_written": False}
    assert first.body_weight.attrs["synthetic"] is True


def test_notebook_loader_without_database_is_all_synthetic(monkeypatch) -> None:
    monkeypatch.delenv("DATA_SCIENCE_DATABASE_URL", raising=False)
    loaded = load_notebook_data()
    assert loaded.mode == "SYNTHETIC"
    assert loaded.body_weight.attrs["synthetic"] is True
    assert loaded.fitness_context.empty


def test_notebooks_are_valid_and_have_no_absolute_windows_paths() -> None:
    notebook_dir = Path(__file__).resolve().parents[1] / "notebooks"
    expected = {
        "01_data_overview.ipynb",
        "02_body_weight_eda.ipynb",
        "03_strength_progression_eda.ipynb",
        "04_nutrition_and_training_eda.ipynb",
        "05_body_weight_prediction_v1.ipynb",
        "06_body_weight_robustness_calibration.ipynb",
        "07_real_data_evidence_protocol.ipynb",
    }
    assert {path.name for path in notebook_dir.glob("*.ipynb")} == expected
    for path in notebook_dir.glob("*.ipynb"):
        content = path.read_text(encoding="utf-8")
        notebook = json.loads(content)
        assert notebook["nbformat"] == 4
        assert "C:\\\\MetaForm GYM" not in content
        code = "\n".join(
            "".join(cell.get("source", []))
            for cell in notebook["cells"]
            if cell["cell_type"] == "code"
        )
        assert "metaform_ds" in code
