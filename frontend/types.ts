
export enum SalesStage {
  PROSPECTING = '潜在客户',
  QUALIFICATION = '需求确认',
  PROPOSAL = '方案报价',
  NEGOTIATION = '商务谈判',
  CLOSED_WON = '赢单结案',
  CLOSED_LOST = '丢单结案'
}

export interface Customer {
  id: string;
  name: string;
  company: string;
  role: string;
  industry: string;
  email?: string;
  phone?: string;
  tags: string[];
  createdAt: string;
}

export interface CoursePlan {
  id: string;
  customerId: string;
  title: string;
  objective: string;
  modules: {
    name: string;
    topics: string[];
    duration: string;
  }[];
  resources: string[];
  createdAt: string;
}

export interface Schedule {
  id: string;
  customerId?: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  description?: string;
  status: 'pending' | 'completed';
  updatedAt?: string; // ISO string
}

export interface CustomerProfile {
  name: string;
  company: string;
  role: string;
  industry: string;
  summary: string;
}

export interface SalesIntelligence {
  painPoints: string[];
  keyInterests: string[];
  currentStage: SalesStage;
  probability: number;
  nextSteps: {
    action: string;
    priority: '高' | '中' | '低';
    dueDate?: string;
  }[];
}

export interface PerformanceMetrics {
  talkRatio: number; // 0 to 1
  questionRate: number; // Questions per minute
  sentiment: '正面' | '中立' | '负面';
  confidenceScore: number; // AI score 0 to 100
}

export interface Interaction {
  id: string;
  customerId?: string; 
  date: string;
  rawInput: string;
  customerProfile: CustomerProfile;
  intelligence: SalesIntelligence;
  metrics: PerformanceMetrics;
  suggestions: string[];
}

export interface RolePlayEvaluation {
  score: number;
  strengths: string[];
  improvements: string[];
  suggestedScripts: {
    situation: string;
    original: string;
    better: string;
  }[];
  dimensions: {
    professionalism: number;
    empathy: number;
    probing: number;
    closing: number;
    handlingObjections: number;
  };
}
