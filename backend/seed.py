"""Seed the database with sample resumes and webhooks for development."""
import asyncio
from database import init_db, SessionLocal, ResumeModel, WebhookModel
import uuid

RESUMES = [
    {"id": "r1", "name": "Senior Frontend — General.pdf", "template": "Vanguard", "updated": "2d ago", "size": "312 KB", "pages": 2, "default": True, "tags": ["Frontend", "React"]},
    {"id": "r2", "name": "Fullstack — Startup focus.pdf", "template": "Ledger", "updated": "1w ago", "size": "298 KB", "pages": 2, "default": False, "tags": ["Fullstack", "Node"]},
]

WEBHOOKS = [
    {"name": "Notion — Applications DB", "url": "https://n8n.example.com/webhook/a2f9e1", "events": ["job.applied", "job.interview"], "active": True},
    {"name": "Slack — #job-hunt", "url": "https://n8n.example.com/webhook/b71d03", "events": ["job.applied", "job.offer"], "active": True},
]


async def seed():
    await init_db()
    async with SessionLocal() as db:
        for r in RESUMES:
            resume = ResumeModel(**r)
            db.add(resume)
        for w in WEBHOOKS:
            wh = WebhookModel(id=f"wh-{uuid.uuid4().hex[:8]}", **w)
            db.add(wh)
        await db.commit()
    print(f"Seeded {len(RESUMES)} resumes, {len(WEBHOOKS)} webhooks.")


if __name__ == "__main__":
    asyncio.run(seed())
