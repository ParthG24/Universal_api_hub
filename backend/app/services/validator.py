import json
import base64
import re
from typing import Dict, Any, List, Tuple
from app.db.models import InputField
from app.providers.base import ContentPart

# Allowed image MIME types and default maximum file sizes (5MB)
ALLOWED_IMAGE_MIMES = {"image/png", "image/jpeg", "image/jpg", "image/webp"}
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB


class ValidationError(Exception):
    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


def validate_and_prepare_inputs(
    input_fields: List[InputField],
    raw_form_or_json: Dict[str, Any],
    uploaded_files: Dict[str, Tuple[bytes, str, str]] = None,
) -> Tuple[Dict[str, Any], List[ContentPart]]:
    """
    Validates submitted values and file uploads against configured InputField definitions.
    Returns:
        (validated_dict, list_of_content_parts_for_ai)
    Raises:
        ValidationError if any field is invalid or missing.
    """
    if uploaded_files is None:
        uploaded_files = {}

    validated_data: Dict[str, Any] = {}
    content_parts: List[ContentPart] = []

    for field in input_fields:
        name = field.name
        rules = field.validation_rules or {}
        val = raw_form_or_json.get(name)

        # 1. Image / File handling
        if field.field_type in ("image", "file"):
            file_tuple = uploaded_files.get(name)
            
            # Check if sent as base64 string in JSON body instead of multipart
            if not file_tuple and isinstance(val, str) and val.startswith("data:"):
                try:
                    header, b64data = val.split(",", 1)
                    mime = header.split(";")[0].replace("data:", "")
                    file_bytes = base64.b64decode(b64data)
                    file_tuple = (file_bytes, mime, f"{name}.bin")
                except Exception:
                    raise ValidationError(f"Field '{name}' contains invalid base64 data URI.")

            if not file_tuple:
                if field.required:
                    raise ValidationError(f"Field '{name}' of type {field.field_type} is required.")
                continue

            file_bytes, mime_type, filename = file_tuple
            max_size = rules.get("max_size_bytes", MAX_FILE_SIZE_BYTES)
            if len(file_bytes) > max_size:
                raise ValidationError(f"File for field '{name}' exceeds size limit of {max_size // (1024*1024)}MB.")

            if field.field_type == "image":
                allowed = set(rules.get("allowed_mime_types", ALLOWED_IMAGE_MIMES))
                if mime_type.lower() not in allowed:
                    raise ValidationError(f"Image '{name}' has unsupported MIME type '{mime_type}'. Allowed: {', '.join(allowed)}.")
                
                b64 = base64.b64encode(file_bytes).decode("utf-8")
                content_parts.append(ContentPart(
                    type="image",
                    data_base64=b64,
                    mime_type=mime_type,
                    filename=filename,
                ))
                validated_data[name] = f"[Image: {filename} ({len(file_bytes)} bytes)]"
            else:
                b64 = base64.b64encode(file_bytes).decode("utf-8")
                content_parts.append(ContentPart(
                    type="file",
                    data_base64=b64,
                    mime_type=mime_type,
                    filename=filename,
                ))
                validated_data[name] = f"[File: {filename} ({len(file_bytes)} bytes)]"
            continue

        # 2. Text, Number, Boolean, JSON fields
        if val is None or val == "":
            if field.default_value is not None and field.default_value != "":
                val = field.default_value
            elif field.required:
                raise ValidationError(f"Field '{name}' is required.")
            else:
                validated_data[name] = None
                continue

        # Validate based on type
        if field.field_type == "text":
            text_val = str(val).strip()
            max_len = rules.get("max_length", 20000)
            min_len = rules.get("min_length", 0)
            if len(text_val) < min_len:
                raise ValidationError(f"Field '{name}' must be at least {min_len} characters.")
            if len(text_val) > max_len:
                raise ValidationError(f"Field '{name}' exceeds max length of {max_len} characters.")
            if "regex" in rules:
                if not re.search(rules["regex"], text_val):
                    raise ValidationError(f"Field '{name}' does not match required pattern.")
            validated_data[name] = text_val

        elif field.field_type == "number":
            try:
                num_val = float(val) if "." in str(val) else int(val)
            except (ValueError, TypeError):
                raise ValidationError(f"Field '{name}' must be a valid number.")
            if "min" in rules and num_val < rules["min"]:
                raise ValidationError(f"Field '{name}' cannot be less than {rules['min']}.")
            if "max" in rules and num_val > rules["max"]:
                raise ValidationError(f"Field '{name}' cannot be greater than {rules['max']}.")
            validated_data[name] = num_val

        elif field.field_type == "boolean":
            if isinstance(val, bool):
                bool_val = val
            elif str(val).lower() in ("true", "1", "yes", "on"):
                bool_val = True
            elif str(val).lower() in ("false", "0", "no", "off"):
                bool_val = False
            else:
                raise ValidationError(f"Field '{name}' must be a boolean (true/false).")
            validated_data[name] = bool_val

        elif field.field_type == "json":
            if isinstance(val, (dict, list)):
                json_val = val
            else:
                try:
                    json_val = json.loads(str(val))
                except Exception:
                    raise ValidationError(f"Field '{name}' is not valid JSON.")
            validated_data[name] = json_val

        else:
            validated_data[name] = str(val)

    return validated_data, content_parts
