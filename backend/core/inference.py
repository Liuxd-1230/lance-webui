import logging
import time
import base64
import io
from typing import Optional

from PIL import Image

logger = logging.getLogger(__name__)


class LanceInference:
    """Lance 模型推理引擎 - 占位实现"""

    def __init__(self, model_path: str = "NousResearch/Lance-1.0", device: str = "cuda"):
        self.model_path = model_path
        self.device = device
        self._loaded = False
        logger.info(f"LanceInference 初始化: model_path={model_path}, device={device}")

    def load_model(self):
        logger.info(f"加载模型: {self.model_path} (占位实现)")
        self._loaded = True

    @property
    def is_loaded(self) -> bool:
        return self._loaded

    def generate_image(
        self,
        prompt: str,
        negative_prompt: str = "",
        width: int = 512,
        height: int = 512,
        num_inference_steps: int = 30,
        guidance_scale: float = 7.5,
        seed: Optional[int] = None,
        num_images: int = 1,
    ) -> list[str]:
        logger.info(f"[generate_image] prompt={prompt!r}, size={width}x{height}")
        results = []
        for _ in range(num_images):
            img = Image.new("RGB", (width, height), color=(100, 149, 237))
            buf = io.BytesIO()
            img.save(buf, format="PNG")
            results.append(base64.b64encode(buf.getvalue()).decode())
        return results

    def edit_image(
        self,
        image_base64: str,
        prompt: str,
        negative_prompt: str = "",
        strength: float = 0.75,
        num_inference_steps: int = 30,
        guidance_scale: float = 7.5,
        seed: Optional[int] = None,
    ) -> str:
        logger.info(f"[edit_image] prompt={prompt!r}, strength={strength}")
        img_data = base64.b64decode(image_base64)
        img = Image.open(io.BytesIO(img_data))
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        return base64.b64encode(buf.getvalue()).decode()

    def generate_video(
        self,
        prompt: str,
        image_base64: Optional[str] = None,
        negative_prompt: str = "",
        num_frames: int = 16,
        fps: int = 8,
        width: int = 512,
        height: int = 512,
        num_inference_steps: int = 30,
        guidance_scale: float = 7.5,
        seed: Optional[int] = None,
    ) -> str:
        logger.info(f"[generate_video] prompt={prompt!r}, frames={num_frames}")
        # 返回一个占位图片作为"视频帧"
        img = Image.new("RGB", (width, height), color=(50, 50, 50))
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        return base64.b64encode(buf.getvalue()).decode()

    def understand_image(self, image_base64: str, question: str = "") -> str:
        logger.info(f"[understand_image] question={question!r}")
        return f"[占位响应] 这是一张图片的描述。您的问题是: {question or '(无)'}"


# 全局单例
inference_engine: Optional[LanceInference] = None


def get_inference_engine() -> LanceInference:
    global inference_engine
    if inference_engine is None:
        from backend.core.config import settings
        inference_engine = LanceInference(
            model_path=settings.MODEL_PATH, device=settings.DEVICE
        )
    return inference_engine
