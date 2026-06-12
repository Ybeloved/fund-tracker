#!/bin/bash

# ============================================
# 本地构建 Android APK 完整指南
# ============================================

echo "=========================================="
echo "  基金估值看板 - 本地构建 APK 指南"
echo "=========================================="
echo ""

# 颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}第一步：检查环境${NC}"
echo ""

# 检查 Node.js
if command -v node &> /dev/null; then
    echo -e "${GREEN}✓ Node.js $(node -v)${NC}"
else
    echo "✗ Node.js 未安装"
    echo "  下载: https://nodejs.org/"
fi

# 检查 Java
if command -v java &> /dev/null; then
    echo -e "${GREEN}✓ Java $(java -version 2>&1 | head -1)${NC}"
else
    echo "✗ Java 未安装"
    echo "  下载: https://adoptium.net/"
    echo "  推荐: JDK 17"
fi

# 检查 Android SDK
if [ -n "$ANDROID_HOME" ] || [ -n "$ANDROID_SDK_ROOT" ]; then
    echo -e "${GREEN}✓ Android SDK${NC}"
else
    echo "✗ Android SDK 未配置"
    echo "  安装 Android Studio: https://developer.android.com/studio"
    echo "  或单独安装 SDK: https://developer.android.com/studio#command-tools"
fi

echo ""
echo -e "${CYAN}第二步：安装依赖${NC}"
echo ""
echo "在项目目录执行:"
echo "  npm install"
echo ""

echo -e "${CYAN}第三步：构建 APK${NC}"
echo ""
echo "方式 A - 使用脚本:"
echo "  chmod +x build-android.sh"
echo "  ./build-android.sh"
echo ""
echo "方式 B - 手动执行:"
echo "  npx cap copy android"
echo "  cd android"
echo "  ./gradlew assembleDebug"
echo ""

echo -e "${CYAN}第四步：获取 APK${NC}"
echo ""
echo "构建完成后，APK 位于:"
echo "  android/app/build/outputs/apk/debug/app-debug.apk"
echo ""

echo -e "${CYAN}第五步：安装到手机${NC}"
echo ""
echo "方式 A - ADB 安装:"
echo "  adb install android/app/build/outputs/apk/debug/app-debug.apk"
echo ""
echo "方式 B - 直接传输:"
echo "  将 APK 文件发送到手机，点击安装"
echo ""

echo -e "${YELLOW}=========================================="
echo "  快速开始（复制粘贴执行）"
echo "==========================================${NC}"
echo ""
echo "cd fund-tracker"
echo "npm install"
echo "npx cap copy android"
echo "cd android"
echo "./gradlew assembleDebug"
echo "cd .."
echo "echo 'APK 路径: android/app/build/outputs/apk/debug/app-debug.apk'"
echo ""
