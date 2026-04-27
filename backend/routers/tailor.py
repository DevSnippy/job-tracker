from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import anthropic
import json
import re
import os

router = APIRouter()

MODEL = "claude-haiku-4-5-20251001"

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY", ""))

SYSTEM_PROMPT = """You are an expert resume tailoring assistant.

CRITICAL RULES — follow these without exception:
1. NEVER invent, fabricate, or assume any experience, skill, company, date, achievement, or number.
2. Only use information explicitly present in the candidate's profile, resume data, or uploaded resume text.
3. You may reorder, reframe, and reword existing content to better match the job description.
4. You may surface keywords from the job description that genuinely appear in the candidate's background.
5. If a required skill or experience is NOT in the candidate's data, do NOT add it — list it as a gap instead.
6. Preserve all company names, dates, and job titles exactly as provided.
7. Return raw JSON only — no markdown, no code fences, no explanation."""


def _build_candidate_context(user_profile: dict, resume_data: dict, resume_content: str) -> str:
    """Assemble everything we know about the candidate into one grounded context block."""
    parts = []

    if user_profile:
        simple = ["CANDIDATE PROFILE:"]
        for k in ("name", "email", "headline", "location"):
            v = user_profile.get(k, "")
            if v:
                simple.append(f"  {k.replace('_', ' ').title()}: {v}")
        if user_profile.get("summary"):
            simple.append(f"  Summary: {user_profile['summary']}")
        if user_profile.get("skills"):
            skills = user_profile["skills"]
            if isinstance(skills, list):
                simple.append(f"  Skills: {', '.join(skills)}")
        parts.append("\n".join(simple))

        exp = user_profile.get("experience", [])
        if exp and isinstance(exp, list):
            lines = ["CANDIDATE EXPERIENCE (from profile — treat as authoritative):"]
            for e in exp:
                lines.append(f"  {e.get('role', '')} at {e.get('company', '')} ({e.get('when', '')})")
                for b in (e.get("bullets") or []):
                    if str(b).strip():
                        lines.append(f"    • {b}")
            parts.append("\n".join(lines))

    if resume_data and any(v for v in resume_data.values() if v):
        parts.append(f"STRUCTURED RESUME DATA:\n{json.dumps(resume_data, indent=2, ensure_ascii=False)}")

    if resume_content and resume_content.strip():
        parts.append(f"UPLOADED RESUME TEXT:\n{resume_content[:8000]}")

    return "\n\n".join(parts) if parts else "No candidate data provided."


def _extract_json(text: str) -> dict:
    """Parse JSON from model output, tolerating markdown code fences."""
    # Strip ```json ... ``` or ``` ... ``` wrappers
    text = re.sub(r"^```(?:json)?\s*", "", text.strip(), flags=re.I)
    text = re.sub(r"\s*```$", "", text.strip())
    # Find the first {...} block in case there's surrounding prose
    m = re.search(r"\{[\s\S]*\}", text)
    if m:
        text = m.group(0)
    return json.loads(text)


class TailorRequest(BaseModel):
    job_description: str
    resume_data: dict = {}
    clarifications: dict = {}
    user_profile: dict = {}
    resume_content: str = ""


class AnalyzeRequest(BaseModel):
    job_description: str
    resume_data: dict = {}
    user_profile: dict = {}
    resume_content: str = ""


@router.post("/analyze")
async def analyze_jd(body: AnalyzeRequest):
    """Extract requirements from a job description."""
    try:
        candidate = _build_candidate_context(body.user_profile, body.resume_data, body.resume_content)
        response = client.messages.create(
            model=MODEL,
            max_tokens=1024,
            system=SYSTEM_PROMPT,
            messages=[{
                "role": "user",
                "content": f"""Analyze this job description against the candidate's actual background.

JOB DESCRIPTION:
{body.job_description[:4000]}

{candidate}

Return a JSON object with exactly these keys:
{{
  "title": "job title from JD",
  "company": "company name from JD",
  "requirements": ["actual requirement from JD"],
  "nice_to_have": ["nice-to-have from JD"],
  "keywords": ["ATS keyword from JD"],
  "ats_gaps": ["skill or experience the JD requires that is NOT found in the candidate's data above"]
}}

For ats_gaps: only list things genuinely absent from the candidate's provided data. Do not guess.
Return raw JSON only — no markdown, no code fences, no explanation."""
            }]
        )
        text = next(b.text for b in response.content if b.type == "text")
        return _extract_json(text)
    except (json.JSONDecodeError, StopIteration, ValueError) as e:
        raise HTTPException(422, f"Failed to parse JD analysis: {e}")
    except anthropic.APIError as e:
        raise HTTPException(502, f"AI service error: {e}")


