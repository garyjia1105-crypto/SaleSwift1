# SaleSwift Backend

Node.js + Express + TypeScript 后端，使用 **MongoDB** 作为数据库，提供认证、CRUD 与 AI 代理接口。

## 环境要求

- Node.js 18+
- npm 或 pnpm
- MongoDB（或 MongoDB Atlas）

## 配置

1. 复制 `.env.example` 为 `.env`（或使用现有 `.env`）
2. 填写 `JWT_SECRET`、`GEMINI_API_KEY`（AI 功能需要）、`GOOGLE_OAUTH_CLIENT_ID`（与前端 Google 登录 Client ID 一致，用于校验 ID Token）。若网络无法直连 Google API，可设置 `GEMINI_BASE_URL` 指向代理地址（如 `https://your-proxy.com/v1beta`）。
3. 配置 MongoDB 连接字符串：`MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname?appName=...`

## 安装与运行

```bash
npm install
npm run dev
```

默认服务地址：`http://localhost:4000`

### 数据库连接验证

```bash
npm run db:init
```

成功会输出「MongoDB 连接成功」，失败会输出错误并退出码 1。

## MongoDB 集合

- `users`：用户（email 用于登录查询；含 `authProvider: 'email' | 'google'`）
- `customers`：客户（字段 `userId` 隔离）
- `interactions`：互动（`userId`、可选 `customerId`）
- `schedules`：日程（`userId`、可选 `customerId`）
- `courseplans`：课程规划（`userId`、`customerId`）

## API 概览

- `POST /api/auth/register` - 注册（email, password）
- `POST /api/auth/login` - 登录（email, password），返回 JWT
- `POST /api/auth/google` - Google 登录（body: `{ idToken }`），校验 ID Token 后查/建用户，返回 JWT
- `GET /api/users/me` - 当前用户（需 Authorization: Bearer &lt;token&gt;）
- `PATCH /api/users/me` - 更新头像/语言/主题
- `GET|POST|GET/:id|PATCH/:id|DELETE/:id /api/customers` - 客户 CRUD
- `GET|POST|GET/:id|DELETE/:id /api/interactions` - 互动 CRUD
- `GET|POST|PATCH/:id|DELETE/:id /api/schedules` - 日程 CRUD
- `GET|POST|GET/:id|DELETE/:id /api/course-plans` - 课程规划 CRUD
- `POST /api/ai/*` - AI 代理（analyze-sales-interaction, role-play-init, role-play-message, evaluate-role-play, transcribe-audio, deep-dive-interest, continue-deep-dive, ask-about-interaction, generate-course-plan, parse-schedule-voice, parse-customer-voice, extract-search-keywords）

前端开发时设置 `VITE_API_URL=http://localhost:4000`（或对应后端地址）。
