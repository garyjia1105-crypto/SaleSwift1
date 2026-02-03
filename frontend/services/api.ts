const rawApiBase = (import.meta.env.VITE_API_URL || 'http://localhost:4000').trim();

/** 保证是带协议的绝对地址，避免部署时 VITE_API_URL 缺协议导致 "Invalid URL" */
function normalizeApiBase(base: string): string {
  if (!base) return 'http://localhost:4000';
  if (base.startsWith('http://') || base.startsWith('https://')) return base.replace(/\/+$/, '');
  return `https://${base.replace(/^\/+/, '')}`;
}

const API_BASE = normalizeApiBase(rawApiBase);

function getToken(): string | null {
  return localStorage.getItem('token');
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem('token', token);
  else localStorage.removeItem('token');
}

async function request<T>(
  path: string,
  options: RequestInit & { params?: Record<string, string> } = {}
): Promise<T> {
  const { params, ...init } = options;
  const url =
    path.startsWith('http') ? new URL(path) : new URL(path.startsWith('/') ? path : `/${path}`, `${API_BASE}/`);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };
  if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url.toString(), { ...init, headers });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText || 'Request failed');
  return data as T;
}

export const api = {
  auth: {
    register: (email: string, password: string, name?: string) =>
      request<{ user: { id: string; email: string; displayName?: string; avatar?: string; language?: string; theme?: string }; token: string }>(
        '/api/auth/register',
        { method: 'POST', body: JSON.stringify({ email, password, name }) }
      ),
    login: (email: string, password: string) =>
      request<{ user: { id: string; email: string; displayName?: string; avatar?: string; language?: string; theme?: string }; token: string }>(
        '/api/auth/login',
        { method: 'POST', body: JSON.stringify({ email, password }) }
      ),
    google: (idToken: string) =>
      request<{ user: { id: string; email: string; displayName?: string; avatar?: string; language?: string; theme?: string }; token: string }>(
        '/api/auth/google',
        { method: 'POST', body: JSON.stringify({ idToken }) }
      ),
  },
  users: {
    getMe: () =>
      request<{ id: string; email: string; displayName?: string; avatar?: string; language?: string; theme?: string }>('/api/users/me'),
    patchMe: (body: { avatar?: string; language?: string; theme?: string; displayName?: string }) =>
      request<{ id: string; email: string; displayName?: string; avatar?: string; language?: string; theme?: string }>('/api/users/me', {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
  },
  customers: {
    list: (search?: string) =>
      request<Array<{
        id: string;
        name: string;
        company: string;
        role: string;
        industry: string;
        email?: string;
        phone?: string;
        tags: string[];
        createdAt: string;
      }>>('/api/customers', { params: search ? { search } : {} }),
    create: (body: {
      name: string;
      company: string;
      role?: string;
      industry?: string;
      email?: string;
      phone?: string;
      tags?: string[];
    }) =>
      request<{
        id: string;
        name: string;
        company: string;
        role: string;
        industry: string;
        email?: string;
        phone?: string;
        tags: string[];
        createdAt: string;
      }>('/api/customers', { method: 'POST', body: JSON.stringify(body) }),
    get: (id: string) =>
      request<{
        id: string;
        name: string;
        company: string;
        role: string;
        industry: string;
        email?: string;
        phone?: string;
        tags: string[];
        createdAt: string;
      }>(`/api/customers/${id}`),
    update: (id: string, body: Partial<{ name: string; company: string; role: string; industry: string; email: string; phone: string; tags: string[] }>) =>
      request<{
        id: string;
        name: string;
        company: string;
        role: string;
        industry: string;
        email?: string;
        phone?: string;
        tags: string[];
        createdAt: string;
      }>(`/api/customers/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (id: string) => request<void>(`/api/customers/${id}`, { method: 'DELETE' }),
  },
  interactions: {
    list: (customerId?: string) =>
      request<Array<{
        id: string;
        customerId?: string;
        date: string;
        rawInput: string;
        customerProfile: unknown;
        intelligence: unknown;
        metrics: unknown;
        suggestions: string[];
      }>>('/api/interactions', { params: customerId ? { customerId } : {} }),
    create: (body: {
      customerId?: string;
      date?: string;
      rawInput: string;
      customerProfile: unknown;
      intelligence: unknown;
      metrics: unknown;
      suggestions: string[];
    }) =>
      request<{
        id: string;
        customerId?: string;
        date: string;
        rawInput: string;
        customerProfile: unknown;
        intelligence: unknown;
        metrics: unknown;
        suggestions: string[];
      }>('/api/interactions', { method: 'POST', body: JSON.stringify(body) }),
    get: (id: string) =>
      request<{
        id: string;
        customerId?: string;
        date: string;
        rawInput: string;
        customerProfile: unknown;
        intelligence: unknown;
        metrics: unknown;
        suggestions: string[];
      }>(`/api/interactions/${id}`),
    delete: (id: string) => request<void>(`/api/interactions/${id}`, { method: 'DELETE' }),
  },
  schedules: {
    list: (customerId?: string) =>
      request<Array<{
        id: string;
        customerId?: string;
        title: string;
        date: string;
        time?: string;
        description?: string;
        status: 'pending' | 'completed';
      }>>('/api/schedules', { params: customerId ? { customerId } : {} }),
    create: (body: {
      customerId?: string;
      title: string;
      date: string;
      time?: string;
      description?: string;
      status?: 'pending' | 'completed';
    }) =>
      request<{
        id: string;
        customerId?: string;
        title: string;
        date: string;
        time?: string;
        description?: string;
        status: 'pending' | 'completed';
      }>('/api/schedules', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: Partial<{ customerId: string; title: string; date: string; time: string; description: string; status: 'pending' | 'completed' }>) =>
      request<{
        id: string;
        customerId?: string;
        title: string;
        date: string;
        time?: string;
        description?: string;
        status: 'pending' | 'completed';
      }>(`/api/schedules/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (id: string) => request<void>(`/api/schedules/${id}`, { method: 'DELETE' }),
  },
  coursePlans: {
    list: (customerId?: string) =>
      request<Array<{
        id: string;
        customerId: string;
        title: string;
        objective: string;
        modules: { name: string; topics: string[]; duration: string }[];
        resources: string[];
        createdAt: string;
      }>>('/api/course-plans', { params: customerId ? { customerId } : {} }),
    create: (body: {
      customerId: string;
      title: string;
      objective: string;
      modules?: { name: string; topics: string[]; duration: string }[];
      resources?: string[];
    }) =>
      request<{
        id: string;
        customerId: string;
        title: string;
        objective: string;
        modules: { name: string; topics: string[]; duration: string }[];
        resources: string[];
        createdAt: string;
      }>('/api/course-plans', { method: 'POST', body: JSON.stringify(body) }),
    get: (id: string) =>
      request<{
        id: string;
        customerId: string;
        title: string;
        objective: string;
        modules: { name: string; topics: string[]; duration: string }[];
        resources: string[];
        createdAt: string;
      }>(`/api/course-plans/${id}`),
    delete: (id: string) => request<void>(`/api/course-plans/${id}`, { method: 'DELETE' }),
  },
  /** REST API：AI 能力（分析、情景演练、语音转写、课程计划等） */
  ai: {
    analyzeSalesInteraction: (body: { input: string; audioData?: { data: string; mimeType: string }; locale?: string }) =>
      request<{ customerProfile: unknown; intelligence: unknown; metrics: unknown; suggestions: string[] }>(
        '/api/ai/analyze-sales-interaction',
        { method: 'POST', body: JSON.stringify(body) }
      ),
    rolePlayInit: (body: { customer: { name: string; company: string; [k: string]: unknown }; context?: string }) =>
      request<{ text: string }>('/api/ai/role-play-init', { method: 'POST', body: JSON.stringify(body) }),
    rolePlayMessage: (body: {
      customer: { name: string; company: string; [k: string]: unknown };
      context?: string;
      history: { role: string; text: string }[];
      message: string;
    }) =>
      request<{ text: string }>('/api/ai/role-play-message', { method: 'POST', body: JSON.stringify(body) }),
    evaluateRolePlay: (body: { history: { role: string; text: string }[] }) =>
      request<{ score: number; strengths: string[]; improvements: string[]; suggestedScripts?: unknown[]; dimensions?: unknown }>(
        '/api/ai/evaluate-role-play',
        { method: 'POST', body: JSON.stringify(body) }
      ),
    transcribeAudio: (body: { base64Data: string; mimeType?: string }) =>
      request<{ text: string }>('/api/ai/transcribe-audio', { method: 'POST', body: JSON.stringify(body) }),
    deepDiveInterest: (body: { interest: string; customer: { name: string; [k: string]: unknown } }) =>
      request<{ text: string }>('/api/ai/deep-dive-interest', { method: 'POST', body: JSON.stringify(body) }),
    continueDeepDive: (body: {
      interest: string;
      customer: { name: string; [k: string]: unknown };
      history: { role: string; text: string }[];
      question: string;
    }) =>
      request<{ text: string }>('/api/ai/continue-deep-dive', { method: 'POST', body: JSON.stringify(body) }),
    askAboutInteraction: (body: {
      interaction: { customerProfile: unknown; [k: string]: unknown };
      history: { role: string; text: string }[];
      question: string;
    }) =>
      request<{ text: string }>('/api/ai/ask-about-interaction', { method: 'POST', body: JSON.stringify(body) }),
    generateCoursePlan: (body: { customer: { name: string; company: string; [k: string]: unknown }; context?: string }) =>
      request<{ title?: string; objective?: string; modules?: unknown[]; resources?: string[] }>(
        '/api/ai/generate-course-plan',
        { method: 'POST', body: JSON.stringify(body) }
      ),
    parseScheduleVoice: (body: { text: string }) =>
      request<{ title: string; date: string; time?: string; customerName?: string; description?: string }>(
        '/api/ai/parse-schedule-voice',
        { method: 'POST', body: JSON.stringify(body) }
      ),
    parseCustomerVoice: (body: { text: string }) =>
      request<{ name: string; company: string; role?: string; industry?: string }>(
        '/api/ai/parse-customer-voice',
        { method: 'POST', body: JSON.stringify(body) }
      ),
    extractSearchKeywords: (body: { text: string }) =>
      request<{ keywords: string }>('/api/ai/extract-search-keywords', { method: 'POST', body: JSON.stringify(body) }),
  },
};

export { getToken };
