const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

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
  const url = new URL(path.startsWith('http') ? path : `${API_BASE}${path}`);
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
};

export { getToken };
