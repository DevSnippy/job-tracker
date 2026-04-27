from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional
import anthropic
import json
import io
import os
import re
from database import get_db, UserModel

router = APIRouter()

USER_ID = "me"

_ai = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY", ""))
_MODEL = "claude-haiku-4-5-20251001"


class UserOut(BaseModel):
    name: str
    email: str
    phone: str = ""
    headline: str
    location: str
    interested_titles: list[str]
    preferred_levels: list[str] = []
    preferred_tracks: list[str] = []
    summary: str = ""
    experience: list[dict] = []
    education: list[dict] = []
    skills: list[str] = []
    linkedin_url: str = ""
    website_url: str = ""
    portfolio_url: str = ""
    cover_letter: str = ""

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    headline: Optional[str] = None
    location: Optional[str] = None
    interested_titles: Optional[list[str]] = None
    preferred_levels: Optional[list[str]] = None
    preferred_tracks: Optional[list[str]] = None
    summary: Optional[str] = None
    experience: Optional[list[dict]] = None
    education: Optional[list[dict]] = None
    skills: Optional[list[str]] = None
    linkedin_url: Optional[str] = None
    website_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    cover_letter: Optional[str] = None


async def _get_or_create(db: AsyncSession) -> UserModel:
    user = await db.get(UserModel, USER_ID)
    if not user:
        user = UserModel(id=USER_ID)
        db.add(user)
        await db.commit()
        await db.refresh(user)
    return user


def _extract_text(content: bytes, filename: str) -> str:
    name = (filename or "").lower()
    if name.endswith(".pdf"):
        try:
            from pdfminer.high_level import extract_text
            text = extract_text(io.BytesIO(content))
            if text and text.strip():
                return text[:12000]
        except Exception:
            pass
    if name.endswith(".docx"):
        try:
            import docx as _docx
            doc = _docx.Document(io.BytesIO(content))
            text = "\n".join(p.text for p in doc.paragraphs if p.text.strip())
            if text.strip():
                return text[:12000]
        except Exception:
            pass
    return content.decode("utf-8", errors="replace")[:12000]


def _extract_json(text: str) -> dict:
    text = re.sub(r"^```(?:json)?\s*", "", text.strip(), flags=re.I)
    text = re.sub(r"\s*```$", "", text.strip())
    m = re.search(r"\{[\s\S]*\}", text)
    if m:
        text = m.group(0)
    return json.loads(text)


@router.get("", response_model=UserOut)
async def get_user(db: AsyncSession = Depends(get_db)):
    return await _get_or_create(db)


@router.patch("", response_model=UserOut)
async def update_user(body: UserUpdate, db: AsyncSession = Depends(get_db)):
    user = await _get_or_create(db)
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(user, k, v)
    await db.commit()
    await db.refresh(user)
    return user


@router.post("/parse-resume", response_model=UserOut)
async def parse_resume(file: UploadFile = File(...)):
    """Extract profile data from an uploaded resume using Claude."""
    raw = await file.read()
    text = _extract_text(raw, file.filename or "")
    if not text.strip():
        raise HTTPException(400, "Could not extract text from file")

    try:
        resp = _ai.messages.create(
            model=_MODEL,
            max_tokens=2048,
            system=(
                "You extract structured profile data from resume text. "
                "Return ONLY raw JSON — no markdown, no code fences. "
                "Never invent data not present in the resume."
            ),
            messages=[{
                "role": "user",
                "content": f"""Extract all available information from this resume.

RESUME TEXT:
{text}

Return a JSON object with exactly these keys (omit or leave empty if not found):
{{
  "name": "full name",
  "email": "email address",
  "phone": "phone number",
  "headline": "current job title or professional headline",
  "location": "city / country",
  "summary": "professional summary paragraph (copy verbatim if present, otherwise leave empty string)",
  "skills": ["skill1", "skill2"],
  "experience": [
    {{
      "role": "job title",
      "company": "company name",
      "loc": "city",
      "when": "start – end dates exactly as written",
      "bullets": ["responsibility or achievement verbatim from resume"]
    }}
  ],
  "education": [
    {{
      "degree": "degree or qualification",
      "school": "institution name",
      "loc": "city",
      "when": "start – end dates exactly as written"
    }}
  ]
}}

Copy all values verbatim from the resume. Do not paraphrase or invent.""",
            }],
        )
        data = _extract_json(resp.content[0].text)
    except (json.JSONDecodeError, ValueError, IndexError) as e:
        raise HTTPException(422, f"Failed to parse resume: {e}")
    except anthropic.APIError as e:
        raise HTTPException(502, f"AI service error: {e}")

    # Return as UserOut shape so the frontend can merge it directly
    return UserOut(
        name=data.get("name", ""),
        email=data.get("email", ""),
        phone=data.get("phone", ""),
        headline=data.get("headline", ""),
        location=data.get("location", ""),
        interested_titles=[],
        summary=data.get("summary", ""),
        skills=data.get("skills", []),
        experience=data.get("experience", []),
        education=data.get("education", []),
    )
