from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.database import get_db
from app.db.models import Admin, Connector, InputField, RequestLog
from app.core.deps import get_current_admin
from app.core.security import generate_api_key, hash_api_key
from app.schemas.connector import (
    ConnectorCreate,
    ConnectorUpdate,
    ConnectorResponse,
    ConnectorSummaryResponse,
    ConnectorKeyResponse,
)
from app.schemas.stats import ConnectorStatsResponse, RequestLogRow

router = APIRouter(prefix="/admin/connectors", tags=["Admin Connectors"])


@router.post("", response_model=ConnectorKeyResponse, status_code=status.HTTP_201_CREATED)
async def create_connector(
    payload: ConnectorCreate,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    """
    Creates a new AI connector.
    Generates a secure API key that is shown ONLY ONCE upon creation.
    """
    existing = db.query(Connector).filter(Connector.slug == payload.slug).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A connector with slug '{payload.slug}' already exists.",
        )

    # Generate raw API key and hash it for storage
    raw_api_key = generate_api_key(prefix=f"uah_{payload.slug[:8]}_")
    key_hash = hash_api_key(raw_api_key)

    connector = Connector(
        slug=payload.slug,
        name=payload.name,
        description=payload.description,
        provider=payload.provider,
        model=payload.model,
        system_prompt=payload.system_prompt,
        output_schema=payload.output_schema or {},
        status=payload.status,
        api_key_hash=key_hash,
    )
    db.add(connector)
    db.flush()

    # Create associated input fields
    for idx, f in enumerate(payload.input_fields):
        field_model = InputField(
            connector_id=connector.id,
            name=f.name,
            field_type=f.field_type,
            required=f.required,
            description=f.description,
            default_value=f.default_value,
            validation_rules=f.validation_rules or {},
            order=f.order if f.order is not None else idx,
        )
        db.add(field_model)

    db.commit()
    db.refresh(connector)

    return ConnectorKeyResponse(
        connector_id=connector.id,
        slug=connector.slug,
        name=connector.name,
        api_key=raw_api_key,
        message="Connector created successfully. Save this API key now; it cannot be shown again.",
    )


