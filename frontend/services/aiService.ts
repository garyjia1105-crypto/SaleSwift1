import type { Interaction, Customer, RolePlayEvaluation, CoursePlan } from '../types';
import { getToken } from './api';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

async function aiRequest<T>(path: string, body: unknown): Promise<T> {
  const token = getToken();
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || res.statusText || 'AI request failed');
    return data as T;
  } catch (err) {
    // 过滤掉浏览器扩展相关的错误
    const error = err as Error;
    if (error.message?.includes('message channel closed') || 
        error.message?.includes('listener indicated') ||
        error.message?.includes('content.bundle.js')) {
      // 这是浏览器扩展错误，忽略它，但重新抛出原始错误
      console.warn('浏览器扩展错误已忽略:', error.message);
      // 继续抛出，但使用更友好的消息
      throw new Error('网络请求失败，请检查网络连接或稍后重试');
    }
    throw err;
  }
}

export async function analyzeSalesInteraction(
  input: string,
  audioData?: { data: string; mimeType: string }
): Promise<{
  customerProfile: Interaction['customerProfile'];
  intelligence: Interaction['intelligence'];
  metrics: Interaction['metrics'];
  suggestions: string[];
}> {
  return aiRequest('/api/ai/analyze-sales-interaction', { input, audioData });
}

export async function rolePlayInit(customer: Customer, context: string): Promise<string> {
  const { text } = await aiRequest<{ text: string }>('/api/ai/role-play-init', { customer, context });
  return text;
}

export async function rolePlayMessage(
  customer: Customer,
  context: string,
  history: { role: string; text: string }[],
  message: string
): Promise<string> {
  const { text } = await aiRequest<{ text: string }>('/api/ai/role-play-message', {
    customer,
    context,
    history,
    message,
  });
  return text;
}

export async function evaluateRolePlay(history: { role: string; text: string }[]): Promise<RolePlayEvaluation> {
  return aiRequest<RolePlayEvaluation>('/api/ai/evaluate-role-play', { history });
}

export async function transcribeAudio(base64Data: string, mimeType: string): Promise<string> {
  const { text } = await aiRequest<{ text: string }>('/api/ai/transcribe-audio', { base64Data, mimeType });
  return text;
}

export async function deepDiveIntoInterest(interest: string, customer: Customer): Promise<string> {
  const { text } = await aiRequest<{ text: string }>('/api/ai/deep-dive-interest', { interest, customer });
  return text;
}

export async function continueDeepDiveIntoInterest(
  interest: string,
  customer: Customer,
  history: { role: string; text: string }[],
  question: string
): Promise<string> {
  const { text } = await aiRequest<{ text: string }>('/api/ai/continue-deep-dive', {
    interest,
    customer,
    history,
    question,
  });
  return text;
}

export async function askAboutInteraction(
  interaction: Interaction,
  history: { role: string; text: string }[],
  question: string
): Promise<string> {
  const { text } = await aiRequest<{ text: string }>('/api/ai/ask-about-interaction', {
    interaction,
    history,
    question,
  });
  return text;
}

export async function generateCoursePlan(customer: Customer, context: string): Promise<Partial<CoursePlan>> {
  return aiRequest<Partial<CoursePlan>>('/api/ai/generate-course-plan', { customer, context });
}

export async function parseScheduleVoice(text: string): Promise<{
  title: string;
  date: string;
  time?: string;
  customerName?: string;
  description?: string;
}> {
  return aiRequest('/api/ai/parse-schedule-voice', { text });
}

export async function parseCustomerVoiceInput(text: string): Promise<{
  name: string;
  company: string;
  role?: string;
  industry?: string;
}> {
  return aiRequest('/api/ai/parse-customer-voice', { text });
}

export async function extractSearchKeywords(text: string): Promise<string> {
  const { keywords } = await aiRequest<{ keywords: string }>('/api/ai/extract-search-keywords', { text });
  return keywords || '';
}
