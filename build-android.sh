#!/bin/bash

# 基金估值看板 - Android APK 构建脚本
# 使用方法: ./build-android.sh

set -e

echo "=========================================="
echo "  基金估值看板 - Android 构建"
echo "=========================================="
echo ""

# 颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 检查环境
check_env() {
    echo "检查构建环境..."
    
    # 检查 Java
    if ! command -v java &> /dev/null; then
        echo -e "${RED}错误: 未找到 Java，请安装 JDK 17+${NC}"
        exit 1
    fi
    
    # 检查 ANDROID_HOME
    if [ -z "$ANDROID_HOME" ] && [ -z "$ANDROID_SDK_ROOT" ]; then
        echo -e "${YELLOW}警告: 未设置 ANDROID_HOME 或 ANDROID_SDK_ROOT${NC}"
        echo "请确保 Android SDK 已安装并设置环境变量"
        echo ""
        echo "通常位置:"
        echo "  macOS: ~/Library/Android/sdk"
        echo "  Linux: ~/Android/Sdk"
        echo "  Windows: %LOCALAPPDATA%\\Android\\Sdk"
        echo ""
        read -p "是否继续? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    echo -e "${GREEN}环境检查通过${NC}"
}

# 同步 Web 资源
sync_web() {
    echo ""
    echo "同步 Web 资源..."
    npx cap copy android
    echo -e "${GREEN}Web 资源已同步${NC}"
}

# 构建 Debug APK
build_debug() {
    echo ""
    echo "构建 Debug APK..."
    cd android
    ./gradlew assembleDebug
    cd ..
    
    APK_PATH="android/app/build/outputs/apk/debug/app-debug.apk"
    if [ -f "$APK_PATH" ]; then
        echo -e "${GREEN}✓ Debug APK 构建成功${NC}"
        echo "位置: $APK_PATH"
        echo "大小: $(du -h "$APK_PATH" | cut -f1)"
    else
        echo -e "${RED}✗ 构建失败${NC}"
        exit 1
    fi
}

# 构建 Release APK
build_release() {
    echo ""
    echo "构建 Release APK..."
    cd android
    ./gradlew assembleRelease
    cd ..
    
    APK_PATH="android/app/build/outputs/apk/release/app-release-unsigned.apk"
    if [ -f "$APK_PATH" ]; then
        echo -e "${GREEN}✓ Release APK 构建成功${NC}"
        echo "位置: $APK_PATH"
        echo "大小: $(du -h "$APK_PATH" | cut -f1)"
        echo ""
        echo -e "${YELLOW}注意: Release APK 需要签名才能安装${NC}"
        echo "使用以下命令签名:"
        echo "  apksigner sign --ks your-key.jks --out app-release.apk app-release-unsigned.apk"
    else
        echo -e "${RED}✗ 构建失败${NC}"
        exit 1
    fi
}

# 主流程
echo "选择构建类型:"
echo "  1) Debug (开发测试)"
echo "  2) Release (发布版本)"
echo "  3) 仅同步资源"
echo ""
read -p "请选择 [1-3]: " choice

check_env

case $choice in
    1)
        sync_web
        build_debug
        ;;
    2)
        sync_web
        build_release
        ;;
    3)
        sync_web
        ;;
    *)
        echo -e "${RED}无效选择${NC}"
        exit 1
        ;;
esac

echo ""
echo "=========================================="
echo "  构建完成"
echo "=========================================="
