import pytest
from app.db.models import InputField
from app.services.validator import validate_and_prepare_inputs, ValidationError


def test_validator_text_field_success():
    fields = [
        InputField(
            id=1, connector_id=1, name="topic", field_type="text",
            required=True, validation_rules={"min_length": 2, "max_length": 50}, order=0
        )
    ]
    data, parts = validate_and_prepare_inputs(fields, {"topic": "AI Technology"})
    assert data["topic"] == "AI Technology"
    assert len(parts) == 0


def test_validator_required_missing_fails():
    fields = [
        InputField(
            id=1, connector_id=1, name="topic", field_type="text",
            required=True, validation_rules={}, order=0
        )
    ]
    with pytest.raises(ValidationError) as exc:
        validate_and_prepare_inputs(fields, {})
    assert "required" in str(exc.value).lower()


def test_validator_number_bounds():
    fields = [
        InputField(
            id=1, connector_id=1, name="limit", field_type="number",
            required=True, validation_rules={"min": 5, "max": 100}, order=0
        )
    ]
    # Valid
    data, _ = validate_and_prepare_inputs(fields, {"limit": "50"})
    assert data["limit"] == 50

    # Below min
    with pytest.raises(ValidationError):
        validate_and_prepare_inputs(fields, {"limit": "2"})

    # Above max
    with pytest.raises(ValidationError):
        validate_and_prepare_inputs(fields, {"limit": "150"})


def test_validator_boolean_conversion():
    fields = [
        InputField(
            id=1, connector_id=1, name="include_sources", field_type="boolean",
            required=True, validation_rules={}, order=0
        )
    ]
    data, _ = validate_and_prepare_inputs(fields, {"include_sources": "true"})
    assert data["include_sources"] is True

    data2, _ = validate_and_prepare_inputs(fields, {"include_sources": "off"})
    assert data2["include_sources"] is False


def test_validator_image_mime_and_size():
    fields = [
        InputField(
            id=1, connector_id=1, name="card_img", field_type="image",
            required=True,
            validation_rules={"allowed_mime_types": ["image/png"], "max_size_bytes": 1000},
            order=0,
        )
    ]

    # Valid PNG upload
    files = {"card_img": (b"\x89PNG\r\n\x1a\nfakeimagebytes", "image/png", "card.png")}
    data, parts = validate_and_prepare_inputs(fields, {}, uploaded_files=files)
    assert len(parts) == 1
    assert parts[0].type == "image"
    assert parts[0].mime_type == "image/png"

    # Unsupported MIME
    bad_mime = {"card_img": (b"fakedata", "image/gif", "card.gif")}
    with pytest.raises(ValidationError) as exc:
        validate_and_prepare_inputs(fields, {}, uploaded_files=bad_mime)
    assert "unsupported mime" in str(exc.value).lower()

    # Oversized
    huge_bytes = b"0" * 1500
    huge_file = {"card_img": (huge_bytes, "image/png", "huge.png")}
    with pytest.raises(ValidationError) as exc:
        validate_and_prepare_inputs(fields, {}, uploaded_files=huge_file)
    assert "exceeds size limit" in str(exc.value).lower()
