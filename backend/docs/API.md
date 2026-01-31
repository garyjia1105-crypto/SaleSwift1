# SaleSwift Backend REST API 文档

版本：1.0  
Base URL：`http://localhost:4000`（或通过环境变量 `PORT` 配置）

---

## 通用说明

### 请求格式

- **Content-Type**：`application/json`
- **认证**：除 `/api/auth/*`、`GET /api`、`GET /api/health` 外，其余接口需在请求头携带：
  ```http
  Authorization: Bearer <JWT_TOKEN>
  ```
- **错误响应**：失败时返回 JSON，形如 `{ "error": "错误描述" }`，HTTP 状态码见各接口说明。

### API 元数据

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | `/api` | 否 | 返回 API 名称、版本、basePath 及资源列表 |

**响应示例：**
```json
{
  "name": "SaleSwift REST API",
  "version": "1.0",
  "basePath": "/api",
  "resources": [
    { "path": "/api/health", "methods": ["GET"], "description": "健康检查" },
    ...
  ]
}
```

---

## 1. 健康检查

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | `/api/health` | 否 | 服务健康检查 |

**响应：** `200 OK`
```json
{ "ok": true }
```

---

## 2. 认证 (Auth)

### 2.1 注册

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| POST | `/api/auth/register` | 否 | 邮箱注册 |

**请求体：**
```json
{
  "email": "string，必填",
  "password": "string，必填",
  "name": "string，可选，显示名"
}
```

**成功响应：** `200 OK`
```json
{
  "user": {
    "id": "string",
    "email": "string",
    "displayName": "string",
    "avatar": "string | null",
    "language": "string",
    "theme": "string"
  },
  "token": "string，JWT，用于后续请求"
}
```

**错误：**
- `400`：缺少 email 或 password
- `409`：Email already registered
- `500`：Registration failed

---

### 2.2 登录

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| POST | `/api/auth/login` | 否 | 邮箱密码登录 |

**请求体：**
```json
{
  "email": "string，必填",
  "password": "string，必填"
}
```

**成功响应：** `200 OK`  
与注册相同，返回 `user` 与 `token`。

**错误：**
- `400`：Email and password required
- `401`：Invalid email or password
- `500`：Login failed

---

### 2.3 Google 登录

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| POST | `/api/auth/google` | 否 | 使用 Google ID Token 登录/注册 |

**请求体：**
```json
{
  "idToken": "string，必填，Google 返回的 ID Token"
}
```

**成功响应：** `200 OK`  
与注册相同，返回 `user` 与 `token`。

**错误：**
- `400`：idToken required
- `401`：Invalid Google token
- `500`：Google OAuth not configured / Google login failed

---

## 3. 用户 (Users)

所有接口需 **Bearer Token**。

### 3.1 获取当前用户

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/users/me` | 获取当前登录用户信息 |

**成功响应：** `200 OK`
```json
{
  "id": "string",
  "email": "string",
  "displayName": "string",
  "avatar": "string | null",
  "language": "string | null",
  "theme": "string | null"
}
```

**错误：** `404` User not found，`500` Failed to get user

---

### 3.2 更新当前用户

| 方法 | 路径 | 说明 |
|------|------|------|
| PATCH | `/api/users/me` | 更新头像、语言、主题、显示名 |

**请求体：** 均为可选
```json
{
  "avatar": "string | null",
  "language": "string",
  "theme": "string",
  "displayName": "string"
}
```

**成功响应：** `200 OK`，返回与 GET /api/users/me 相同的用户对象。

**错误：** `404` User not found，`500` Failed to update user

---

## 4. 客户 (Customers)

所有接口需 **Bearer Token**，数据按当前用户隔离。

### 4.1 客户列表

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/customers` | 获取客户列表，支持按关键词搜索 |

**查询参数：**
- `search`（可选）：字符串，按姓名、公司、邮箱模糊搜索

**成功响应：** `200 OK`
```json
[
  {
    "id": "string",
    "name": "string",
    "company": "string",
    "role": "string",
    "industry": "string",
    "email": "string | undefined",
    "phone": "string | undefined",
    "tags": ["string"],
    "createdAt": "string，ISO 8601"
  }
]
```

---

