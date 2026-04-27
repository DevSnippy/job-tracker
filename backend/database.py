from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import String, Boolean, Integer, Text, JSON, text
from typing import AsyncGenerator

DATABASE_URL = "sqlite+aiosqlite:///./jobtracker.db"

engine = create_async_engine(DATABASE_URL, echo=False)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


class JobModel(Base):
    __tablename__ = "jobs"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    company: Mapped[str] = mapped_column(String)
    role: Mapped[str] = mapped_column(String)
    loc: Mapped[str] = mapped_column(String, default="")
    type: Mapped[str] = mapped_column(String, default="Full-time")
    remote: Mapped[str] = mapped_column(String, default="Hybrid")
    posted: Mapped[str] = mapped_column(String, default="")
    source: Mapped[str] = mapped_column(String, default="manual")
    stack: Mapped[list] = mapped_column(JSON, default=list)
    stage: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String, default="saved")
    logo: Mapped[str] = mapped_column(String, default="")
    color: Mapped[str] = mapped_column(String, default="#666")
    ats_score: Mapped[int] = mapped_column(Integer, default=0)
    url: Mapped[str] = mapped_column(String, default="")
    description: Mapped[str] = mapped_column(Text, default="")
    notes: Mapped[str] = mapped_column(Text, default="")


class ResumeModel(Base):
    __tablename__ = "resumes"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String)
    template: Mapped[str] = mapped_column(String, default="Vanguard")
    updated: Mapped[str] = mapped_column(String, default="")
    size: Mapped[str] = mapped_column(String, default="")
    pages: Mapped[int] = mapped_column(Integer, default=1)
    default: Mapped[bool] = mapped_column(Boolean, default=False)
    tags: Mapped[list] = mapped_column(JSON, default=list)
    content: Mapped[str] = mapped_column(Text, default="")
    resume_data: Mapped[dict] = mapped_column(JSON, default=dict)


class UserModel(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, default="")
    email: Mapped[str] = mapped_column(String, default="")
    phone: Mapped[str] = mapped_column(String, default="")
    headline: Mapped[str] = mapped_column(String, default="")
    location: Mapped[str] = mapped_column(String, default="")
    interested_titles: Mapped[list] = mapped_column(JSON, default=list)
    preferred_levels: Mapped[list] = mapped_column(JSON, default=list)
    preferred_tracks: Mapped[list] = mapped_column(JSON, default=list)
    summary: Mapped[str] = mapped_column(Text, default="")
    experience: Mapped[list] = mapped_column(JSON, default=list)
    education: Mapped[list] = mapped_column(JSON, default=list)
    skills: Mapped[list] = mapped_column(JSON, default=list)
    linkedin_url: Mapped[str] = mapped_column(String, default="")
    website_url: Mapped[str] = mapped_column(String, default="")
    portfolio_url: Mapped[str] = mapped_column(String, default="")
    cover_letter: Mapped[str] = mapped_column(Text, default="")


class WebhookModel(Base):
    __tablename__ = "webhooks"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String)
    url: Mapped[str] = mapped_column(String)
    events: Mapped[list] = mapped_column(JSON, default=list)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_fired: Mapped[str] = mapped_column(String, default="never")
    status: Mapped[str] = mapped_column(String, default="untested")


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Add columns that may not exist in older databases
        result = await conn.execute(text("PRAGMA table_info(users)"))
        existing = {row[1] for row in result.fetchall()}
        new_cols = [
            ("summary",    "TEXT DEFAULT ''"),
            ("experience", "TEXT DEFAULT '[]'"),
            ("skills",     "TEXT DEFAULT '[]'"),
            ("phone",      "TEXT DEFAULT ''"),
            ("education",        "TEXT DEFAULT '[]'"),
            ("preferred_levels", "TEXT DEFAULT '[]'"),
            ("preferred_tracks", "TEXT DEFAULT '[]'"),
            ("linkedin_url",  "TEXT DEFAULT ''"),
            ("website_url",   "TEXT DEFAULT ''"),
            ("portfolio_url", "TEXT DEFAULT ''"),
            ("cover_letter",  "TEXT DEFAULT ''"),
        ]
        for col, defn in new_cols:
            if col not in existing:
                await conn.execute(text(f"ALTER TABLE users ADD COLUMN {col} {defn}"))


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        yield session
