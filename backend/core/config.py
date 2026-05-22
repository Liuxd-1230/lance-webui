from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    MODEL_PATH: str = "NousResearch/Lance-1.0"
    DEVICE: str = "cuda"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    MAX_IMAGE_SIZE: int = 2048
    MAX_VIDEO_FRAMES: int = 64
    OUTPUT_DIR: str = "outputs"
    LOG_LEVEL: str = "info"
    CORS_ORIGINS: list[str] = ["*"]

    class Config:
        env_file = ".env"
        env_prefix = "LANCE_"


settings = Settings()
