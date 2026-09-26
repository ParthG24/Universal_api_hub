from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Connector, RequestLog
from app.services.doc_generator import generate_connector_docs
from app.schemas.docs import ConnectorDocResponse
from app.schemas.connector import ConnectorResponse, ConnectorSummaryResponse

router = APIRouter(prefix="/connectors", tags=["Documentation & Public Connectors"])


@router.get("/public", response_model=List[ConnectorSummaryResponse])
async def list_public_connectors(db: Session = Depends(get_db)):
    """
    Public listing of active connectors.
    Allows evaluators to discover and test connectors without an account (Section 16).
    """
    connectors = db.query(Connector).filter(Connector.status == "active").order_by(Connector.created_at.desc()).all()
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


@router.get("/public/{slug_or_id}", response_model=ConnectorResponse)
async def get_public_connector(slug_or_id: str, db: Session = Depends(get_db)):
    """
    Public connector inspection endpoint for evaluation testing without login.
    Fulfills Section 16 of assignment specification.
    """
    clean_id = slug_or_id.strip()
    if clean_id.isdigit():
        connector = db.query(Connector).filter(Connector.id == int(clean_id)).first()
    else:
        connector = db.query(Connector).filter(Connector.slug == clean_id.lower()).first()

    if not connector:
        raise HTTPException(status_code=404, detail=f"Connector '{slug_or_id}' not found.")
    return connector


@router.get("/{slug}/docs", response_model=ConnectorDocResponse)
async def get_connector_documentation(
    slug: str,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Public API endpoint returning structured, auto-generated documentation for a connector.
    Does not require authentication.
    """
    connector = db.query(Connector).filter(Connector.slug == slug.lower().strip()).first()
    if not connector:
        raise HTTPException(status_code=404, detail=f"Connector with slug '{slug}' not found.")

    base_url = str(request.base_url).rstrip("/")
    docs = generate_connector_docs(connector, base_api_url=base_url)
    return docs
