import asyncio
import base64
import json
import os
import re
import uuid

import anthropic
from fastapi import APIRouter
from fastapi.responses import Response, StreamingResponse
from playwright.async_api import async_playwright
from pydantic import BaseModel

router = APIRouter()

_ai = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY", ""))
_MODEL = "claude-haiku-4-5-20251001"

# In-memory browser sessions keyed by session_id (single-user local app)
_sessions: dict[str, dict] = {}


class StartRequest(BaseModel):
    url: str
    user_profile: dict = {}
    resume_data: dict = {}
    resume_html: str = ""
    resume_pdf_name: str = "Resume"


class ExportPDFRequest(BaseModel):
    html: str
    filename: str = "Resume"


class PersonalizeRequest(BaseModel):
    template: str
    company: str
    role: str
    candidate_name: str
    candidate_profile: dict = {}


def _evt(data: dict) -> str:
    return f"data: {json.dumps(data)}\n\n"


def _profile_text(up: dict, rd: dict) -> str:
    lines = []
    for key, label in [("name", "Name"), ("email", "Email"), ("phone", "Phone"), ("location", "Location")]:
        v = up.get(key) or rd.get(key, "")
        if v:
            lines.append(f"{label}: {v}")
    headline = up.get("headline") or rd.get("title", "")
    if headline:
        lines.append(f"Title: {headline}")
    skills = up.get("skills") or rd.get("skills", [])
    if skills:
        lines.append(f"Skills: {', '.join(skills[:10])}")
    exp = up.get("experience") or rd.get("experience", [])
    if exp:
        e = exp[0]
        lines.append(f"Most recent role: {e.get('role', '')} at {e.get('company', '')} ({e.get('when', '')})")
    edu = up.get("education") or rd.get("education", [])
    if edu:
        e = edu[0]
        lines.append(f"Education: {e.get('degree', '')} — {e.get('school', '')}")
    levels = up.get("preferred_levels", [])
    tracks = up.get("preferred_tracks", [])
    if levels or tracks:
        lines.append(f"Looking for: {', '.join(levels + tracks)} role")
    for key, label in [("linkedin_url", "LinkedIn"), ("website_url", "Website"), ("portfolio_url", "Portfolio")]:
        v = up.get(key, "")
        if v:
            lines.append(f"{label}: {v}")
    cover = up.get("cover_letter", "")
    if cover:
        lines.append(f"Cover letter:\n{cover[:1500]}")
    return "\n".join(lines)


async def _screenshot_b64(page) -> str:
    img = await page.screenshot(type="png", full_page=False)
    return "data:image/png;base64," + base64.b64encode(img).decode()


async def _analyze_form(page, profile_text: str) -> dict:
    """Ask Claude to read the page and return field-fill instructions."""
    form_html = await page.evaluate("""() => {
        const candidates = ['form', '[role="form"]', '.application-form', '#apply-form',
                            '.job-apply', '[data-automation="apply"]', 'main', 'article'];
        for (const sel of candidates) {
            const el = document.querySelector(sel);
            if (el && el.innerHTML.length > 200) {
                return el.innerHTML.substring(0, 7000);
            }
        }
        return document.body.innerHTML.substring(0, 7000);
    }""")

    resp = _ai.messages.create(
        model=_MODEL,
        max_tokens=1500,
        system="""You help fill job application forms. Given form HTML and a candidate profile, return fill instructions.

Return ONLY raw JSON (no markdown):
{
  "has_form": true or false,
  "obstacle": "login required / captcha / no form / empty string if none",
  "fields": [
    {
      "label": "human-readable field name",
      "selector": "specific CSS selector using id, name, type, or placeholder attributes",
      "value": "value to fill from the candidate data (empty string for file type)",
      "type": "text|email|tel|textarea|select|file"
    }
  ],
  "submit_selector": "CSS selector for the submit/apply button",
  "submit_text": "exact text on the submit button"
}

For file upload inputs (resume, CV, portfolio attachments): set type to "file", label to "resume" or "cover_letter" or "portfolio", value to "".
Use specific selectors like input[name='email'], input[type='tel'], textarea[name='cover_letter'].
Only include fields you can map to the candidate's actual data.""",
        messages=[{
            "role": "user",
            "content": f"CANDIDATE PROFILE:\n{profile_text}\n\nFORM HTML:\n{form_html}"
        }]
    )

    text = resp.content[0].text
    m = re.search(r'\{[\s\S]*\}', text)
    if m:
        try:
            return json.loads(m.group(0))
        except Exception:
            pass
    return {"has_form": False, "fields": [], "obstacle": "Could not parse form structure", "submit_selector": ""}


