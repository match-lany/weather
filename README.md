# 天气应用

基于和风天气API的天气应用，提供实时天气、预报和城市搜索功能。

## 本地开发

1. 克隆仓库
   ```
   git clone https://github.com/match-lany/weather.git
   cd weather
   ```

2. 创建环境变量
   ```
   cp .env.example .env
   ```
   然后编辑`.env`文件，添加你的和风天气API密钥

3. 启动静态服务器
   ```
   cd src
   npx http-server
   ```

## Vercel部署

1. 在Vercel创建一个新项目，连接到GitHub仓库

2. 配置环境变量：
   - 在Vercel项目设置中添加`WEATHER_API_KEY`环境变量，填入你的和风天气API密钥

3. 部署：
   - Vercel会自动识别配置并部署应用

## 项目结构

- `/src` - 应用源代码
  - `/assets` - 静态资源（图标、字体等）
  - `/css` - 样式文件
  - `/js` - JavaScript代码
  - `/api` - API路由

- `/UIUX` - UI/UX设计文件
- `/DD` - 详细设计文档

## API密钥安全

本应用使用环境变量管理API密钥，确保：
1. 不要将真实API密钥提交到仓库
2. 使用`.env`文件或云服务环境变量存储密钥
3. 在部署前设置正确的环境变量 