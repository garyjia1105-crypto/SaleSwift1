/**
 * REST API 常量与元数据
 * 后端所有路由均以 API_PREFIX 为前缀，供前端统一调用
 */
export const API_PREFIX = '/api';
export const API_VERSION = '1.0';

export const API_RESOURCES = [
  { path: '/api/health', methods: ['GET'], description: '健康检查' },
  { path: '/api/auth/register', methods: ['POST'], description: '注册' },
  { path: '/api/auth/login', methods: ['POST'], description: '登录' },
  { path: '/api/auth/google', methods: ['POST'], description: 'Google 登录' },
  { path: '/api/users/me', methods: ['GET', 'PATCH'], description: '当前用户' },
  { path: '/api/customers', methods: ['GET', 'POST'], description: '客户列表/创建' },
  { path: '/api/customers/:id', methods: ['GET', 'PATCH', 'DELETE'], description: '客户详情/更新/删除' },
  { path: '/api/interactions', methods: ['GET', 'POST'], description: '互动列表/创建' },
  { path: '/api/interactions/:id', methods: ['GET', 'DELETE'], description: '互动详情/删除' },
  { path: '/api/schedules', methods: ['GET', 'POST'], description: '日程列表/创建' },
  { path: '/api/schedules/:id', methods: ['PATCH', 'DELETE'], description: '日程更新/删除' },
  { path: '/api/course-plans', methods: ['GET', 'POST'], description: '课程计划列表/创建' },
  { path: '/api/course-plans/:id', methods: ['GET', 'DELETE'], description: '课程计划详情/删除' },
  { path: '/api/ai/analyze-sales-interaction', methods: ['POST'], description: 'AI 分析销售互动' },
  { path: '/api/ai/role-play-init', methods: ['POST'], description: 'AI 情景演练初始化' },
  { path: '/api/ai/role-play-message', methods: ['POST'], description: 'AI 情景演练消息' },
  { path: '/api/ai/evaluate-role-play', methods: ['POST'], description: 'AI 情景演练评估' },
  { path: '/api/ai/transcribe-audio', methods: ['POST'], description: 'AI 语音转文字' },
  { path: '/api/ai/deep-dive-interest', methods: ['POST'], description: 'AI 兴趣深度分析' },
  { path: '/api/ai/continue-deep-dive', methods: ['POST'], description: 'AI 继续深度分析' },
  { path: '/api/ai/ask-about-interaction', methods: ['POST'], description: 'AI 互动问答' },
  { path: '/api/ai/generate-course-plan', methods: ['POST'], description: 'AI 生成课程计划' },
  { path: '/api/ai/parse-schedule-voice', methods: ['POST'], description: 'AI 解析日程语音' },
  { path: '/api/ai/parse-customer-voice', methods: ['POST'], description: 'AI 解析客户语音' },
  { path: '/api/ai/extract-search-keywords', methods: ['POST'], description: 'AI 提取搜索关键词' },
] as const;