@router.post("/export-pdf")
async def export_pdf(body: ExportPDFRequest):
    pw_mgr = async_playwright()
    pw = await pw_mgr.__aenter__()
    browser = await pw.chromium.launch(headless=True)
    try:
        page = await browser.new_page()
        await page.set_content(body.html, wait_until="load")
        pdf_bytes = await page.pdf(format="Letter", print_background=True)
        safe = body.filename if body.filename.endswith(".pdf") else f"{body.filename}.pdf"
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{safe}"'},
        )
    finally:
        await browser.close()
        await pw_mgr.__aexit__(None, None, None)


@router.post("/personalize-letter")
async def personalize_letter(body: PersonalizeRequest):
    exp = body.candidate_profile.get("experience", [])
    years_hint = ""
    if exp:
        years_hint = f"Most recent role: {exp[0].get('role', '')} at {exp[0].get('company', '')} ({exp[0].get('when', '')})"

    resp = _ai.messages.create(
        model=_MODEL,
        max_tokens=800,
        system="You fill in cover letter templates with real data. Return ONLY the finished letter text — no explanation, no markdown.",
        messages=[{
            "role": "user",
            "content": f"""Fill in this cover letter template for a real job application.

Job: {body.role} at {body.company}
Candidate name: {body.candidate_name}
{years_hint}
Skills: {', '.join(body.candidate_profile.get('skills', [])[:8])}

Template:
{body.template}

Replace every placeholder like [Company], [role], [Hiring Manager's Name], [X years], [unique selling point], etc. with appropriate values. Use "Hiring Manager" if no name is known. Keep the letter professional and concise. Return ONLY the letter.""",
        }],
    )
    return {"letter": resp.content[0].text}