### 4.2 创建客户

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/customers` | 创建客户 |

**请求体：**
```json
{
  "name": "string，必填",
  "company": "string，必填",
  "role": "string，可选",
  "industry": "string，可选",
  "email": "string，可选",
  "phone": "string，可选",
  "tags": ["string"]，可选
}
```

**成功响应：** `201 Created`，返回单个客户对象（同上）。

**错误：** `400` Name and company required，`500` Failed to create customer

---

### 4.3 获取客户详情

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/customers/:id` | 获取指定客户 |

**成功响应：** `200 OK`，单个客户对象。  
**错误：** `404` Customer not found，`500` Failed to get customer

---

### 4.4 更新客户

| 方法 | 路径 | 说明 |
|------|------|------|
| PATCH | `/api/customers/:id` | 更新指定客户，仅传需修改字段 |

**请求体：** 同创建，各字段可选。

**成功响应：** `200 OK`，返回更新后的客户对象。  
**错误：** `404` Customer not found，`500` Failed to update customer

---

### 4.5 删除客户

| 方法 | 路径 | 说明 |
|------|------|------|
| DELETE | `/api/customers/:id` | 删除指定客户 |

**成功响应：** `204 No Content`，无响应体。  
**错误：** `404` Customer not found，`500` Failed to delete customer

---

## 5. 互动 (Interactions)

所有接口需 **Bearer Token**。

### 5.1 互动列表

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/interactions` | 获取互动列表 |

**查询参数：**
- `customerId`（可选）：仅返回关联该客户的互动

**成功响应：** `200 OK`
```json
[
  {
    "id": "string",
    "customerId": "string | undefined",
    "date": "string",
    "rawInput": "string",
    "customerProfile": "object",
    "intelligence": "object",
    "metrics": "object",
    "suggestions": ["string"]
  }
]
```

---

### 5.2 创建互动

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/interactions` | 创建一条互动记录 |

**请求体：**
```json
{
  "customerId": "string，可选",
  "date": "string，可选，默认当前时间",
  "rawInput": "string，可选",
  "customerProfile": "object，必填",
  "intelligence": "object，必填",
  "metrics": "object，必填",
  "suggestions": ["string"]，必填，数组
}
```

**成功响应：** `201 Created`，返回单个互动对象。  
**错误：** `400` customerProfile, intelligence, metrics, suggestions required，`500` Failed to create interaction

---

### 5.3 获取互动详情

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/interactions/:id` | 获取指定互动 |

**成功响应：** `200 OK`，单个互动对象。  
**错误：** `404` Interaction not found，`500` Failed to get interaction

---

### 5.4 删除互动

| 方法 | 路径 | 说明 |
|------|------|------|
| DELETE | `/api/interactions/:id` | 删除指定互动 |

**成功响应：** `204 No Content`。  
**错误：** `404` Interaction not found，`500` Failed to delete interaction

---

## 6. 日程 (Schedules)

所有接口需 **Bearer Token**。

### 6.1 日程列表

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/schedules` | 获取日程列表，按日期时间排序 |

**查询参数：**
- `customerId`（可选）：仅返回关联该客户的日程

**成功响应：** `200 OK`
```json
[
  {
    "id": "string",
    "customerId": "string | undefined",
    "title": "string",
    "date": "string",
    "time": "string | undefined",
    "description": "string | undefined",
    "status": "pending | completed"
  }
]
```

---

### 6.2 创建日程

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/schedules` | 创建日程 |

**请求体：**
```json
{
  "customerId": "string，可选",
  "title": "string，必填",
  "date": "string，必填",
  "time": "string，可选",
  "description": "string，可选",
  "status": "pending | completed，可选，默认 pending"
}
```

**成功响应：** `201 Created`，返回单个日程对象。  
**错误：** `400` Title and date required，`500` Failed to create schedule

---

### 6.3 更新日程

| 方法 | 路径 | 说明 |
|------|------|------|
| PATCH | `/api/schedules/:id` | 更新指定日程 |

**请求体：** 同创建，各字段可选。

**成功响应：** `200 OK`，返回更新后的日程对象。  
**错误：** `404` Schedule not found，`500` Failed to update schedule

---

### 6.4 删除日程

| 方法 | 路径 | 说明 |
|------|------|------|
| DELETE | `/api/schedules/:id` | 删除指定日程 |

**成功响应：** `204 No Content`。  
**错误：** `404` Schedule not found，`500` Failed to delete schedule

---

## 7. 课程计划 (Course Plans)

所有接口需 **Bearer Token**。

### 7.1 课程计划列表

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/course-plans` | 获取课程计划列表 |

