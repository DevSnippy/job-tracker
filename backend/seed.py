"""Seed the database with sample Israeli tech jobs and demo webhooks."""
import asyncio
from database import init_db, SessionLocal, JobModel, ResumeModel, WebhookModel
import uuid

JOBS = [
    {"company": "Wiz", "role": "Senior Frontend Engineer", "loc": "Tel Aviv", "type": "Full-time", "remote": "Hybrid", "posted": "2d", "source": "techmap", "stack": ["React", "TS", "Node"], "stage": 2, "status": "applied", "logo": "W", "color": "#5B5FEF"},
    {"company": "Monday.com", "role": "Staff Product Designer", "loc": "Tel Aviv", "type": "Full-time", "remote": "Hybrid", "posted": "3d", "source": "techmap", "stack": ["Figma", "DesignSys"], "stage": 1, "status": "interested", "logo": "M", "color": "#FF3D57"},
    {"company": "Lightricks", "role": "ML Engineer, GenAI", "loc": "Jerusalem", "type": "Full-time", "remote": "On-site", "posted": "4d", "source": "techmap", "stack": ["Python", "PyTorch"], "stage": 0, "status": "saved", "logo": "L", "color": "#111111"},
    {"company": "Fiverr", "role": "Backend Engineer, Payments", "loc": "Tel Aviv", "type": "Full-time", "remote": "Hybrid", "posted": "5d", "source": "techmap", "stack": ["Go", "PostgreSQL"], "stage": 3, "status": "interview", "logo": "F", "color": "#1DBF73"},
    {"company": "Riskified", "role": "Data Scientist", "loc": "Tel Aviv", "type": "Full-time", "remote": "Remote", "posted": "5d", "source": "techmap", "stack": ["Python", "SQL", "ML"], "stage": 0, "status": "saved", "logo": "R", "color": "#0A2540"},
    {"company": "Taboola", "role": "Senior DevOps Engineer", "loc": "Tel Aviv", "type": "Full-time", "remote": "Hybrid", "posted": "6d", "source": "techmap", "stack": ["K8s", "AWS", "Terraform"], "stage": 0, "status": "saved", "logo": "T", "color": "#0066FF"},
    {"company": "Gong", "role": "Product Manager, Growth", "loc": "Ramat Gan", "type": "Full-time", "remote": "Hybrid", "posted": "6d", "source": "techmap", "stack": ["SaaS", "B2B"], "stage": 2, "status": "applied", "logo": "G", "color": "#8039DF"},
    {"company": "Papaya Global", "role": "Full-stack Engineer", "loc": "Herzliya", "type": "Full-time", "remote": "Hybrid", "posted": "1w", "source": "techmap", "stack": ["React", "Node", "AWS"], "stage": 4, "status": "offer", "logo": "P", "color": "#FF6B35"},
    {"company": "Wix", "role": "Frontend Tech Lead", "loc": "Tel Aviv", "type": "Full-time", "remote": "Hybrid", "posted": "2w", "source": "techmap", "stack": ["React", "Vue"], "stage": 0, "status": "saved", "logo": "W", "color": "#0C6EFC"},
    {"company": "Deel", "role": "Staff Engineer", "loc": "Remote IL", "type": "Full-time", "remote": "Remote", "posted": "2w", "source": "techmap", "stack": ["Node", "React"], "stage": 0, "status": "saved", "logo": "D", "color": "#0F4C3A"},
]

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
        for j in JOBS:
            job = JobModel(id=f"TM-{uuid.uuid4().hex[:6].upper()}", **j)
            db.add(job)
        for r in RESUMES:
            resume = ResumeModel(**r)
            db.add(resume)
        for w in WEBHOOKS:
            wh = WebhookModel(id=f"wh-{uuid.uuid4().hex[:8]}", **w)
            db.add(wh)
        await db.commit()
    print(f"Seeded {len(JOBS)} jobs, {len(RESUMES)} resumes, {len(WEBHOOKS)} webhooks.")


if __name__ == "__main__":
    asyncio.run(seed())
