from metaform_ds.db import assert_select_only
from metaform_ds.extraction.queries import (
    BODY_WEIGHT_SQL,
    NUTRITION_SQL,
    STRENGTH_PROGRESSION_SQL,
    USER_FITNESS_CONTEXT_SQL,
    WORKOUT_ACTIVITY_SQL,
)


def test_all_extraction_queries_are_select_only() -> None:
    for query in (
        BODY_WEIGHT_SQL,
        STRENGTH_PROGRESSION_SQL,
        WORKOUT_ACTIVITY_SQL,
        NUTRITION_SQL,
        USER_FITNESS_CONTEXT_SQL,
    ):
        assert_select_only(query)


def test_strength_query_matches_product_semantics_and_privacy() -> None:
    normalized = STRENGTH_PROGRESSION_SQL.lower()
    assert 'session."completedat" is not null' in normalized
    assert 'set_row."iswarmup" = false' in normalized
    assert 'set_row."weightkg" is not null' in normalized
    assert "max(weight_kg)" in normalized
    assert "machine.name" not in normalized


def test_queries_do_not_select_authentication_or_identifying_fields() -> None:
    combined = "\n".join(
        [
            BODY_WEIGHT_SQL,
            STRENGTH_PROGRESSION_SQL,
            WORKOUT_ACTIVITY_SQL,
            NUTRITION_SQL,
            USER_FITNESS_CONTEXT_SQL,
        ]
    ).lower()
    for forbidden in (
        "email",
        "passwordhash",
        "fullname",
        "refreshtoken",
        "tokenhash",
        "ipaddress",
        "useragent",
    ):
        assert forbidden not in combined
