import pytest
from app.services.schema_repair import SchemaRepairService, SchemaMismatchError


def test_clean_and_parse_json_with_markdown_fences():
    raw = """Here is your output:
```json
{
  "name": "Jane Doe",
  "company": "Tech Corp"
}
```
Hope that helps!"""

    parsed = SchemaRepairService.clean_and_parse_json(raw)
    assert parsed["name"] == "Jane Doe"
    assert parsed["company"] == "Tech Corp"


def test_clean_and_parse_json_with_trailing_commas():
    raw = """{
  "title": "Universal Hub",
  "count": 42,
}"""
    parsed = SchemaRepairService.clean_and_parse_json(raw)
    assert parsed["title"] == "Universal Hub"
    assert parsed["count"] == 42


def test_validate_and_normalize_fills_missing_keys():
    expected_schema = {
        "name": "string",
        "company": "string",
        "phone": "string",
        "employees": "number",
    }
    raw_data = {"name": "Alice"}

    normalized = SchemaRepairService.validate_and_normalize(raw_data, expected_schema)
    assert normalized["name"] == "Alice"
    assert normalized["company"] == ""
    assert normalized["phone"] == ""
    assert normalized["employees"] == 0


def test_empty_response_raises_mismatch():
    with pytest.raises(SchemaMismatchError):
        SchemaRepairService.clean_and_parse_json("   ")
