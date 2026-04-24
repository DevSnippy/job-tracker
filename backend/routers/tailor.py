from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import anthropic
import json
import os

router = APIRouter()

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY", ""))

SYSTEM_PROMPT = """You are an expert resume tailoring assistant. Your job is to analyze job descriptions and tailor resumes to maximize ATS match scores and highlight relevant experience.

When tailoring a resume:
1. Match keywords from the job description naturally
2. Reorder and reframe experience to emphasize relevance
3. Quantify achievements where possible
4. Preserve the candidate's authentic voice
5. Keep changes factually accurate

Always return structured JSON with the tailored resume data."""


class TailorRequest(BaseModel):
    job_description: str
    resume_data: dict
    clarifications: dict = {}


class AnalyzeRequest(BaseModel):
    job_description: str
    resume_data: dict


@router.post("/analyze")
async def analyze_jd(body: AnalyzeRequest):
    """Extract requirements from a job description."""
    try:
        response = client.messages.create(
            model="claude-haiku-4-5",
            max_tokens=1024,
            system=SYSTEM_PROMPT,
            messages=[{
                "role": "user",
                "content": f"""Analyze this job description and extract key requirements.

JOB DESCRIPTION:
{body.job_description[:4000]}

Return JSON with:
{{
  "title": "job title",
  "company": "company name",
  "requirements": ["req1", "req2", ...],
  "nice_to_have": ["nice1", ...],
  "keywords": ["kw1", "kw2", ...],
  "ats_gaps": ["gap1", ...]
}}

Return only the JSON, no other text."""
            }]
        )
        text = next(b.text for b in response.content if b.type == "text")
        return json.loads(text)
    except json.JSONDecodeError:
        raise HTTPException(422, "Failed to parse JD analysis")
    except anthropic.APIError as e:
        raise HTTPException(502, f"AI service error: {e}")


@router.post("/tailor")
async def tailor_resume(body: TailorRequest):
    """Tailor a resume to a job description and return the result as a stream."""

    clarifications_text = ""
    if body.clarifications:
        clarifications_text = "\n\nUSER CLARIFICATIONS:\n" + "\n".join(
            f"- {k}: {v}" for k, v in body.clarifications.items()
        )

    prompt = f"""Tailor this resume for the job description below.

JOB DESCRIPTION:
{body.job_description[:3000]}

CURRENT RESUME:
{json.dumps(body.resume_data, indent=2)[:3000]}
{clarifications_text}

Return the tailored resume as JSON matching the exact same structure as the input resume, with:
- Summary updated to match the role
- Experience bullets rewritten to highlight relevant skills
- Skills reordered with most relevant first

Also include an "ats_score" field (0-100) and "changes" array listing what was changed.

Return only valid JSON."""

    async def generate():
        with client.messages.stream(
            model="claude-haiku-4-5",
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
                result = json.loads(full_text)
                yield f"data: {json.dumps({'done': True, 'result': result})}\n\n"
            except json.JSONDecodeError:
                yield f"data: {json.dumps({'done': True, 'result': {'error': 'parse_failed', 'raw': full_text[:500]}})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


@router.post("/tailor/sync")
async def tailor_resume_sync(body: TailorRequest):
    """Non-streaming tailor endpoint for simpler clients."""
    clarifications_text = ""
    if body.clarifications:
        clarifications_text = "\n\nUSER CLARIFICATIONS:\n" + "\n".join(
            f"- {k}: {v}" for k, v in body.clarifications.items()
        )

    prompt = f"""Tailor this resume for the job description below.

JOB DESCRIPTION:
{body.job_description[:3000]}

CURRENT RESUME:
{json.dumps(body.resume_data, indent=2)[:3000]}
{clarifications_text}

Return the tailored resume as JSON with the same structure plus "ats_score" (0-100) and "changes" array.
Return only valid JSON."""

    try:
        response = client.messages.create(
            model="claude-haiku-4-5",
            max_tokens=2048,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}],
        )
        text = next(b.text for b in response.content if b.type == "text")
        return json.loads(text)
    except json.JSONDecodeError:
        raise HTTPException(422, "Failed to parse tailored resume")
    except anthropic.APIError as e:
        raise HTTPException(502, f"AI service error: {e}")
