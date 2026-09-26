import json
from app.db.models import Connector
from app.services.prompt_engine import PromptBuilder
from app.providers.base import ContentPart


def test_prompt_builder_delimiters_and_schema():
    connector = Connector(
        slug="test-builder",
        name="Test",
        system_prompt="Extract entities.",
        output_schema={"entities": "list"},
    )
    validated_inputs = {"text": "Apple released new M4 MacBook"}
    multimodal_parts = [ContentPart(type="image", data_base64="abc1234", mime_type="image/jpeg")]

    sys_prompt, user_parts = PromptBuilder.build(connector, validated_inputs, multimodal_parts)

    assert "Extract entities." in sys_prompt
    assert "Expected JSON Schema" in sys_prompt
    assert "entities" in sys_prompt

    assert len(user_parts) == 2
    assert "=== BEGIN UNTRUSTED USER INPUT ===" in user_parts[0].text
    assert "=== END UNTRUSTED USER INPUT ===" in user_parts[0].text
    assert "Apple released new M4 MacBook" in user_parts[0].text
    assert user_parts[1].type == "image"