@router.post("/start")
async def start_apply(body: StartRequest):
    session_id = uuid.uuid4().hex

    async def run():
        pw_mgr = None
        pw = None
        browser = None
        try:
            yield _evt({"type": "log", "msg": "Launching browser…"})
            pw_mgr = async_playwright()
            pw = await pw_mgr.__aenter__()
            browser = await pw.chromium.launch(headless=True)
            context = await browser.new_context(
                viewport={"width": 1280, "height": 900},
                user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0",
            )
            page = await context.new_page()

            yield _evt({"type": "log", "msg": f"Navigating to job posting…"})
            try:
                await page.goto(body.url, wait_until="networkidle", timeout=20000)
            except Exception:
                await page.goto(body.url, wait_until="domcontentloaded", timeout=15000)

            await asyncio.sleep(1)
            title = await page.title()
            yield _evt({"type": "log", "msg": f"Loaded: {title[:70]}"})
            yield _evt({"type": "screenshot", "data": await _screenshot_b64(page)})

            # Try to find and click an Apply button (only if not already on a form)
            for pattern in [r"Apply Now", r"Apply for this (job|position|role)", r"Easy Apply", r"Quick Apply", r"^Apply$"]:
                for role in ["button", "link"]:
                    try:
                        el = page.get_by_role(role, name=re.compile(pattern, re.I)).first  # type: ignore[arg-type]
                        if await el.is_visible(timeout=800):
                            yield _evt({"type": "log", "msg": f"Clicking apply button…"})
                            await el.click()
                            try:
                                await page.wait_for_load_state("networkidle", timeout=6000)
                            except Exception:
                                await asyncio.sleep(2)
                            yield _evt({"type": "screenshot", "data": await _screenshot_b64(page)})
                            break
                    except Exception:
                        pass
                else:
                    continue
                break

            yield _evt({"type": "log", "msg": "Analyzing form…"})
            profile_text = _profile_text(body.user_profile, body.resume_data)
            actions = await _analyze_form(page, profile_text)

            if not actions.get("has_form"):
                obstacle = actions.get("obstacle") or "No application form found on this page."
                yield _evt({"type": "error", "msg": obstacle})
                await browser.close()
                await pw_mgr.__aexit__(None, None, None)
                return

            if actions.get("obstacle"):
                yield _evt({"type": "log", "msg": f"⚠️  {actions['obstacle']}"})

            # Generate resume PDF from HTML if provided
            resume_pdf_path = None
            resume_pdf_name = body.resume_pdf_name or "Resume"
            if body.resume_html:
                try:
                    pdf_page = await browser.new_page()
                    await pdf_page.set_content(body.resume_html, wait_until="load")
                    safe_name = resume_pdf_name.replace(" ", "_").replace("/", "_")
                    resume_pdf_path = f"/tmp/{safe_name}.pdf"
                    await pdf_page.pdf(path=resume_pdf_path, format="Letter", print_background=True)
                    await pdf_page.close()
                    yield _evt({"type": "log", "msg": f"✓ Resume PDF ready ({resume_pdf_name}.pdf)"})
                except Exception as e:
                    yield _evt({"type": "log", "msg": f"⚠️ Could not generate PDF: {str(e)[:60]}"})

            # Fill each field
            filled = []
            for field in actions.get("fields", []):
                selector = field.get("selector", "")
                label = field.get("label", selector)
                ftype = field.get("type", "text")

                if ftype == "file":
                    if resume_pdf_path and "resume" in label.lower() or "cv" in label.lower():
                        try:
                            el = page.locator(selector).first
                            await el.set_input_files(resume_pdf_path)
                            filled.append({"label": label, "value": f"{resume_pdf_name}.pdf"})
                            yield _evt({"type": "log", "msg": f"✓ {label} (PDF attached)"})
                        except Exception as ex:
                            yield _evt({"type": "log", "msg": f"↷ Skipped {label} ({str(ex)[:50]})"})
                    continue

                value = str(field.get("value", ""))
                if not selector or not value:
                    continue
                try:
                    el = page.locator(selector).first
                    if await el.is_visible(timeout=1000):
                        await el.fill(value)
                        filled.append({"label": label, "value": value})
                        yield _evt({"type": "log", "msg": f"✓ {label}"})
                        await asyncio.sleep(0.15)
                except Exception as ex:
                    yield _evt({"type": "log", "msg": f"↷ Skipped {label} ({str(ex)[:50]})"})

            screenshot = await _screenshot_b64(page)
            yield _evt({"type": "screenshot", "data": screenshot})

            # Park the session so user can confirm
            _sessions[session_id] = {
                "pw_mgr": pw_mgr,
                "browser": browser,
                "page": page,
                "submit_selector": actions.get("submit_selector", ""),
                "submit_text": actions.get("submit_text", "Submit"),
            }

            yield _evt({
                "type": "preflight",
                "session_id": session_id,
                "fields_filled": filled,
                "submit_text": actions.get("submit_text", "Submit"),
            })

        except Exception as exc:
            yield _evt({"type": "error", "msg": str(exc)[:300]})
            try:
                if browser:
                    await browser.close()
                if pw_mgr:
                    await pw_mgr.__aexit__(None, None, None)
            except Exception:
                pass

    return StreamingResponse(run(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@router.post("/confirm/{session_id}")
async def confirm_apply(session_id: str):
    session = _sessions.pop(session_id, None)

    async def run():
        if not session:
            yield _evt({"type": "error", "msg": "Session expired — please restart the apply flow."})
            return

        page = session["page"]
        browser = session["browser"]
        pw_mgr = session["pw_mgr"]
        submit_selector = session.get("submit_selector", "")
        submit_text = session.get("submit_text", "Submit")

        try:
            yield _evt({"type": "log", "msg": f"Submitting application…"})

            submitted = False
            if submit_selector:
                try:
                    btn = page.locator(submit_selector).first
                    if await btn.is_visible(timeout=2000):
                        await btn.click()
                        submitted = True
                except Exception:
                    pass

            if not submitted:
                for text in [submit_text, "Submit Application", "Submit", "Apply Now", "Apply"]:
                    try:
                        btn = page.get_by_role("button", name=re.compile(text, re.I)).first  # type: ignore[arg-type]
                        if await btn.is_visible(timeout=1000):
                            await btn.click()
                            submitted = True
                            break
                    except Exception:
                        pass

            if not submitted:
                yield _evt({"type": "error", "msg": "Could not locate the submit button. Please submit manually in the browser."})
                return

            await asyncio.sleep(3)

            body_text = (await page.inner_text("body"))[:3000].lower()
            success = any(s in body_text for s in [
                "thank you", "application submitted", "successfully applied",
                "we've received", "application received", "confirmation", "we will be in touch",
            ])

            screenshot = await _screenshot_b64(page)
            yield _evt({"type": "screenshot", "data": screenshot})

            if success:
                yield _evt({"type": "done", "success": True, "msg": "Application submitted! 🎉"})
            else:
                yield _evt({"type": "done", "success": None,
                            "msg": "Form submitted — check the screenshot above to confirm."})

        except Exception as exc:
            yield _evt({"type": "error", "msg": str(exc)[:300]})
        finally:
            try:
                await browser.close()
                await pw_mgr.__aexit__(None, None, None)
            except Exception:
                pass

    return StreamingResponse(run(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})
