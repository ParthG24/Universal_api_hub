import json
from typing import Dict, Any, List
from app.db.models import Connector
from app.schemas.docs import ConnectorDocResponse, DocParam


def generate_connector_docs(connector: Connector, base_api_url: str = "") -> ConnectorDocResponse:
    """
    Generates rich, accurate documentation directly from live connector configuration.
    Never drifts from the real input and output schema.
    """
    endpoint_url = f"{base_api_url.rstrip('/')}/api/connectors/{connector.slug}/invoke"
    
    # Determine content type based on presence of image/file input fields
    has_files = any(f.field_type in ("image", "file") for f in connector.input_fields)
    content_type = "multipart/form-data" if has_files else "application/json"

    # Build parameters list
    params: List[DocParam] = []
    example_request: Dict[str, Any] = {}

    for f in sorted(connector.input_fields, key=lambda x: x.order):
        params.append(DocParam(
            name=f.name,
            type=f.field_type,
            required=f.required,
            description=f.description or f"Input parameter for {f.name}",
            default_value=f.default_value,
            validation_rules=f.validation_rules or {},
        ))

        # Generate realistic sample value
        if f.field_type == "text":
            example_request[f.name] = f.default_value or "Sample text input"
        elif f.field_type == "number":
            example_request[f.name] = float(f.default_value) if f.default_value else 100
        elif f.field_type == "boolean":
            example_request[f.name] = True
        elif f.field_type == "image":
            example_request[f.name] = "(binary image upload: .png/.jpg)"
        elif f.field_type == "file":
            example_request[f.name] = "(binary document upload: .pdf/.txt)"
        elif f.field_type == "json":
            example_request[f.name] = {"key": "value"}

    # Generate sample success response matching connector output_schema
    sample_data: Dict[str, Any] = {}
    if isinstance(connector.output_schema, dict):
        for k, v in connector.output_schema.items():
            type_str = str(v).lower()
            if "int" in type_str or "number" in type_str:
                sample_data[k] = 42
            elif "bool" in type_str:
                sample_data[k] = True
            elif "list" in type_str:
                sample_data[k] = ["sample_item"]
            elif "dict" in type_str:
                sample_data[k] = {"property": "value"}
            else:
                sample_data[k] = f"Sample {k} result"
    else:
        sample_data = {"result": "success"}

    example_success = {
        "success": True,
        "data": sample_data,
        "error": None,
        "meta": {
            "latency_ms": 320.5,
            "tokens": 285,
            "estimated_cost": 0.000185,
            "provider": connector.provider,
            "model": connector.model,
        }
    }

    # Standard error responses for each error type
    example_errors = {
        "auth_error": {
            "success": False,
            "data": None,
            "error": {
                "type": "auth_error",
                "message": "Invalid or missing X-API-Key header.",
            }
        },
        "validation_error": {
            "success": False,
            "data": None,
            "error": {
                "type": "validation_error",
                "message": "Field 'image' of type image is required.",
            }
        },
        "schema_mismatch": {
            "success": False,
            "data": None,
            "error": {
                "type": "schema_mismatch",
                "message": "AI output could not be parsed into expected JSON structure.",
            }
        },
        "timeout": {
            "success": False,
            "data": None,
            "error": {
                "type": "timeout",
                "message": "The AI provider did not respond within the allocated time.",
            }
        },
        "provider_error": {
            "success": False,
            "data": None,
            "error": {
                "type": "provider_error",
                "message": "Upstream AI provider error occurred.",
            }
        },
    }

    # Generate cURL command
    if has_files:
        curl_fields = []
        for p in params:
            if p.type in ("image", "file"):
                curl_fields.append(f'  -F "{p.name}=@/path/to/sample.{ "png" if p.type == "image" else "pdf" }" \\')
            else:
                val = example_request.get(p.name, "value")
                curl_fields.append(f'  -F "{p.name}={val}" \\')
        curl_fields_str = "\n".join(curl_fields)
        curl_cmd = (
            f"curl -X POST \"{endpoint_url}\" \\\n"
            f"  -H \"X-API-Key: YOUR_API_KEY\" \\\n"
            f"{curl_fields_str}\n"
        ).rstrip(" \\\n")
    else:
        req_json_str = json.dumps(example_request, indent=2)
        curl_cmd = (
            f"curl -X POST \"{endpoint_url}\" \\\n"
            f"  -H \"Content-Type: application/json\" \\\n"
            f"  -H \"X-API-Key: YOUR_API_KEY\" \\\n"
            f"  -d '{req_json_str}'"
        )

    # Generate Python snippet
    if has_files:
        python_snippet = f"""import requests

url = "{endpoint_url}"
headers = {{"X-API-Key": "YOUR_API_KEY"}}
files = {{
    "image": open("sample.jpg", "rb")
}}
data = {{
    # Add any text or number parameters here
}}

response = requests.post(url, headers=headers, files=files, data=data)
result = response.json()
print("Success:", result["success"])
print("Data:", result["data"])
"""
    else:
        python_snippet = f"""import requests

url = "{endpoint_url}"
headers = {{
    "Content-Type": "application/json",
    "X-API-Key": "YOUR_API_KEY"
}}
payload = {json.dumps(example_request, indent=4)}

response = requests.post(url, headers=headers, json=payload)
result = response.json()
print("Success:", result["success"])
print("Data:", result["data"])
"""

    # Generate JavaScript snippet
    if has_files:
        javascript_snippet = f"""const formData = new FormData();
// In browser or Node.js (with fetch):
formData.append("image", fileInput.files[0]);

const response = await fetch("{endpoint_url}", {{
  method: "POST",
  headers: {{
    "X-API-Key": "YOUR_API_KEY",
  }},
  body: formData,
}});

const result = await response.json();
console.log(result.data);
"""
    else:
        javascript_snippet = f"""const response = await fetch("{endpoint_url}", {{
  method: "POST",
  headers: {{
    "Content-Type": "application/json",
    "X-API-Key": "YOUR_API_KEY",
  }},
  body: JSON.stringify({json.dumps(example_request, indent=4)}),
}});

const result = await response.json();
console.log(result.data);
"""

    return ConnectorDocResponse(
        slug=connector.slug,
        name=connector.name,
        description=connector.description or "Configured AI Connector endpoint.",
        endpoint_url=endpoint_url,
        http_method="POST",
        content_type=content_type,
        auth_header="X-API-Key: <YOUR_CONNECTOR_API_KEY>",
        provider=connector.provider,
        model=connector.model,
        parameters=params,
        output_schema=connector.output_schema or {},
        example_request_json=example_request if not has_files else None,
        example_success_response=example_success,
        example_error_responses=example_errors,
        curl_snippet=curl_cmd,
        python_snippet=python_snippet,
        javascript_snippet=javascript_snippet,
    )