**查询参数：**
- `customerId`（可选）：仅返回关联该客户的课程计划

**成功响应：** `200 OK`
```json
[
  {
    "id": "string",
    "customerId": "string",
    "title": "string",
    "objective": "string",
    "modules": [
      { "name": "string", "topics": ["string"], "duration": "string" }
    ],
    "resources": ["string"],
    "createdAt": "string，ISO 8601"
  }
]
```

---

### 7.2 创建课程计划

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/course-plans` | 创建课程计划，customerId 须为当前用户下的客户 |

**请求体：**
```json
{
  "customerId": "string，必填",
  "title": "string，必填",
  "objective": "string，必填",
  "modules": [{ "name": "string", "topics": ["string"], "duration": "string" }]，可选",
  "resources": ["string"]，可选
}
```

**成功响应：** `201 Created`，返回单个课程计划对象。  
**错误：** `400` customerId, title, objective required，`404` Customer not found，`500` Failed to create course plan

---

### 7.3 获取课程计划详情

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/course-plans/:id` | 获取指定课程计划 |

**成功响应：** `200 OK`，单个课程计划对象。  
**错误：** `404` Course plan not found，`500` Failed to get course plan

---

### 7.4 删除课程计划

| 方法 | 路径 | 说明 |
|------|------|------|
| DELETE | `/api/course-plans/:id` | 删除指定课程计划 |

**成功响应：** `204 No Content`。  
**错误：** `404` Course plan not found，`500` Failed to delete course plan

---

## 8. AI 接口

所有 AI 接口需 **Bearer Token**，请求体均为 JSON。

### 8.1 分析销售互动

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/ai/analyze-sales-interaction` | 根据文本或语音分析销售互动，返回结构化报告 |

**请求体：**
```json
{
  "input": "string，文本描述或说明",
  "audioData": { "data": "string，base64", "mimeType": "string" }，可选
}
```

**成功响应：** `200 OK`
```json
{
  "customerProfile": { "name", "company", "role", "industry", "summary", ... },
  "intelligence": { "painPoints", "keyInterests", "currentStage", "probability", "nextSteps", ... },
  "metrics": { "talkRatio", "questionRate", "sentiment", "confidenceScore" },
  "suggestions": ["string"]
}
```

**错误：** `500` 可能返回友好错误信息（如 API key 未配置、网络不可达、配额超限等）

---

### 8.2 情景演练初始化

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/ai/role-play-init` | 初始化情景演练，获取“客户”首条回复 |

**请求体：**
```json
{
  "customer": { "name": "string，必填", "company": "string，必填", ... },
  "context": "string，可选"
}
```

**成功响应：** `200 OK`  
```json
{ "text": "string，客户角色首条消息" }
```

**错误：** `400` customer.name and customer.company required，`500` Role play init failed

---

### 8.3 情景演练消息

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/ai/role-play-message` | 发送一条消息，获取“客户”回复 |

**请求体：**
```json
{
  "customer": { "name": "string", "company": "string", ... },
  "context": "string，可选",
  "history": [{ "role": "string", "text": "string" }],
  "message": "string，必填"
}
```

**成功响应：** `200 OK`  
```json
{ "text": "string" }
```

**错误：** `400` customer and message required，`500` Role play message failed

---

### 8.4 情景演练评估

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/ai/evaluate-role-play` | 根据对话历史评估情景演练表现 |

**请求体：**
```json
{
  "history": [{ "role": "string", "text": "string" }]，必填，数组
}
```

**成功响应：** `200 OK`
```json
{
  "score": "number",
  "strengths": ["string"],
  "improvements": ["string"],
  "suggestedScripts": [{ "situation", "original", "better" }]，可选",
  "dimensions": { "professionalism", "empathy", "probing", "closing", "handlingObjections" }，可选
}
```

**错误：** `400` history array required，`500` Evaluate role play failed

