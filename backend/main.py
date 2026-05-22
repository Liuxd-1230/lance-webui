import logging
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.core.config import settings

logging.basicConfig(level=settings.LOG_LEVEL.upper())
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    from backend.core.inference import get_inference_engine
    logger.info(f"启动 Lance WebUI on {settings.HOST}:{settings.PORT}")
    engine = get_inference_engine()
    engine.load_model()
    yield
    logger.info("Lance WebUI 已停止")


app = FastAPI(
    title="Lance WebUI",
    version="0.1.0",
    description="Lance 多模态模型 Web 界面",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API 路由（必须在静态文件挂载之前）
from backend.api.routes import router
app.include_router(router)

# 前端静态文件
frontend_dir = Path(__file__).resolve().parent.parent / "frontend"
if frontend_dir.is_dir():
    app.mount("/", StaticFiles(directory=str(frontend_dir), html=True), name="frontend")
    logger.info(f"前端静态文件已挂载: {frontend_dir}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=settings.HOST, port=settings.PORT, reload=True)
