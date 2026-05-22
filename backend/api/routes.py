import time
import logging

from fastapi import APIRouter, HTTPException

from backend.models.schemas import (
    GenerateRequest,
    EditRequest,
    VideoRequest,
    UnderstandRequest,
    ImageResponse,
    VideoResponse,
    UnderstandResponse,
    StatusResponse,
    ModelsResponse,
    ModelInfo,
)
from backend.core.inference import get_inference_engine

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/api/status", response_model=StatusResponse)
async def status():
    engine = get_inference_engine()
    return StatusResponse(
        status="ok",
        model_loaded=engine.is_loaded,
        device=engine.device,
        version="0.1.0",
    )


@router.get("/api/models", response_model=ModelsResponse)
async def list_models():
    engine = get_inference_engine()
    models = [
        ModelInfo(name="Lance-Image", description="图像生成", task="generate", loaded=engine.is_loaded),
        ModelInfo(name="Lance-Edit", description="图像编辑", task="edit", loaded=engine.is_loaded),
        ModelInfo(name="Lance-Video", description="视频生成", task="video", loaded=engine.is_loaded),
        ModelInfo(name="Lance-Understand", description="图像理解", task="understand", loaded=engine.is_loaded),
    ]
    return ModelsResponse(models=models)


@router.post("/api/generate", response_model=ImageResponse)
async def generate_image(req: GenerateRequest):
    engine = get_inference_engine()
    try:
        start = time.time()
        images = engine.generate_image(
            prompt=req.prompt,
            negative_prompt=req.negative_prompt,
            width=req.width,
            height=req.height,
            num_inference_steps=req.num_inference_steps,
            guidance_scale=req.guidance_scale,
            seed=req.seed,
            num_images=req.num_images,
        )
        elapsed = time.time() - start
        return ImageResponse(images=images, seed=req.seed or 42, processing_time=round(elapsed, 3))
    except Exception as e:
        logger.exception("generate_image failed")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/edit", response_model=ImageResponse)
async def edit_image(req: EditRequest):
    engine = get_inference_engine()
    try:
        start = time.time()
        result = engine.edit_image(
            image_base64=req.image_base64,
            prompt=req.prompt,
            negative_prompt=req.negative_prompt,
            strength=req.strength,
            num_inference_steps=req.num_inference_steps,
            guidance_scale=req.guidance_scale,
            seed=req.seed,
        )
        elapsed = time.time() - start
        return ImageResponse(images=[result], seed=req.seed or 42, processing_time=round(elapsed, 3))
    except Exception as e:
        logger.exception("edit_image failed")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/video", response_model=VideoResponse)
async def generate_video(req: VideoRequest):
    engine = get_inference_engine()
    try:
        start = time.time()
        video = engine.generate_video(
            prompt=req.prompt,
            image_base64=req.image_base64,
            negative_prompt=req.negative_prompt,
            num_frames=req.num_frames,
            fps=req.fps,
            width=req.width,
            height=req.height,
            num_inference_steps=req.num_inference_steps,
            guidance_scale=req.guidance_scale,
            seed=req.seed,
        )
        elapsed = time.time() - start
        return VideoResponse(
            video_base64=video, num_frames=req.num_frames, fps=req.fps, processing_time=round(elapsed, 3)
        )
    except Exception as e:
        logger.exception("generate_video failed")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/understand", response_model=UnderstandResponse)
async def understand_image(req: UnderstandRequest):
    engine = get_inference_engine()
    try:
        start = time.time()
        answer = engine.understand_image(image_base64=req.image_base64, question=req.question)
        elapsed = time.time() - start
        return UnderstandResponse(answer=answer, processing_time=round(elapsed, 3))
    except Exception as e:
        logger.exception("understand_image failed")
        raise HTTPException(status_code=500, detail=str(e))