@router.post("/tailor")
async def tailor_resume(body: TailorRequest):
    """Tailor a resume to a job description and return the result as a stream."""

    candidate = _build_candidate_context(body.user_profile, body.resume_data, body.resume_content)
    clarifications_text = ""
    if body.clarifications:
        clarifications_text = "\n\nCANDIDATE NOTES (their own words — use to add context, never to invent):\n" + "\n".join(
            f"- {k}: {v}" for k, v in body.clarifications.items() if v
        )

    prompt = f"""Tailor this candidate's resume for the job description below.
Only rewrite and reframe what is already in their data. Do not invent anything.

JOB DESCRIPTION:
{body.job_description[:3000]}

{candidate}
{clarifications_text}

Return the tailored resume as JSON with these keys (use the same structure as the structured resume data if present):
name, title, email, phone, location, summary, experience (array of role/company/loc/when/bullets), skills (array), ats_score (0-100), changes (array of short descriptions of what changed).

Rewrite summary and bullets to highlight relevant experience for this role.
Reorder skills so the most relevant appear first.
Keep all company names, job titles, and dates exactly as provided.
Return raw JSON only — no markdown, no code fences, no explanation."""

    async def generate():
        with client.messages.stream(
            model=MODEL,
            max_tokens=2048,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}],
        ) as stream:
            for text_chunk in stream.text_stream:
                yield f"data: {json.dumps({'chunk': text_chunk})}\n\n"
            final = stream.get_final_message()
            full_text = next(
                (b.text for b in final.content if b.type == "text"), ""
            )
            try:
                result = _extract_json(full_text)
                yield f"data: {json.dumps({'done': True, 'result': result})}\n\n"
            except (json.JSONDecodeError, ValueError):
                yield f"data: {json.dumps({'done': True, 'result': {'error': 'parse_failed', 'raw': full_text[:500]}})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


@router.post("/sync")
async def tailor_resume_sync(body: TailorRequest):
    """Non-streaming tailor endpoint for simpler clients."""
    candidate = _build_candidate_context(body.user_profile, body.resume_data, body.resume_content)
    clarifications_text = ""
    if body.clarifications:
        clarifications_text = "\n\nCANDIDATE NOTES (their own words — use to add context, never to invent):\n" + "\n".join(
            f"- {k}: {v}" for k, v in body.clarifications.items() if v
        )

    prompt = f"""Tailor this candidate's resume for the job description below.
Only rewrite and reframe what is already in their data. Do not invent anything.

JOB DESCRIPTION:
{body.job_description[:3000]}

{candidate}
{clarifications_text}

Return the tailored resume as JSON with these keys:
name, title, email, phone, location, summary, experience (array of role/company/loc/when/bullets), skills (array), ats_score (0-100), changes (array of short descriptions of what changed).

Rewrite summary and bullets to highlight relevant experience for this role.
Reorder skills so the most relevant appear first.
Keep all company names, job titles, and dates exactly as provided.
Return raw JSON only — no markdown, no code fences, no explanation."""

    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=2048,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}],
        )
        text = next(b.text for b in response.content if b.type == "text")
        return _extract_json(text)
    except (json.JSONDecodeError, StopIteration, ValueError) as e:
        raise HTTPException(422, f"Failed to parse tailored resume: {e}")
    except anthropic.APIError as e:
        raise HTTPException(502, f"AI service error: {e}")
