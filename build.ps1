# 自动化打包脚本
# 支持项目自动打包、运行和Docker部署

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("dev", "build", "docker", "deploy", "clean", "help")]
    [string]$Action = "help",
    
    [Parameter(Mandatory=$false)]
    [string]$Environment = "production",
    
    [Parameter(Mandatory=$false)]
    [string]$Port = "3000",
    
    [Parameter(Mandatory=$false)]
    [switch]$Verbose
)

# 颜色输出函数
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

# 错误处理函数
function Handle-Error {
    param([string]$ErrorMessage)
    Write-ColorOutput "❌ 错误: $ErrorMessage" "Red"
    exit 1
}

# 成功信息函数
function Write-Success {
    param([string]$Message)
    Write-ColorOutput "✅ $Message" "Green"
}

# 信息输出函数
function Write-Info {
    param([string]$Message)
    Write-ColorOutput "ℹ️  $Message" "Cyan"
}

# 警告输出函数
function Write-Warning {
    param([string]$Message)
    Write-ColorOutput "⚠️  $Message" "Yellow"
}

# 检查依赖
function Check-Dependencies {
    Write-Info "检查系统依赖..."
    
    # 检查 Node.js
    try {
        $nodeVersion = node --version
        Write-Success "Node.js 版本: $nodeVersion"
    } catch {
        Handle-Error "Node.js 未安装或不在 PATH 中"
    }
    
    # 检查 npm
    try {
        $npmVersion = npm --version
        Write-Success "npm 版本: $npmVersion"
    } catch {
        Handle-Error "npm 未安装或不在 PATH 中"
    }
    
    # 检查 Docker (如果需要)
    if ($Action -eq "docker" -or $Action -eq "deploy") {
        try {
            $dockerVersion = docker --version
            Write-Success "Docker 版本: $dockerVersion"
        } catch {
            Handle-Error "Docker 未安装或不在 PATH 中"
        }
    }
}

# 安装依赖
function Install-Dependencies {
    Write-Info "安装项目依赖..."
    
    if (!(Test-Path "package.json")) {
        Handle-Error "package.json 文件不存在"
    }
    
    try {
        npm install
        Write-Success "依赖安装完成"
    } catch {
        Handle-Error "依赖安装失败"
    }
}

# 开发模式
function Start-Development {
    Write-Info "启动开发服务器..."
    
    Check-Dependencies
    Install-Dependencies
    
    Write-Info "在端口 $Port 启动开发服务器"
    
    try {
        $env:PORT = $Port
        npm run dev
    } catch {
        Handle-Error "开发服务器启动失败"
    }
}

# 构建项目
function Build-Project {
    Write-Info "构建生产版本..."
    
    Check-Dependencies
    Install-Dependencies
    
    # 清理之前的构建
    if (Test-Path "dist") {
        Write-Info "清理之前的构建文件..."
        Remove-Item -Recurse -Force "dist"
    }
    
    if (Test-Path ".next") {
        Write-Info "清理 Next.js 缓存..."
        Remove-Item -Recurse -Force ".next"
    }
    
    try {
        $env:NODE_ENV = $Environment
        npm run build
        Write-Success "项目构建完成"
        
        # 显示构建信息
        if (Test-Path "dist") {
            $buildSize = (Get-ChildItem -Recurse "dist" | Measure-Object -Property Length -Sum).Sum / 1MB
            Write-Info "构建大小: $([math]::Round($buildSize, 2)) MB"
        }
        
        if (Test-Path ".next") {
            $nextSize = (Get-ChildItem -Recurse ".next" | Measure-Object -Property Length -Sum).Sum / 1MB
            Write-Info "Next.js 构建大小: $([math]::Round($nextSize, 2)) MB"
        }
        
    } catch {
        Handle-Error "项目构建失败"
    }
}

# Docker 构建
function Build-Docker {
    Write-Info "构建 Docker 镜像..."
    
    Check-Dependencies
    
    if (!(Test-Path "Dockerfile")) {
        Handle-Error "Dockerfile 不存在"
    }
    
    $imageName = "snow-app"
    $imageTag = "latest"
    
    try {
        Write-Info "构建 Docker 镜像: $imageName:$imageTag"
        docker build -t "${imageName}:${imageTag}" .
        Write-Success "Docker 镜像构建完成"
        
        # 显示镜像信息
        $imageInfo = docker images $imageName --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
        Write-Info "镜像信息:"
        Write-Host $imageInfo
        
    } catch {
        Handle-Error "Docker 镜像构建失败"
    }
}

