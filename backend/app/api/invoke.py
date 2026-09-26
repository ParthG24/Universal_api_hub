import time
import json
import re
import logging
from typing import Optional, Dict, Any, Tuple
from fastapi import APIRouter, Depends, Request, Header, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Connector, RequestLog
from app.core.security import hash_api_key
from app.core.deps import get_optional_admin
from app.providers.registry import provider_registry
from app.services.validator import validate_and_prepare_inputs, ValidationError
from app.services.prompt_engine import PromptBuilder
from app.services.schema_repair import SchemaRepairService, SchemaMismatchError
from app.services.usage_logger import log_invocation
from app.schemas.invoke import InvokeResponse, ErrorDetail, ExecutionMeta

router = APIRouter(prefix="/connectors", tags=["Invocation"])


@router.post("/{slug}/invoke", response_model=InvokeResponse)
async def invoke_connector(
    slug: str,
    request: Request,
    db: Session = Depends(get_db),
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
    admin=Depends(get_optional_admin),
):
    """
    Public invocation endpoint for AI connectors.
    Accepts application/json or multipart/form-data.
    Authenticated via 'X-API-Key' header (or Admin JWT for dashboard test console).
    """
    start_time = time.perf_counter()

    # Step 1: Look up connector by slug
    connector = db.query(Connector).filter(Connector.slug == slug.lower().strip()).first()
    if not connector:
        return JSONResponse(
            status_code=404,
            content={
                "success": False,
                "data": None,
                "error": {
                    "type": "not_found",
                    "message": f"Connector with slug '{slug}' does not exist.",
                },
            },
        )

    if connector.status != "active":
        return JSONResponse(
            status_code=403,
            content={
                "success": False,
                "data": None,
                "error": {
                    "type": "disabled",
                    "message": f"Connector '{slug}' is currently disabled.",
                },
            },
        )

    # Step 2: Validate API key or Admin access
    authenticated = False
    if admin:
        authenticated = True
    elif x_api_key:
        incoming_hash = hash_api_key(x_api_key)
        if incoming_hash == connector.api_key_hash:
            authenticated = True

    if not authenticated:
        log_invocation(
            db=db,
            connector_id=connector.id,
            status="failed",
            response_time_ms=(time.perf_counter() - start_time) * 1000,
            provider=connector.provider,
            model=connector.model,
            error_type="auth_error",
            error_message="Missing or invalid X-API-Key header.",
        )
        return JSONResponse(
            status_code=401,
            content={
                "success": False,
                "data": None,
                "error": {
                    "type": "auth_error",
                    "message": "Invalid or missing API key. Provide a valid 'X-API-Key' header.",
                },
            },
        )

    # Step 3: Parse input body (JSON or multipart/form-data)
    raw_params: Dict[str, Any] = {}
    uploaded_files: Dict[str, Tuple[bytes, str, str]] = {}

    content_type = request.headers.get("content-type", "")
    try:
        if "multipart/form-data" in content_type:
            form = await request.form()
            for key, value in form.items():
                if hasattr(value, "file"):
                    file_bytes = await value.read()
                    uploaded_files[key] = (file_bytes, value.content_type or "application/octet-stream", value.filename or key)
                else:
                    raw_params[key] = value
        elif "application/json" in content_type:
            body = await request.body()
            if body:
                raw_params = json.loads(body.decode("utf-8"))
        else:
            # Try parsing json if present, else form
            body = await request.body()
            if body:
                try:
                    raw_params = json.loads(body.decode("utf-8"))
                except Exception:
                    raw_params = {}
    except Exception as e:
        log_invocation(
            db=db,
            connector_id=connector.id,
            status="failed",
            response_time_ms=(time.perf_counter() - start_time) * 1000,
            provider=connector.provider,
            model=connector.model,
            error_type="validation_error",
            error_message=f"Failed to parse request body: {str(e)}",
            request_data=str(await request.body()),
        )
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "data": None,
                "error": {
                    "type": "validation_error",
                    "message": f"Malformed request body: {str(e)}",
                },
            },
        )

    # Step 4: Validate parameters against connector input field definitions
    try:
        validated_inputs, content_parts = validate_and_prepare_inputs(
            input_fields=connector.input_fields,
            raw_form_or_json=raw_params,
            uploaded_files=uploaded_files,
        )
    except ValidationError as ve:
        elapsed = (time.perf_counter() - start_time) * 1000
        log_invocation(
            db=db,
            connector_id=connector.id,
            status="failed",
            response_time_ms=elapsed,
            provider=connector.provider,
            model=connector.model,
            error_type="validation_error",
            error_message=ve.message,
            request_data=raw_params,
        )
        return JSONResponse(
            status_code=422,
            content={
                "success": False,
                "data": None,
                "error": {
                    "type": "validation_error",
                    "message": ve.message,
                },
            },
        )

    # Step 5: Build final prompt
    system_prompt, user_content = PromptBuilder.build(
        connector=connector,
        validated_inputs=validated_inputs,
        multimodal_parts=content_parts,
    )

    # Step 6: Invoke AI Provider adapter
    provider = provider_registry.get(connector.provider)
    if not provider:
        elapsed = (time.perf_counter() - start_time) * 1000
        log_invocation(
            db=db,
            connector_id=connector.id,
            status="failed",
            response_time_ms=elapsed,
            provider=connector.provider,
            model=connector.model,
            error_type="provider_error",
            error_message=f"Provider '{connector.provider}' is not registered or supported.",
            request_data=validated_inputs,
        )
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "data": None,
                "error": {
                    "type": "provider_error",
                    "message": f"AI provider '{connector.provider}' is not configured.",
                },
            },
        )

    try:
        provider_result = await provider.generate(
            model=connector.model,
            system_prompt=system_prompt,
            user_content=user_content,
            response_schema=connector.output_schema,
        )
    except TimeoutError:
        elapsed = (time.perf_counter() - start_time) * 1000
        log_invocation(
            db=db,
            connector_id=connector.id,
            status="failed",
            response_time_ms=elapsed,
            provider=connector.provider,
            model=connector.model,
            error_type="timeout",
            error_message="AI provider call timed out.",
            request_data=validated_inputs,
        )
        return JSONResponse(
            status_code=504,
            content={
                "success": False,
                "data": None,
                "error": {
                    "type": "timeout",
                    "message": "The AI provider did not respond within the allocated time window.",
                },
            },
        )
    except Exception as e:
        elapsed = (time.perf_counter() - start_time) * 1000
        error_str = str(e)
        logging.getLogger("universal_hub").error(f"Provider invocation error: {error_str}", exc_info=True)
        log_invocation(
            db=db,
            connector_id=connector.id,
            status="failed",
            response_time_ms=elapsed,
            provider=connector.provider,
            model=connector.model,
            error_type="provider_error",
            error_message=error_str,
            request_data=validated_inputs,
        )

        # Sanitize any raw API key from the message returned to clients
        clean_msg = error_str
        if "key=" in clean_msg:
            clean_msg = re.sub(r"key=[a-zA-Z0-9_\-]+", "key=[REDACTED]", clean_msg)
        if "Bearer " in clean_msg:
            clean_msg = re.sub(r"Bearer\s+[a-zA-Z0-9_\-]+", "Bearer [REDACTED]", clean_msg)

        return JSONResponse(
            status_code=502,
            content={
                "success": False,
                "data": None,
                "error": {
                    "type": "provider_error",
                    "message": clean_msg if clean_msg else "An error occurred while contacting the upstream AI provider.",
                },
            },
        )

    # Step 7: Parse, repair, and validate output JSON against schema
    try:
        parsed_json = SchemaRepairService.clean_and_parse_json(provider_result.raw_text)
        normalized_data = SchemaRepairService.validate_and_normalize(
            parsed_data=parsed_json,
            expected_schema=connector.output_schema,
        )
    except SchemaMismatchError as sme:
        elapsed = (time.perf_counter() - start_time) * 1000
        log_invocation(
            db=db,
            connector_id=connector.id,
            status="failed",
            response_time_ms=elapsed,
            provider=connector.provider,
            model=connector.model,
            input_tokens=provider_result.input_tokens,
            output_tokens=provider_result.output_tokens,
            total_tokens=provider_result.total_tokens,
            estimated_cost=provider_result.estimated_cost,
            error_type="schema_mismatch",
            error_message=sme.message,
            request_data=validated_inputs,
            response_data=provider_result.raw_text,
        )
        return JSONResponse(
            status_code=502,
            content={
                "success": False,
                "data": None,
                "error": {
                    "type": "schema_mismatch",
                    "message": "AI provider output could not be parsed into the expected JSON structure.",
                },
            },
        )

    total_latency = (time.perf_counter() - start_time) * 1000

    # Step 8: Log successful invocation
    log_invocation(
        db=db,
        connector_id=connector.id,
        status="success",
        response_time_ms=total_latency,
        provider=connector.provider,
        model=connector.model,
        input_tokens=provider_result.input_tokens,
        output_tokens=provider_result.output_tokens,
        total_tokens=provider_result.total_tokens,
        estimated_cost=provider_result.estimated_cost,
        request_data=validated_inputs,
        response_data=normalized_data,
    )

    return InvokeResponse(
        success=True,
        data=normalized_data,
        error=None,
        meta=ExecutionMeta(
            latency_ms=round(total_latency, 2),
            tokens=provider_result.total_tokens,
            estimated_cost=provider_result.estimated_cost,
            provider=connector.provider,
            model=connector.model,
        ),
    )
