# Lance WebUI

Lance 多模态模型的 Web 界面，支持图像生成、图像编辑、视频生成和图像理解。

## 功能特性

- 🎨 **图像生成** - 根据文本描述生成图像
- ✏️ **图像编辑** - 基于指令编辑现有图像
- 🎬 **视频生成** - 从文本或图像生成视频
- 👁️ **图像理解** - 对图像进行问答分析

## 安装

```bash
# 克隆项目
git clone https://github.com/Liuxd-1230/lance-webui.git
cd lance-webui

# 创建虚拟环境
python -m venv venv
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 下载模型（可选，使用国内镜像）
bash scripts/download_model.sh
```

## 使用方法

```bash
# 启动服务
python -m backend.main

# 或使用 uvicorn
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

访问 http://localhost:8000 使用 Web 界面。

## API 文档

启动服务后访问 http://localhost:8000/docs 查看自动生成的 API 文档。

### 主要接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/generate` | POST | 图像生成 |
| `/api/edit` | POST | 图像编辑 |
| `/api/video` | POST | 视频生成 |
| `/api/understand` | POST | 图像理解 |
| `/api/status` | GET | 服务状态 |
| `/api/models` | GET | 可用模型列表 |

## 配置

编辑 `configs/default.yaml` 或设置环境变量（前缀 `LANCE_`）：

```bash
export LANCE_MODEL_PATH="./models/Lance-1.0"
export LANCE_DEVICE="cuda"
export LANCE_PORT=8000
```

## 项目结构

```
lance-webui/
├── backend/
│   ├── api/routes.py       # API 路由
│   ├── core/config.py      # 配置管理
│   ├── core/inference.py   # 推理引擎
│   ├── models/schemas.py   # 数据模型
│   └── main.py             # 应用入口
├── frontend/               # 前端文件
├── configs/                # 配置文件
├── scripts/                # 工具脚本
├── requirements.txt
└── README.md
```

## 许可证

MIT License
