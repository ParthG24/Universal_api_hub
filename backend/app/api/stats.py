from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.database import get_db
from app.db.models import Admin, Connector, RequestLog
from app.core.deps import get_current_admin
from app.schemas.stats import GlobalStatsResponse
from app.providers.registry import provider_registry

router = APIRouter(prefix="/admin/stats", tags=["Admin Stats"])


@router.get("/global", response_model=GlobalStatsResponse)
async def get_global_stats(
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    """Returns global platform-wide statistics for the admin dashboard."""
    total_conn = db.query(Connector).count()
    active_conn = db.query(Connector).filter(Connector.status == "active").count()

    total_reqs = db.query(RequestLog).count()
    success_reqs = db.query(RequestLog).filter(RequestLog.status == "success").count()
    failed_reqs = db.query(RequestLog).filter(RequestLog.status == "failed").count()

    tot_cost = db.query(func.sum(RequestLog.estimated_cost)).scalar() or 0.0
    global_rate = (success_reqs / total_reqs * 100.0) if total_reqs > 0 else 100.0

    configured_providers = [
        p["name"] for p in provider_registry.list_available_providers() if p["configured"]
    ]

    return GlobalStatsResponse(
        total_connectors=total_conn,
        active_connectors=active_conn,
        total_requests=total_reqs,
        successful_requests=success_reqs,
        failed_requests=failed_reqs,
        global_success_rate=round(global_rate, 1),
        total_estimated_cost=round(float(tot_cost), 6),
        providers_configured=configured_providers,
    )
