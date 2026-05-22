from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


class TaskType(str, Enum):
    GENERATE = "generate"
    EDIT = "edit"
    VIDEO = "video"
    UNDERSTAND = "understand"


class GenerateRequest(BaseModel):
    prompt: str = Field(..., description="文本描述")
    negative_prompt: str = Field("", description="负面提示词")
    width: int = Field(512, ge=64, le=2048)
    height: int = Field(512, ge=64, le=2048)
    num_inference_steps: int = Field(30, ge=1, le=100)
    guidance_scale: float = Field(7.5, ge=0, le=20)
    seed: Optional[int] = None
    num_images: int = Field(1, ge=1, le=4)


class EditRequest(BaseModel):
    image_base64: str = Field(..., description="输入图片的Base64编码")
    prompt: str = Field(..., description="编辑指令")
    negative_prompt: str = Field("")
    strength: float = Field(0.75, ge=0, le=1)
    num_inference_steps: int = Field(30, ge=1, le=100)
    guidance_scale: float = Field(7.5, ge=0, le=20)
    seed: Optional[int] = None


class VideoRequest(BaseModel):
    prompt: str = Field(..., description="视频描述")
    image_base64: Optional[str] = Field(None, description="可选的首帧图片")
    negative_prompt: str = Field("")
    num_frames: int = Field(16, ge=1, le=64)
    fps: int = Field(8, ge=1, le=30)
    width: int = Field(512, ge=64, le=1024)
    height: int = Field(512, ge=64, le=1024)
    num_inference_steps: int = Field(30, ge=1, le=100)
    guidance_scale: float = Field(7.5, ge=0, le=20)
    seed: Optional[int] = None


class UnderstandRequest(BaseModel):
    image_base64: str = Field(..., description="图片的Base64编码")
    question: str = Field("", description="关于图片的问题")


class ImageResponse(BaseModel):
    images: list[str] = Field(..., description="Base64编码的图片列表")
    seed: int
    processing_time: float


class VideoResponse(BaseModel):
    video_base64: str = Field(..., description="Base64编码的视频")
    num_frames: int
    fps: int
    processing_time: float


class UnderstandResponse(BaseModel):
    answer: str
    processing_time: float


class StatusResponse(BaseModel):
    status: str
    model_loaded: bool
    device: str
    version: str


class ModelInfo(BaseModel):
    name: str
    description: str
    task: str
    loaded: bool


class ModelsResponse(BaseModel):
    models: list[ModelInfo]