@router.get("", response_model=List[ConnectorSummaryResponse])
async def list_connectors(
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    """Lists all connectors with aggregate performance metrics."""
    connectors = db.query(Connector).order_by(Connector.created_at.desc()).all()
    results = []

    for c in connectors:
        logs = db.query(RequestLog).filter(RequestLog.connector_id == c.id)
        total_reqs = logs.count()
        success_reqs = logs.filter(RequestLog.status == "success").count()
        last_log = logs.order_by(RequestLog.request_timestamp.desc()).first()

        rate = (success_reqs / total_reqs * 100.0) if total_reqs > 0 else 100.0
        field_names = [f.name for f in c.input_fields]

        results.append(ConnectorSummaryResponse(
            id=c.id,
            slug=c.slug,
            name=c.name,
            description=c.description,
            provider=c.provider,
            model=c.model,
            status=c.status,
            total_requests=total_reqs,
            success_rate=round(rate, 1),
            last_used=last_log.request_timestamp if last_log else None,
            created_at=c.created_at,
            updated_at=c.updated_at,
            input_fields_summary=field_names,
        ))

    return results


@router.get("/{id}", response_model=ConnectorResponse)
async def get_connector(
    id: int,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    """Retrieves full connector configuration including input fields."""
    connector = db.query(Connector).filter(Connector.id == id).first()
    if not connector:
        raise HTTPException(status_code=404, detail="Connector not found.")
    return connector


@router.put("/{id}", response_model=ConnectorResponse)
async def update_connector(
    id: int,
    payload: ConnectorUpdate,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    """Updates connector settings and modifies or replaces input fields."""
    connector = db.query(Connector).filter(Connector.id == id).first()
    if not connector:
        raise HTTPException(status_code=404, detail="Connector not found.")

    if payload.name is not None:
        connector.name = payload.name
    if payload.description is not None:
        connector.description = payload.description
    if payload.provider is not None:
        connector.provider = payload.provider
    if payload.model is not None:
        connector.model = payload.model
    if payload.system_prompt is not None:
        connector.system_prompt = payload.system_prompt
    if payload.output_schema is not None:
        connector.output_schema = payload.output_schema
    if payload.status is not None:
        connector.status = payload.status

    if payload.input_fields is not None:
        # Replace input fields
        db.query(InputField).filter(InputField.connector_id == id).delete()
        for idx, f in enumerate(payload.input_fields):
            new_f = InputField(
                connector_id=id,
                name=f.name,
                field_type=f.field_type,
                required=f.required,
                description=f.description,
                default_value=f.default_value,
                validation_rules=f.validation_rules or {},
                order=f.order if f.order is not None else idx,
            )
            db.add(new_f)

    db.commit()
    db.refresh(connector)
    return connector


@router.patch("/{id}/status")
async def toggle_status(
    id: int,
    status: str,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    """Activates or disables a connector."""
    if status not in ("active", "disabled"):
        raise HTTPException(status_code=400, detail="Status must be 'active' or 'disabled'.")
    connector = db.query(Connector).filter(Connector.id == id).first()
    if not connector:
        raise HTTPException(status_code=404, detail="Connector not found.")
    connector.status = status
    db.commit()
    return {"message": f"Connector status updated to '{status}'.", "status": status}


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_connector(
    id: int,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    """Permanently deletes a connector and associated logs and fields."""
    connector = db.query(Connector).filter(Connector.id == id).first()
    if not connector:
        raise HTTPException(status_code=404, detail="Connector not found.")
    db.delete(connector)
    db.commit()
    return None


@router.post("/{id}/regenerate-key", response_model=ConnectorKeyResponse)
async def regenerate_api_key(
    id: int,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    """Rotates the external API key for this connector. The previous key is immediately invalidated."""
    connector = db.query(Connector).filter(Connector.id == id).first()
    if not connector:
        raise HTTPException(status_code=404, detail="Connector not found.")

    new_raw_key = generate_api_key(prefix=f"uah_{connector.slug[:8]}_")
    connector.api_key_hash = hash_api_key(new_raw_key)
    db.commit()

    return ConnectorKeyResponse(
        connector_id=connector.id,
        slug=connector.slug,
        name=connector.name,
        api_key=new_raw_key,
        message="API key rotated successfully. Store this new key securely.",
    )


@router.get("/{id}/stats", response_model=ConnectorStatsResponse)
async def get_connector_stats(
    id: int,
    limit: int = 50,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    """Returns comprehensive usage statistics and recent execution logs for a connector."""
    connector = db.query(Connector).filter(Connector.id == id).first()
    if not connector:
        raise HTTPException(status_code=404, detail="Connector not found.")

    logs_query = db.query(RequestLog).filter(RequestLog.connector_id == id)
    total_reqs = logs_query.count()
    success_reqs = logs_query.filter(RequestLog.status == "success").count()
    failed_reqs = logs_query.filter(RequestLog.status == "failed").count()

    avg_time = db.query(func.avg(RequestLog.response_time_ms)).filter(RequestLog.connector_id == id).scalar() or 0.0
    tot_tokens = db.query(func.sum(RequestLog.total_tokens)).filter(RequestLog.connector_id == id).scalar() or 0
    tot_cost = db.query(func.sum(RequestLog.estimated_cost)).filter(RequestLog.connector_id == id).scalar() or 0.0

    first_log = logs_query.order_by(RequestLog.request_timestamp.asc()).first()
    last_log = logs_query.order_by(RequestLog.request_timestamp.desc()).first()

    recent_logs = (
        logs_query.order_by(RequestLog.request_timestamp.desc())
        .limit(limit)
        .all()
    )

    success_rate = (success_reqs / total_reqs * 100.0) if total_reqs > 0 else 100.0

    return ConnectorStatsResponse(
        connector_id=connector.id,
        slug=connector.slug,
        name=connector.name,
        total_requests=total_reqs,
        successful_requests=success_reqs,
        failed_requests=failed_reqs,
        success_rate_percent=round(success_rate, 1),
        average_response_time_ms=round(float(avg_time), 2),
        total_tokens=int(tot_tokens),
        estimated_total_cost=round(float(tot_cost), 6),
        first_used=first_log.request_timestamp if first_log else None,
        last_used=last_log.request_timestamp if last_log else None,
        recent_logs=[RequestLogRow.model_validate(log) for log in recent_logs],
    )
