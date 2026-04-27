from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from pydantic import BaseModel
from typing import Optional
import asyncio
import colorsys
import csv
import html as html_lib
import io
import httpx
import uuid
import re
from playwright.async_api import async_playwright
from database import get_db, SessionLocal, JobModel, UserModel

TECHMAP_RAW = "https://raw.githubusercontent.com/mluggy/techmap/main"
TECHMAP_CATEGORIES = [
    "admin", "business", "data-science", "design", "devops", "finance",
    "frontend", "hardware", "hr", "legal", "marketing",
    "procurement-operations", "product", "project-management", "qa",
    "sales", "security", "software", "support",
]

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


class JobSummary(BaseModel):
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
    notes: str

    class Config:
        from_attributes = True


class JobOut(JobSummary):
    description: str


def _logo_color(company: str) -> tuple[str, str]:
    key = company.lower().strip()
    hue = sum(ord(c) * (i + 1) for i, c in enumerate(key)) % 360
    r, g, b = colorsys.hls_to_rgb(hue / 360, 0.40, 0.62)
    color = f"#{int(r * 255):02x}{int(g * 255):02x}{int(b * 255):02x}"
    return company[0].upper(), color


_COMPOUND_VARIANTS = [
    (re.compile(r'full[\s\-]?stack', re.I), ['full stack', 'full-stack', 'fullstack']),
    (re.compile(r'front[\s\-]?end', re.I),  ['front end', 'front-end', 'frontend']),
    (re.compile(r'back[\s\-]?end', re.I),   ['back end', 'back-end', 'backend']),
]

def _extract_text(html: str) -> str:
    """Convert HTML to structured plain text, preserving line breaks for block elements."""
    html = re.sub(r"<(style|script)[^>]*>.*?</\1>", " ", html, flags=re.S | re.I)
    # Block-level elements become newlines so _clean_job_text can split on them
    html = re.sub(r"<(p|br|li|h[1-6]|div|section|tr)[^>]*/?>", "\n", html, flags=re.I)
    text = re.sub(r"<[^>]+>", " ", html)
    text = html_lib.unescape(text)
    text = text.replace("\xa0", " ")
    text = re.sub(r"\{\{[^}]*\}\}", " ", text)
    text = re.sub(r"%[A-Z_]{3,}%", " ", text)
    text = re.sub(r"-->", " ", text)
    # Normalise spaces within each line, but keep newlines
    lines = [re.sub(r" +", " ", l).strip() for l in text.splitlines()]
    return "\n".join(l for l in lines if l)


# Single-line nav/chrome items to discard unconditionally
_NAV_LINE = re.compile(
    r"^(all jobs?|website|apply|back to|terms|cookie|share|refer a friend|"
    r"follow us|powered by|get notified|equal opportunity|employee only|"
    r"apply for this job|apply as an employee|know anyone who might|"
    r"interested in this position)$",
    re.I,
)

# Lines that end the job content (footer / apply section)
_STOP_LINE = re.compile(
    r"apply (for this job|now|here|as an employee)|refer a friend|"
    r"interested in this position|know anyone who might|"
    r"terms\s*[&·]\s*polic|equal opportunity|powered by|"
    r"share this (job|position|role)|get job alerts?",
    re.I,
)

# Keywords that signal where real content begins
_CONTENT_START = re.compile(
    r"\b(description|responsibilities|requirements?|qualifications?|"
    r"about (the |this )?(role|position|job|company|team)|"
    r"experience|skills?|benefits?|what you|you.ll|why (join|us)|"
    r"we.re looking|the role|who (we are|you are))\b",
    re.I,
)

# Error / unavailable page signals
_ERROR_PAGE = re.compile(
    r"an error occured|no open positions|currently no open positions|"
    r"we don.t have any open positions|position is no longer available|"
    r"job (is|has been) (closed|filled|removed)",
    re.I,
)


def _clean_job_text(raw: str) -> str:
    """Extract job-relevant content from raw page text.

    1. Split into lines, strip obvious single-line nav items.
    2. Truncate at footer stop markers (only after 400 chars — ignores
       header CTAs like the "Apply" button near the top).
    3. Skip leading metadata (job title, location, type) by finding the
       first line that either looks like a section header or is a long
       paragraph.
    """
    lines = [l.strip() for l in raw.splitlines() if l.strip()]

    # Remove obvious nav/chrome lines regardless of position
    lines = [l for l in lines if not _NAV_LINE.match(l)]

    # Truncate at footer stop markers, ignoring ones in the first 400 chars
    chars_seen = 0
    stop_idx = len(lines)
    for i, line in enumerate(lines):
        chars_seen += len(line)
        if chars_seen > 400 and _STOP_LINE.search(line):
            stop_idx = i
            break
    lines = lines[:stop_idx]

    # Find where real content begins: first long line (>80 chars) or a
    # line containing a recognised content keyword
    start = 0
    for i, line in enumerate(lines):
        if len(line) > 80 or _CONTENT_START.search(line):
            start = i
            break

    result = "\n".join(lines[start:]).strip()
    return result[:8000] if result else ""


def _is_valid_description(text: str) -> bool:
    if len(text) < 150:
        return False
    if _ERROR_PAGE.search(text):
        return False
    return True


