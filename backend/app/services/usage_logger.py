import sys
import json
import logging
from datetime import datetime
from typing import Optional, Any
from sqlalchemy.orm import Session
from app.db.models import RequestLog

logger = logging.getLogger("usage_logger")


def log_invocation(
    db: Session,
    connector_id: int,
    status: str,
    response_time_ms: float,
    provider: str,
    model: str,
    input_tokens: int = 0,
    output_tokens: int = 0,
    total_tokens: int = 0,
    estimated_cost: float = 0.0,
    error_type: Optional[str] = None,
    error_message: Optional[str] = None,
    request_data: Optional[Any] = None,
    response_data: Optional[Any] = None,
) -> Optional[RequestLog]:
    """
    Persists invocation statistics and metadata to the database safely.
    Catches all exceptions to guarantee that logging issues never fail the client response.
    """
    try:
        # Prepare safe truncated preview of request
        req_preview = ""
        if request_data:
            if isinstance(request_data, dict):
                # Clean out any large base64 strings
                clean_req = {}
                for k, v in request_data.items():
                    s = str(v)
                    if len(s) > 200:
                        clean_req[k] = s[:200] + "... [truncated]"
                    else:
                        clean_req[k] = v
                req_preview = json.dumps(clean_req)[:1000]
            else:
                req_preview = str(request_data)[:1000]

        # Prepare safe truncated preview of response
        resp_preview = ""
        if response_data:
            resp_preview = json.dumps(response_data)[:1000] if isinstance(response_data, (dict, list)) else str(response_data)[:1000]

        log_entry = RequestLog(
            connector_id=connector_id,
            status=status,
            request_timestamp=datetime.utcnow(),
            response_time_ms=round(response_time_ms, 2),
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            total_tokens=total_tokens or (input_tokens + output_tokens),
            estimated_cost=round(estimated_cost, 6),
            provider=provider,
            model=model,
            error_type=error_type,
            error_message=error_message[:500] if error_message else None,
            request_preview=req_preview,
            response_preview=resp_preview,
        )

        db.add(log_entry)
        db.commit()
        db.refresh(log_entry)
        return log_entry
    except Exception as e:
        db.rollback()
        # Non-fatal: write to stderr only
        sys.stderr.write(f"[WARN] Failed to write RequestLog to database: {str(e)}\n")
        return None
