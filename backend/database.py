from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import String, Boolean, Integer, Text, JSON
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


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        yield session
