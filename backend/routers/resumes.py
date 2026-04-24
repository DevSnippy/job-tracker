from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
import uuid
from datetime import datetime
from database import get_db, ResumeModel

router = APIRouter()


class ResumeOut(BaseModel):
    id: str
    name: str
    template: str
    updated: str
    size: str
    pages: int
    default: bool
    tags: list[str]
    resume_data: dict

    class Config:
        from_attributes = True


class ResumeUpdate(BaseModel):
    name: Optional[str] = None
    template: Optional[str] = None
    default: Optional[bool] = None
    tags: Optional[list[str]] = None
    resume_data: Optional[dict] = None


@router.get("", response_model=list[ResumeOut])
async def list_resumes(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ResumeModel))
    return result.scalars().all()


@router.get("/{resume_id}", response_model=ResumeOut)
async def get_resume(resume_id: str, db: AsyncSession = Depends(get_db)):
    r = await db.get(ResumeModel, resume_id)
    if not r:
        raise HTTPException(404, "Resume not found")
    return r


@router.post("/upload", response_model=ResumeOut, status_code=201)
async def upload_resume(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    content = await file.read()
    size_kb = len(content) // 1024
    resume = ResumeModel(
        id=f"r{uuid.uuid4().hex[:8]}",
        name=file.filename or "resume.pdf",
        template="Vanguard",
        updated=datetime.now().strftime("%b %d"),
        size=f"{size_kb} KB",
        pages=1,
        default=False,
        tags=["Uploaded"],
        content=content.decode("utf-8", errors="replace")[:50000],
    )
    db.add(resume)
    await db.commit()
    await db.refresh(resume)
    return resume


@router.patch("/{resume_id}", response_model=ResumeOut)
async def update_resume(resume_id: str, body: ResumeUpdate, db: AsyncSession = Depends(get_db)):
    r = await db.get(ResumeModel, resume_id)
    if not r:
        raise HTTPException(404, "Resume not found")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(r, k, v)
    r.updated = datetime.now().strftime("%b %d")
    await db.commit()
    await db.refresh(r)
    return r


@router.delete("/{resume_id}", status_code=204)
async def delete_resume(resume_id: str, db: AsyncSession = Depends(get_db)):
    r = await db.get(ResumeModel, resume_id)
    if not r:
        raise HTTPException(404, "Resume not found")
    await db.delete(r)
    await db.commit()
