import ast
import json
import re
from typing import Any, Dict, Optional, Tuple


class SchemaMismatchError(Exception):
    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


class SchemaRepairService:
    """
    Cleans, extracts, and repairs raw LLM text into verified JSON matching the expected schema.
    Uses regex sanitization, JSON parsing, and AST (Abstract Syntax Tree) literal evaluation.
    """

    @classmethod
    def clean_and_parse_json(cls, raw_text: str) -> Any:
        """Strips markdown code blocks, preamble, and postscript text to parse JSON."""
        if not raw_text or not raw_text.strip():
            raise SchemaMismatchError("AI provider returned an empty response.")

        text = raw_text.strip()

        # Step 1: Remove markdown code fences ```json ... ``` or ``` ... ```
        fence_match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text, re.IGNORECASE)
        if fence_match:
            text = fence_match.group(1).strip()

        # Step 2: Try direct parse
        try:
            return json.loads(text)
        except Exception:
            pass

        # Step 3: Find outermost { ... } or [ ... ]
        first_curly = text.find("{")
        last_curly = text.rfind("}")
        if first_curly != -1 and last_curly != -1 and last_curly > first_curly:
            candidate = text[first_curly : last_curly + 1]
            try:
                return json.loads(candidate)
            except Exception:
                # Attempt minor syntax repair: remove trailing commas before closing braces/brackets
                repaired = re.sub(r",\s*([\]}])", r"\1", candidate)
                try:
                    return json.loads(repaired)
                except Exception:
                    pass
                # AST Fallback: safely parse Python literal syntax (e.g. single quotes, True/False/None)
                try:
                    parsed_ast = ast.literal_eval(repaired)
                    if isinstance(parsed_ast, (dict, list)):
                        return parsed_ast
                except Exception:
                    pass

        first_bracket = text.find("[")
        last_bracket = text.rfind("]")
        if first_bracket != -1 and last_bracket != -1 and last_bracket > first_bracket:
            candidate = text[first_bracket : last_bracket + 1]
            try:
                return json.loads(candidate)
            except Exception:
                repaired = re.sub(r",\s*([\]}])", r"\1", candidate)
                try:
                    return json.loads(repaired)
                except Exception:
                    pass
                try:
                    parsed_ast = ast.literal_eval(repaired)
                    if isinstance(parsed_ast, (dict, list)):
                        return parsed_ast
                except Exception:
                    pass

        raise SchemaMismatchError(f"Could not parse valid JSON from AI output: {raw_text[:200]}")

    @classmethod
    def validate_and_normalize(cls, parsed_data: Any, expected_schema: Dict[str, Any]) -> Any:
        """
        Normalizes parsed data against the configured expected schema.
        Ensures keys exist or provides reasonable fallbacks.
        """
        if not expected_schema:
            return parsed_data

        # If expected schema is an object definition
        if isinstance(expected_schema, dict) and isinstance(parsed_data, dict):
            # Check if this is a JSON-schema format (with "properties")
            if "properties" in expected_schema and isinstance(expected_schema["properties"], dict):
                prop_defs = expected_schema["properties"]
            else:
                # Direct key-value mapping like {"name": "string", "company": "string"}
                prop_defs = expected_schema

            normalized = {}
            for expected_key, expected_type in prop_defs.items():
                if expected_key in parsed_data:
                    normalized[expected_key] = parsed_data[expected_key]
                else:
                    # Provide type-based default
                    type_str = str(expected_type).lower()
                    if "int" in type_str or "number" in type_str:
                        normalized[expected_key] = 0
                    elif "bool" in type_str:
                        normalized[expected_key] = False
                    elif "list" in type_str or "array" in type_str:
                        normalized[expected_key] = []
                    elif "dict" in type_str or "object" in type_str:
                        normalized[expected_key] = {}
                    else:
                        normalized[expected_key] = ""

            # Also carry over any extra keys provided by the model
            for k, v in parsed_data.items():
                if k not in normalized:
                    normalized[k] = v

            return normalized

        return parsed_data
