from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from pydantic import BaseModel
from typing import Optional
import httpx
import uuid
import re
from database import get_db, JobModel

router = APIRouter()


class JobCreate(BaseModel):
    company: str
    role: str
    loc: str = ""
    type: str = "Full-time"
    remote: str = "Hybrid"
    source: str = "manual"
    stack: list[str] = []
    url: str = ""
    description: str = ""


class JobUpdate(BaseModel):
    status: Optional[str] = None
    stage: Optional[int] = None
    notes: Optional[str] = None
    ats_score: Optional[int] = None


class JobOut(BaseModel):
    id: str
    company: str
    role: str
    loc: str
    type: str
    remote: str
    posted: str
    source: str
    stack: list[str]
    stage: int
    status: str
    logo: str
    color: str
    ats_score: int
    url: str
    description: str
    notes: str

    class Config:
        from_attributes = True


COMPANY_COLORS = {
    "wiz": "#5B5FEF", "monday": "#FF3D57", "lightricks": "#111111",
    "fiverr": "#1DBF73", "riskified": "#0A2540", "taboola": "#0066FF",
    "gong": "#8039DF", "papaya": "#FF6B35", "wix": "#0C6EFC",
    "deel": "#0F4C3A", "rapyd": "#4318FF",
}


def _logo_color(company: str):
    key = company.lower().split()[0]
    color = COMPANY_COLORS.get(key, "#555")
    logo = company[0].upper()
    return logo, color


@router.get("", response_model=list[JobOut])
async def list_jobs(
    q: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(JobModel)
    if q:
        stmt = stmt.where(
            or_(
                JobModel.company.ilike(f"%{q}%"),
                JobModel.role.ilike(f"%{q}%"),
                JobModel.loc.ilike(f"%{q}%"),
            )
        )
    if status and status != "all":
        stmt = stmt.where(JobModel.status == status)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{job_id}", response_model=JobOut)
async def get_job(job_id: str, db: AsyncSession = Depends(get_db)):
    job = await db.get(JobModel, job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    return job


@router.post("", response_model=JobOut, status_code=201)
async def create_job(body: JobCreate, db: AsyncSession = Depends(get_db)):
    logo, color = _logo_color(body.company)
    job = JobModel(
        id=f"TM-{uuid.uuid4().hex[:6].upper()}",
        logo=logo,
        color=color,
        posted="just now",
        **body.model_dump(),
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)
    return job


@router.patch("/{job_id}", response_model=JobOut)
async def update_job(job_id: str, body: JobUpdate, db: AsyncSession = Depends(get_db)):
    job = await db.get(JobModel, job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(job, k, v)
    await db.commit()
    await db.refresh(job)
    return job


@router.delete("/{job_id}", status_code=204)
async def delete_job(job_id: str, db: AsyncSession = Depends(get_db)):
    job = await db.get(JobModel, job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    await db.delete(job)
    await db.commit()


@router.post("/fetch-url")
async def fetch_job_url(body: dict):
    url = body.get("url", "")
    if not url:
        raise HTTPException(400, "url required")
    try:
        async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
            resp = await client.get(url, headers={"User-Agent": "Mozilla/5.0"})
        html = resp.text
        title_m = re.search(r"<title[^>]*>([^<]+)</title>", html, re.I)
        title = title_m.group(1).strip() if title_m else ""
        text = re.sub(r"<[^>]+>", " ", html)
        text = re.sub(r"\s+", " ", text).strip()[:8000]
        return {"url": url, "title": title, "text": text, "ok": True}
    except Exception as e:
        raise HTTPException(502, f"Failed to fetch URL: {e}")