async def _fetch_description(url: str) -> str:
    """Fetch job description, falling back to Playwright for JS-rendered pages."""
    headers = {"User-Agent": "Mozilla/5.0"}

    # Fast path — static HTML
    try:
        async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
            resp = await client.get(url, headers=headers)
        raw = _extract_text(resp.text)
        if raw.count("{{") < 3:
            text = _clean_job_text(raw)
            if _is_valid_description(text):
                return text
    except Exception:
        pass

    # Playwright — renders JS, then extracts the description container
    try:
        async with async_playwright() as pw:
            browser = await pw.chromium.launch(headless=True)
            page = await browser.new_page()
            await page.goto(url, wait_until="networkidle", timeout=15000)
            raw = await page.evaluate("""() => {
                // ATS-specific description containers (most specific first)
                const ats = [
                    // Lever
                    '.posting-description', '.posting-body',
                    // Greenhouse
                    '#content', '.job-post-body', '.section-body',
                    // Comeet
                    '.co-description', '.position-description',
                    // Breezy
                    '.job-description',
                    // SmartRecruiters
                    '.job-ad-display', '.job-sections',
                    // Teamtailor / generic
                    '.job-detail-description', '.job-content',
                    '[data-automation="jobAdDescription"]',
                    // Semantic fallback
                    'main', 'article', '[role="main"]',
                ];
                for (const sel of ats) {
                    const el = document.querySelector(sel);
                    if (el && el.innerText.trim().length > 200) {
                        return el.innerText.trim();
                    }
                }
                // Last resort: remove chrome elements, return body
                ['nav','header','footer','[role="navigation"]',
                 '.breadcrumb','.apply-section','.cookie-banner',
                 '[class*="apply"]','[class*="share"]','[class*="social"]']
                    .forEach(s => document.querySelectorAll(s)
                        .forEach(e => e.remove()));
                return document.body.innerText;
            }""")
            await browser.close()
        text = _clean_job_text(raw)
        return text if _is_valid_description(text) else ""
    except Exception:
        return ""


def _title_variants(title: str) -> list[str]:
    """Expand a title into all compound-word forms so "full-stack", "fullstack",
    "full stack", "frontend", "front-end", "back end", etc. all match each other."""
    variants: set[str] = {title}
    for pattern, forms in _COMPOUND_VARIANTS:
        for v in list(variants):
            if pattern.search(v):
                for form in forms:
                    variants.add(pattern.sub(form, v))
    return list(variants)


@router.get("", response_model=list[JobSummary])
async def list_jobs(
    q: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    discover: bool = Query(False),
    tracked: bool = Query(False),
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
    if tracked:
        # Only show jobs the user explicitly engaged with: manually added,
        # moved to a non-default stage, or changed status from the default.
        stmt = stmt.where(
            or_(
                JobModel.source == "manual",
                JobModel.stage > 0,
                JobModel.status != "saved",
            )
        )
    if discover:
        user = await db.get(UserModel, "me")
        titles = (user.interested_titles or []) if user else []
        if titles:
            conditions = []
            for t in titles:
                for v in _title_variants(t):
                    conditions.append(JobModel.role.ilike(f"%{v}%"))
            stmt = stmt.where(or_(*conditions))
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{job_id}", response_model=JobOut)
async def get_job(job_id: str, db: AsyncSession = Depends(get_db)):
    job = await db.get(JobModel, job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    if not job.description and job.url:
        text = await _fetch_description(job.url)
        if text:
            job.description = text
            await db.commit()
            await db.refresh(job)
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


async def sync_techmap_jobs() -> int:
    """Fetch all jobs from techmap pre-compiled CSV files and upsert into local DB.
    Returns the number of new jobs added."""

    async def fetch_csv(client: httpx.AsyncClient, category: str) -> list[dict]:
        try:
            r = await client.get(f"{TECHMAP_RAW}/jobs/{category}.csv")
            if r.status_code != 200:
                return []
            text = r.text.lstrip("﻿")  # strip BOM
            reader = csv.DictReader(io.StringIO(text))
            out = []
            for row in reader:
                url = row.get("url", "").strip()
                if not url:
                    continue
                city = row.get("city", "").strip()
                title = row.get("title", "").strip()
                out.append({
                    "company": row.get("company", "").strip(),
                    "role": title,
                    "loc": city,
                    "type": "Full-time",
                    "remote": "Remote" if "remote" in city.lower() or "remote" in title.lower() else "Hybrid",
                    "source": "techmap",
                    "stack": [row.get("category", "").strip()] if row.get("category") else [],
                    "url": url,
                    "description": "",
                    "posted": row.get("updated", "").strip(),
                })
            return out
        except Exception:
            return []

    async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
        results = await asyncio.gather(*[fetch_csv(client, cat) for cat in TECHMAP_CATEGORIES])

    raw_jobs: list[dict] = []
    for batch in results:
        raw_jobs.extend(batch)

    async with SessionLocal() as db:
        existing_result = await db.execute(select(JobModel.url))
        existing_urls = {row[0] for row in existing_result.all()}

        added = 0
        for jd in raw_jobs:
            if jd["url"] in existing_urls:
                continue
            logo, color = _logo_color(jd["company"])
            db.add(JobModel(
                id=f"TM-{uuid.uuid4().hex[:6].upper()}",
                logo=logo,
                color=color,
                stage=0,
                status="saved",
                ats_score=0,
                notes="",
                **jd,
            ))
            existing_urls.add(jd["url"])
            added += 1

        if added:
            await db.commit()

    return added


@router.post("/fetch-url")
async def fetch_job_url(body: dict):
    url = body.get("url", "")
    if not url:
        raise HTTPException(400, "url required")
    try:
        async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
            resp = await client.get(url, headers={"User-Agent": "Mozilla/5.0"})
        title_m = re.search(r"<title[^>]*>([^<]+)</title>", resp.text, re.I)
        title = title_m.group(1).strip() if title_m else ""
        text = await _fetch_description(url)
        return {"url": url, "title": title, "text": text, "ok": True}
    except Exception as e:
        raise HTTPException(502, f"Failed to fetch URL: {e}")
