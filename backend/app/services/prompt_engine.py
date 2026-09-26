import json
from typing import Dict, Any, List, Tuple
from app.db.models import Connector
from app.providers.base import ContentPart


class PromptBuilder:
    """
    Constructs prompt instructions and structured content parts for AI providers.
    Prevents prompt injection by isolating untrusted user input inside explicit delimiters.
    """

    @staticmethod
    def build(
        connector: Connector,
        validated_inputs: Dict[str, Any],
        multimodal_parts: List[ContentPart],
    ) -> Tuple[str, List[ContentPart]]:
        """
        Constructs:
            (system_prompt_string, list_of_user_content_parts)
        """
        # 1. System Prompt Construction
        system_instructions = connector.system_prompt.strip()
        schema_json_str = json.dumps(connector.output_schema or {}, indent=2)

        schema_directive = (
            "\n\n### CRITICAL OUTPUT INSTRUCTIONS ###\n"
            "You MUST respond ONLY with a single valid JSON object that strictly adheres to the schema below.\n"
            "Do NOT include markdown formatting, markdown backticks (like ```json), commentary, greetings, or explanations.\n"
            f"Expected JSON Schema:\n{schema_json_str}\n"
        )
        full_system_prompt = f"{system_instructions}{schema_directive}"

        # 2. Delimited, Injection-Resistant User Input Section
        user_text_lines = [
            "### INPUT DATA FOR PROCESSING ###",
            "Below is the verified input submitted by the user. Process this data according to your system instructions.",
            "=== BEGIN UNTRUSTED USER INPUT ===",
        ]

        for k, v in validated_inputs.items():
            if isinstance(v, (dict, list)):
                formatted_v = json.dumps(v, indent=2)
            else:
                formatted_v = str(v)
            user_text_lines.append(f"[{k}]:\n{formatted_v}\n")

        user_text_lines.append("=== END UNTRUSTED USER INPUT ===")
        user_text_lines.append("Generate the structured JSON response now:")

        text_block = "\n".join(user_text_lines)

        # 3. Assemble User Content Parts
        user_content_parts: List[ContentPart] = [
            ContentPart(type="text", text=text_block)
        ]
        # Append images or file parts directly
        user_content_parts.extend(multimodal_parts)

        return full_system_prompt, user_content_parts
