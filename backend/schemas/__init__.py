     1|from pydantic import BaseModel, Field
     2|from typing import Optional
     3|from enum import Enum
     4|
     5|
     6|class TaskType(str, Enum):
     7|    GENERATE = "generate"
     8|    EDIT = "edit"
     9|    VIDEO = "video"
    10|    UNDERSTAND = "understand"
    11|
    12|
    13|class GenerateRequest(BaseModel):
    14|    prompt: str = Field(..., description="文本描述")
    15|    negative_prompt: str = Field("", description="负面提示词")
    16|    width: int = Field(512, ge=64, le=2048)
    17|    height: int = Field(512, ge=64, le=2048)
    18|    num_inference_steps: int = Field(30, ge=1, le=100)
    19|    guidance_scale: float = Field(7.5, ge=0, le=20)
    20|    seed: Optional[int] = None
    21|    num_images: int = Field(1, ge=1, le=4)
    22|
    23|
    24|class EditRequest(BaseModel):
    25|    image_base64: str = Field(..., description="输入图片的Base64编码")
    26|    prompt: str = Field(..., description="编辑指令")
    27|    negative_prompt: str = Field("")
    28|    strength: float = Field(0.75, ge=0, le=1)
    29|    num_inference_steps: int = Field(30, ge=1, le=100)
    30|    guidance_scale: float = Field(7.5, ge=0, le=20)
    31|    seed: Optional[int] = None
    32|
    33|
    34|class VideoRequest(BaseModel):
    35|    prompt: str = Field(..., description="视频描述")
    36|    image_base64: Optional[str] = Field(None, description="可选的首帧图片")
    37|    negative_prompt: str = Field("")
    38|    num_frames: int = Field(16, ge=1, le=64)
    39|    fps: int = Field(8, ge=1, le=30)
    40|    width: int = Field(512, ge=64, le=1024)
    41|    height: int = Field(512, ge=64, le=1024)
    42|    num_inference_steps: int = Field(30, ge=1, le=100)
    43|    guidance_scale: float = Field(7.5, ge=0, le=20)
    44|    seed: Optional[int] = None
    45|
    46|
    47|class UnderstandRequest(BaseModel):
    48|    image_base64: str = Field(..., description="图片的Base64编码")
    49|    question: str = Field("", description="关于图片的问题")
    50|
    51|
    52|class ImageResponse(BaseModel):
    53|    images: list[str] = Field(..., description="Base64编码的图片列表")
    54|    seed: int
    55|    processing_time: float
    56|
    57|
    58|class VideoResponse(BaseModel):
    59|    video_base64: str = Field(..., description="Base64编码的视频")
    60|    num_frames: int
    61|    fps: int
    62|    processing_time: float
    63|
    64|
    65|class UnderstandResponse(BaseModel):
    66|    answer: str
    67|    processing_time: float
    68|
    69|
    70|class StatusResponse(BaseModel):
    71|    status: str
    72|    model_loaded: bool
    73|    device: str
    74|    version: str
    75|
    76|
    77|class ModelInfo(BaseModel):
    78|    name: str
    79|    description: str
    80|    task: str
    81|    loaded: bool
    82|
    83|
    84|class ModelsResponse(BaseModel):
    85|    models: list[ModelInfo]
    86|