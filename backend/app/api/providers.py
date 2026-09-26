from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Admin, ProviderModelCache
from app.core.deps import get_current_admin
from app.providers.registry import provider_registry
from app.providers.base import ModelInfo

router = APIRouter(prefix="/admin/providers", tags=["Admin Providers"])


@router.get("", response_model=List[Dict[str, Any]])
async def list_providers(admin: Admin = Depends(get_current_admin)):
    """Returns all supported AI providers and their configuration status."""
    return provider_registry.list_available_providers()


@router.get("/{name}/models", response_model=List[ModelInfo])
async def list_models(
    name: str,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    """Returns available models for the given provider."""
    provider = provider_registry.get(name)
    if not provider:
        raise HTTPException(status_code=404, detail=f"Provider '{name}' not found.")

    try:
        models = await provider.list_models()
        return models
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list models: {str(e)}")


@router.post("/{name}/refresh-models", response_model=List[ModelInfo])
async def refresh_models(
    name: str,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    """Forces a refresh of available models directly from the provider API and caches results."""
    provider = provider_registry.get(name)
    if not provider:
        raise HTTPException(status_code=404, detail=f"Provider '{name}' not found.")

    try:
        models = await provider.list_models()
        # Update cache in DB
        db.query(ProviderModelCache).filter(ProviderModelCache.provider == name).delete()
        for m in models:
            cache_entry = ProviderModelCache(
                provider=name,
                model_id=m.id,
                model_label=m.name,
                capabilities=m.capabilities,
            )
            db.add(cache_entry)
        db.commit()
        return models
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to refresh models: {str(e)}")