# Docker 部署
function Deploy-Docker {
    Write-Info "部署 Docker 容器..."
    
    $containerName = "snow-app-container"
    $imageName = "snow-app:latest"
    
    # 停止并删除现有容器
    try {
        $existingContainer = docker ps -a --filter "name=$containerName" --format "{{.Names}}"
        if ($existingContainer) {
            Write-Info "停止现有容器: $containerName"
            docker stop $containerName
            docker rm $containerName
        }
    } catch {
        Write-Warning "清理现有容器时出现问题，继续部署..."
    }
    
    try {
        Write-Info "启动新容器: $containerName"
        docker run -d --name $containerName -p "${Port}:3000" $imageName
        Write-Success "容器部署完成"
        
        # 等待容器启动
        Start-Sleep -Seconds 3
        
        # 检查容器状态
        $containerStatus = docker ps --filter "name=$containerName" --format "{{.Status}}"
        if ($containerStatus) {
            Write-Success "容器状态: $containerStatus"
            Write-Info "应用访问地址: http://localhost:$Port"
        } else {
            Handle-Error "容器启动失败"
        }
        
    } catch {
        Handle-Error "Docker 容器部署失败"
    }
}

# 清理函数
function Clean-Project {
    Write-Info "清理项目文件..."
    
    $cleanItems = @(
        "node_modules",
        "dist",
        ".next",
        "build",
        "*.log",
        ".env.local"
    )
    
    foreach ($item in $cleanItems) {
        if (Test-Path $item) {
            Write-Info "删除: $item"
            Remove-Item -Recurse -Force $item
        }
    }
    
    # 清理 Docker 资源
    try {
        Write-Info "清理 Docker 资源..."
        docker system prune -f
        Write-Success "Docker 资源清理完成"
    } catch {
        Write-Warning "Docker 资源清理失败，可能 Docker 未运行"
    }
    
    Write-Success "项目清理完成"
}

# 显示帮助信息
function Show-Help {
    Write-ColorOutput "🚀 Snow 项目自动化构建脚本" "Magenta"
    Write-Host ""
    Write-ColorOutput "用法:" "Yellow"
    Write-Host "  .\build.ps1 -Action <action> [参数]"
    Write-Host ""
    Write-ColorOutput "可用操作:" "Yellow"
    Write-Host "  dev      - 启动开发服务器"
    Write-Host "  build    - 构建生产版本"
    Write-Host "  docker   - 构建 Docker 镜像"
    Write-Host "  deploy   - 部署 Docker 容器"
    Write-Host "  clean    - 清理项目文件"
    Write-Host "  help     - 显示此帮助信息"
    Write-Host ""
    Write-ColorOutput "参数:" "Yellow"
    Write-Host "  -Environment  构建环境 (默认: production)"
    Write-Host "  -Port         端口号 (默认: 3000)"
    Write-Host "  -Verbose      详细输出"
    Write-Host ""
    Write-ColorOutput "示例:" "Yellow"
    Write-Host "  .\build.ps1 -Action dev -Port 3001"
    Write-Host "  .\build.ps1 -Action build -Environment production"
    Write-Host "  .\build.ps1 -Action docker"
    Write-Host "  .\build.ps1 -Action deploy -Port 8080"
    Write-Host "  .\build.ps1 -Action clean"
}

# 显示项目信息
function Show-ProjectInfo {
    Write-ColorOutput "📦 项目信息" "Magenta"
    
    if (Test-Path "package.json") {
        $packageJson = Get-Content "package.json" | ConvertFrom-Json
        Write-Host "项目名称: $($packageJson.name)"
        Write-Host "版本: $($packageJson.version)"
        Write-Host "描述: $($packageJson.description)"
    }
    
    Write-Host "当前目录: $(Get-Location)"
    Write-Host "执行时间: $(Get-Date)"
    Write-Host ""
}

# 主执行逻辑
try {
    # 设置错误处理
    $ErrorActionPreference = "Stop"
    
    # 显示项目信息
    if ($Verbose) {
        Show-ProjectInfo
    }
    
    # 根据操作执行相应功能
    switch ($Action.ToLower()) {
        "dev" {
            Start-Development
        }
        "build" {
            Build-Project
        }
        "docker" {
            Build-Docker
        }
        "deploy" {
            Build-Docker
            Deploy-Docker
        }
        "clean" {
            Clean-Project
        }
        "help" {
            Show-Help
        }
        default {
            Write-Warning "未知操作: $Action"
            Show-Help
        }
    }
    
} catch {
    Handle-Error "脚本执行失败: $($_.Exception.Message)"
}