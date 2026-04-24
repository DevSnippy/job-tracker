from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
import httpx
import uuid
from datetime import datetime
from database import get_db, WebhookModel

router = APIRouter()


class WebhookCreate(BaseModel):
    name: str
    url: str
    events: list[str] = []
    active: bool = True


class WebhookUpdate(BaseModel):
    name: Optional[str] = None
    url: Optional[str] = None
    events: Optional[list[str]] = None
    active: Optional[bool] = None


class WebhookOut(BaseModel):
    id: str
    name: str
    url: str
    events: list[str]
    active: bool
    last_fired: str
    status: str

    class Config:
        from_attributes = True


@router.get("", response_model=list[WebhookOut])
async def list_webhooks(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WebhookModel))
    return result.scalars().all()


@router.get("/{webhook_id}", response_model=WebhookOut)
async def get_webhook(webhook_id: str, db: AsyncSession = Depends(get_db)):
    wh = await db.get(WebhookModel, webhook_id)
    if not wh:
        raise HTTPException(404, "Webhook not found")
    return wh


@router.post("", response_model=WebhookOut, status_code=201)
async def create_webhook(body: WebhookCreate, db: AsyncSession = Depends(get_db)):
    wh = WebhookModel(
        id=f"wh-{uuid.uuid4().hex[:8]}",
        **body.model_dump(),
    )
    db.add(wh)
    await db.commit()
    await db.refresh(wh)
    return wh


@router.patch("/{webhook_id}", response_model=WebhookOut)
async def update_webhook(webhook_id: str, body: WebhookUpdate, db: AsyncSession = Depends(get_db)):
    wh = await db.get(WebhookModel, webhook_id)
    if not wh:
        raise HTTPException(404, "Webhook not found")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(wh, k, v)
    await db.commit()
    await db.refresh(wh)
    return wh


@router.delete("/{webhook_id}", status_code=204)
async def delete_webhook(webhook_id: str, db: AsyncSession = Depends(get_db)):
    wh = await db.get(WebhookModel, webhook_id)
    if not wh:
        raise HTTPException(404, "Webhook not found")
    await db.delete(wh)
    await db.commit()


@router.post("/test/{webhook_id}", response_model=WebhookOut)
async def test_webhook(webhook_id: str, db: AsyncSession = Depends(get_db)):
    wh = await db.get(WebhookModel, webhook_id)
    if not wh:
        raise HTTPException(404, "Webhook not found")

    payload = {
        "event": "test",
        "timestamp": datetime.utcnow().isoformat(),
        "data": {"message": "Test webhook from Job Tracker"},
    }

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(wh.url, json=payload)
        wh.status = "active" if resp.status_code < 400 else "error"
    except Exception:
        wh.status = "error"

    wh.last_fired = datetime.now().strftime("%b %d, %H:%M")
    await db.commit()
    await db.refresh(wh)
    return wh


async def fire_webhook(db: AsyncSession, event: str, data: dict):
    """Fire all active webhooks subscribed to the given event."""
    result = await db.execute(
        select(WebhookModel).where(WebhookModel.active == True)
    )
    webhooks = result.scalars().all()

    payload = {
        "event": event,
        "timestamp": datetime.utcnow().isoformat(),
        "data": data,
    }

    async with httpx.AsyncClient(timeout=5) as client:
        for wh in webhooks:
            if event in wh.events or "all" in wh.events:
                try:
                    await client.post(wh.url, json=payload)
                    wh.status = "active"
                except Exception:
                    wh.status = "error"
                wh.last_fired = datetime.now().strftime("%b %d, %H:%M")

    await db.commit()
