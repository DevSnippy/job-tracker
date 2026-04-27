from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio
from dotenv import load_dotenv
load_dotenv()
from database import init_db
from routers import jobs, resumes, tailor, webhooks
from routers import user, proxy, apply as apply_router
from routers.jobs import sync_techmap_jobs

SYNC_INTERVAL = 24 * 60 * 60  # 24 hours


async def _sync_loop():
    while True:
        try:
            added = await sync_techmap_jobs()
            print(f"[techmap] sync complete — {added} new jobs added")
        except Exception as e:
            print(f"[techmap] sync failed: {e}")
        await asyncio.sleep(SYNC_INTERVAL)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    task = asyncio.create_task(_sync_loop())
    yield
    task.cancel()


app = FastAPI(title="Job Tracker API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(proxy.router, tags=["proxy"])
app.include_router(user.router, prefix="/api/user", tags=["user"])
app.include_router(jobs.router, prefix="/api/jobs", tags=["jobs"])
app.include_router(resumes.router, prefix="/api/resumes", tags=["resumes"])
app.include_router(tailor.router, prefix="/api/tailor", tags=["tailor"])
app.include_router(webhooks.router, prefix="/api/webhooks", tags=["webhooks"])
app.include_router(apply_router.router, prefix="/api/apply", tags=["apply"])


@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}
