#Requires -Version 5.1
<#
  Lance WebUI - 一键启动脚本 (PowerShell)
  用法: 右键 -> 使用 PowerShell 运行，或终端执行 .\start.ps1
#>

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$border = "=" * 50

Write-Host ""
Write-Host "  $border" -ForegroundColor Cyan
Write-Host "    Lance WebUI  v0.1.0" -ForegroundColor Cyan
Write-Host "    Multi-modal AI Creative Studio" -ForegroundColor Cyan
Write-Host "  $border" -ForegroundColor Cyan
Write-Host ""

# -- 检测 Python --
$pyCmd = $null
foreach ($cmd in @("python", "python3", "py")) {
    try {
        $ver = & $cmd --version 2>&1
        if ($ver -match "Python 3\.(\d+)") {
            $minor = [int]$Matches[1]
            if ($minor -ge 10) { $pyCmd = $cmd; break }
        }
    } catch {}
}

if (-not $pyCmd) {
    Write-Host "[ERROR] 未找到 Python 3.10+，请先安装:" -ForegroundColor Red
    Write-Host "        https://www.python.org/downloads/" -ForegroundColor Yellow
    Read-Host "按回车退出"
    exit 1
}
$pyVer = & $pyCmd --version 2>&1
Write-Host "[INFO] 检测到 $pyVer" -ForegroundColor Green

# -- 虚拟环境 --
$venvDir     = Join-Path $PSScriptRoot "venv"
$venvPython  = Join-Path $venvDir "Scripts\python.exe"
$venvActivate = Join-Path $venvDir "Scripts\Activate.ps1"

if (-not (Test-Path $venvActivate)) {
    Write-Host "[INFO] 首次运行，正在创建虚拟环境..." -ForegroundColor Yellow
    & $pyCmd -m venv venv
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] 创建虚拟环境失败" -ForegroundColor Red
        Read-Host "按回车退出"
        exit 1
    }
    Write-Host "[INFO] 虚拟环境创建完成" -ForegroundColor Green
}

# 激活 venv
& $venvActivate

# -- 安装依赖 --
$marker = Join-Path $venvDir ".deps_installed"

if (-not (Test-Path $marker)) {
    Write-Host "[INFO] 正在安装依赖（首次运行需要几分钟）..." -ForegroundColor Yellow

    & $venvPython -m pip install --upgrade pip -q 2>$null

    & $venvPython -m pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple/ --trusted-host pypi.tuna.tsinghua.edu.cn
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[WARN] 清华源失败，尝试默认源..." -ForegroundColor DarkYellow
        & $venvPython -m pip install -r requirements.txt
    }

    if ($LASTEXITCODE -eq 0) {
        Set-Content -Path $marker -Value (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
        Write-Host "[INFO] 依赖安装完成" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] 依赖安装失败，请检查网络" -ForegroundColor Red
        Read-Host "按回车退出"
        exit 1
    }
} else {
    Write-Host "[INFO] 依赖已就绪" -ForegroundColor Green
}

# -- 输出目录 --
$outputDir = Join-Path $PSScriptRoot "outputs"
if (-not (Test-Path $outputDir)) { New-Item -ItemType Directory -Path $outputDir | Out-Null }

# -- 配置 --
$listenHost = if ($env:LANCE_HOST) { $env:LANCE_HOST } else { "0.0.0.0" }
$port       = if ($env:LANCE_PORT) { [int]$env:LANCE_PORT } else { 8000 }

# -- 端口占用检测 --
$occupied = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
if ($occupied) {
    $opid  = $occupied[0].OwningProcess
    $proc  = Get-Process -Id $opid -ErrorAction SilentlyContinue
    Write-Host "[WARN] 端口 $port 已被占用 (PID: $opid $($proc.ProcessName))" -ForegroundColor DarkYellow
    $kill = Read-Host "是否终止该进程? (y/N)"
    if ($kill -eq "y" -or $kill -eq "Y") {
        Stop-Process -Id $opid -Force
        Start-Sleep -Seconds 1
        Write-Host "[INFO] 已终止进程 $opid" -ForegroundColor Green
    } else {
        Write-Host "[INFO] 请手动释放端口或设置 LANCE_PORT 环境变量" -ForegroundColor Yellow
        Read-Host "按回车退出"
        exit 1
    }
}

# -- 启动服务 --
Write-Host ""
Write-Host "  $border" -ForegroundColor Cyan
Write-Host "    服务启动中..." -ForegroundColor Cyan
Write-Host "    地址: http://localhost:$port" -ForegroundColor Cyan
Write-Host "    按 Ctrl+C 停止服务" -ForegroundColor Cyan
Write-Host "  $border" -ForegroundColor Cyan
Write-Host ""

# 延迟打开浏览器
Start-Job -ScriptBlock {
    Start-Sleep -Seconds 3
    Start-Process "http://localhost:$using:port"
} | Out-Null

# 设置 PYTHONPATH 确保项目根目录在模块搜索路径中
$env:PYTHONPATH = $PSScriptRoot

# 启动 uvicorn
& $venvPython -m uvicorn backend.main:app --host $listenHost --port $port --reload

Write-Host ""
Write-Host "[INFO] 服务已停止" -ForegroundColor Yellow
Read-Host "按回车退出"
