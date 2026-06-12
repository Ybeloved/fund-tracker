# 基金估值看板 - 移动 App

实时基金估值看板，支持 Android 原生 App 和 PWA。

## 功能特性

- 📊 实时基金估值数据
- 🔴 涨红跌绿（A股习惯）
- 📱 原生 Android App
- 💾 本地数据持久化
- 🔄 自动刷新（每30秒）
- ➕ 自选基金管理

## 快速开始

### 方式一：Android App

#### 前置要求

1. **Node.js** 16+
2. **Java JDK** 17+
3. **Android Studio** 或 Android SDK

#### 构建步骤

```bash
# 1. 安装依赖
npm install

# 2. 同步资源到 Android
npx cap copy android

# 3. 构建 APK
chmod +x build-android.sh
./build-android.sh
```

或者手动构建：

```bash
# 同步资源
npx cap copy android

# 进入 Android 目录
cd android

# 构建 Debug APK
./gradlew assembleDebug

# APK 位置
# android/app/build/outputs/apk/debug/app-debug.apk
```

#### 安装到手机

```bash
# 使用 ADB 安装
adb install android/app/build/outputs/apk/debug/app-debug.apk

# 或者直接将 APK 传到手机安装
```

### 方式二：PWA（渐进式 Web 应用）

1. 启动本地服务器：
```bash
npx serve www -l 3000
```

2. 在手机浏览器访问 `http://your-ip:3000`

3. 点击浏览器菜单 → "添加到主屏幕"

### 方式三：直接打开 HTML

最简单的方式，直接用浏览器打开：

```bash
open www/index.html
# 或
start www/index.html
```

## 项目结构

```
fund-tracker/
├── www/
│   └── index.html          # Web 应用主文件
├── android/                 # Android 原生项目
│   ├── app/
│   │   └── src/main/
│   │       ├── assets/public/  # Web 资源
│   │       └── java/           # 原生代码
│   └── build.gradle
├── capacitor.config.json    # Capacitor 配置
├── package.json
├── build-android.sh         # Android 构建脚本
└── README.md
```

## 自选基金

编辑 `www/index.html` 中的默认列表，或在 App 中直接添加/删除。

默认基金：
- 000001 - 华夏成长混合
- 110011 - 易方达中小盘混合
- 161725 - 招商中证白酒指数
- 003834 - 华夏能源革新股票
- 012414 - 东方红启东三年持有混合
- 002207 - 前海开源金银珠宝混合C

## 技术栈

- **前端**: 原生 HTML/CSS/JS（无框架，轻量快速）
- **数据源**: 天天基金网 JSONP API
- **打包**: Capacitor（Web → Native）
- **存储**: Capacitor Preferences / localStorage

## 构建 Release 版本

```bash
# 生成签名密钥（首次）
keytool -genkey -v -keystore fund-tracker.keystore -alias fund -keyalg RSA -keysize 2048 -validity 10000

# 签名 APK
cd android
./gradlew assembleRelease
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 -keystore ../fund-tracker.keystore app/build/outputs/apk/release/app-release-unsigned.apk fund

# 对齐
zipalign -v 4 app/build/outputs/apk/release/app-release-unsigned.apk app-release.apk
```

## 注意事项

- 估值数据仅供参考，以实际净值为准
- 交易日 9:30-15:00 数据实时更新
- 非交易时间显示上一交易日数据
- 需要网络连接获取数据

## License

MIT