---

### 8.5 语音转文字

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/ai/transcribe-audio` | 将音频（base64）转成文字 |

**请求体：**
```json
{
  "base64Data": "string，必填，base64 编码音频，长度建议 ≥100",
  "mimeType": "string，可选，如 audio/webm、audio/mp4、audio/ogg、audio/wav、audio/mpeg，默认 audio/webm"
}
```

**成功响应：** `200 OK`  
```json
{ "text": "string" }
```

**错误：** `400` base64Data required / 音频数据太短，`500` 未能识别出文字或服务错误

---

### 8.6 兴趣深度分析

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/ai/deep-dive-interest` | 针对客户某兴趣点做深度分析报告 |

**请求体：**
```json
{
  "interest": "string，必填",
  "customer": { "name": "string，必填", ... }
}
```

**成功响应：** `200 OK`  
```json
{ "text": "string，Markdown 报告" }
```

**错误：** `400` interest and customer required，`500` Deep dive failed

---

### 8.7 继续深度分析

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/ai/continue-deep-dive` | 在已有深度分析对话基础上继续追问 |

**请求体：**
```json
{
  "interest": "string，必填",
  "customer": { "name": "string", ... },
  "history": [{ "role": "string", "text": "string" }]，必填",
  "question": "string，必填"
}
```

**成功响应：** `200 OK`  
```json
{ "text": "string" }
```

**错误：** `400` interest, customer, history, question required，`500` Continue deep dive failed

---

### 8.8 互动问答

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/ai/ask-about-interaction` | 针对某条互动记录进行问答 |

**请求体：**
```json
{
  "interaction": { "customerProfile": "object，必填", ... },
  "history": [{ "role": "string", "text": "string" }]，可选",
  "question": "string，必填"
}
```

**成功响应：** `200 OK`  
```json
{ "text": "string" }
```

**错误：** `400` interaction and question required，`500` Ask about interaction failed

---

### 8.9 生成课程计划

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/ai/generate-course-plan` | 根据客户与上下文生成课程计划草案 |

**请求体：**
```json
{
  "customer": { "name": "string", "company": "string", ... }，必填",
  "context": "string，可选"
}
```

**成功响应：** `200 OK`  
返回课程计划结构（如 title、objective、modules、resources），可与 POST /api/course-plans 配合使用。

**错误：** `400` customer required，`500` Generate course plan failed

---

### 8.10 解析日程语音

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/ai/parse-schedule-voice` | 从自然语言描述中解析日程信息 |

**请求体：**
```json
{ "text": "string，必填" }
```

**成功响应：** `200 OK`
```json
{
  "title": "string",
  "date": "string",
  "time": "string，可选",
  "customerName": "string，可选",
  "description": "string，可选"
}
```

**错误：** `400` text required，`500` Parse schedule voice failed

---

### 8.11 解析客户语音

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/ai/parse-customer-voice` | 从自然语言中解析客户信息（姓名、公司、职位、行业） |

**请求体：**
```json
{ "text": "string，必填" }
```

**成功响应：** `200 OK`
```json
{
  "name": "string",
  "company": "string",
  "role": "string，可选",
  "industry": "string，可选"
}
```

**错误：** `400` text required，`500` Parse customer voice failed

---

### 8.12 提取搜索关键词

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/ai/extract-search-keywords` | 从文本中提取搜索关键词（如人名、公司名） |

**请求体：**
```json
{ "text": "string，必填" }
```

**成功响应：** `200 OK`  
```json
{ "keywords": "string" }
```

**错误：** `400` text required，`500` Extract keywords failed

---

## 附录：HTTP 状态码与错误约定

| 状态码 | 含义 |
|--------|------|
| 200 | 成功（GET/PATCH/POST 返回资源或结果） |
| 201 | 创建成功（POST 创建资源） |
| 204 | 成功无内容（如 DELETE） |
| 400 | 请求参数错误，见响应体 `error` |
| 401 | 未认证或 Token 无效 |
| 404 | 资源不存在 |
| 409 | 冲突（如邮箱已注册） |
| 500 | 服务器内部错误，见响应体 `error` |

未知的 `/api/*` 路径返回 `404`，响应体：`{ "error": "Not Found", "path": "/api" }`。
