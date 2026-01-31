/**
 * AI 服务：统一通过后端 REST API（api.ai）调用，不再直接请求第三方
 */
import type { Interaction, Customer, RolePlayEvaluation, CoursePlan } from '../types';
import { api } from './api';

export async function analyzeSalesInteraction(
  input: string,
  audioData?: { data: string; mimeType: string }
): Promise<{
  customerProfile: Interaction['customerProfile'];
  intelligence: Interaction['intelligence'];
  metrics: Interaction['metrics'];
  suggestions: string[];
}> {
  return api.ai.analyzeSalesInteraction({ input, audioData });
}

export async function rolePlayInit(customer: Customer, context: string): Promise<string> {
  const { text } = await api.ai.rolePlayInit({ customer, context });
  return text;
}

export async function rolePlayMessage(
  customer: Customer,
  context: string,
  history: { role: string; text: string }[],
  message: string
): Promise<string> {
  const { text } = await api.ai.rolePlayMessage({ customer, context, history, message });
  return text;
}

export async function evaluateRolePlay(history: { role: string; text: string }[]): Promise<RolePlayEvaluation> {
  return api.ai.evaluateRolePlay({ history });
}

export async function transcribeAudio(base64Data: string, mimeType: string): Promise<string> {
  const { text } = await api.ai.transcribeAudio({ base64Data, mimeType });
  return text;
}

export async function deepDiveIntoInterest(interest: string, customer: Customer): Promise<string> {
  const { text } = await api.ai.deepDiveInterest({ interest, customer });
  return text;
}

export async function continueDeepDiveIntoInterest(
  interest: string,
  customer: Customer,
  history: { role: string; text: string }[],
  question: string
): Promise<string> {
  const { text } = await api.ai.continueDeepDive({ interest, customer, history, question });
  return text;
}

export async function askAboutInteraction(
  interaction: Interaction,
  history: { role: string; text: string }[],
  question: string
): Promise<string> {
  const { text } = await api.ai.askAboutInteraction({ interaction, history, question });
  return text;
}

export async function generateCoursePlan(customer: Customer, context: string): Promise<Partial<CoursePlan>> {
  return api.ai.generateCoursePlan({ customer, context });
}

export async function parseScheduleVoice(text: string): Promise<{
  title: string;
  date: string;
  time?: string;
  customerName?: string;
  description?: string;
}> {
  return api.ai.parseScheduleVoice({ text });
}

export async function parseCustomerVoiceInput(text: string): Promise<{
  name: string;
  company: string;
  role?: string;
  industry?: string;
}> {
  return api.ai.parseCustomerVoice({ text });
}

export async function extractSearchKeywords(text: string): Promise<string> {
  const { keywords } = await api.ai.extractSearchKeywords({ text });
  return keywords ?? '';
}
