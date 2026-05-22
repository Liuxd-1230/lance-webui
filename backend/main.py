import logging
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.core.config import settings
from backend.api.routes import router

logging.basicConfig(level=settings.LOG_LEVEL.upper())
logger = logging.getLogger(__name__)

app = FastAPI(title="Lance WebUI", version="0.1.0", description="Lance 多模态模型 Web 界面")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API 路由
app.include_router(router)


# 前端静态文件
frontend_dir = Path(__file__).resolve().parent.parent / "frontend"
if frontend_dir.is_dir():
    app.mount("/", StaticFiles(directory=str(frontend_dir), html=True), name="frontend")
    logger.info(f"前端静态文件已挂载: {frontend_dir}")


@app.on_event("startup")
async def startup():
    logger.info(f"启动 Lance WebUI on {settings.HOST}:{settings.PORT}")
    engine = __import__("backend.core.inference", fromlist=["get_inference_engine"]).get_inference_engine()
    engine.load_model()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=settings.HOST, port=settings.PORT, reload=True)
