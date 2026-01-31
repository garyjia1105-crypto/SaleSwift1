import { GoogleGenAI, Type } from '@google/genai';

const getAI = () => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY not set');
  const baseUrl = process.env.GEMINI_BASE_URL?.trim();
  const opts: { apiKey: string; httpOptions?: { baseUrl: string } } = { apiKey: key };
  if (baseUrl) opts.httpOptions = { baseUrl };
  return new GoogleGenAI(opts);
};

const getModel = (prefer: 'flash' | 'pro' = 'flash') => {
  return prefer === 'pro' ? 'gemini-2.0-flash' : 'gemini-2.0-flash';
};

const EVALUATION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    score: { type: Type.NUMBER },
    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
    improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
    suggestedScripts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          situation: { type: Type.STRING },
          original: { type: Type.STRING },
          better: { type: Type.STRING },
        },
      },
    },
    dimensions: {
      type: Type.OBJECT,
      properties: {
        professionalism: { type: Type.NUMBER },
        empathy: { type: Type.NUMBER },
        probing: { type: Type.NUMBER },
        closing: { type: Type.NUMBER },
        handlingObjections: { type: Type.NUMBER },
      },
    },
  },
  required: ['score', 'strengths', 'improvements', 'dimensions'],
};

const ROLE_PLAY_SYSTEM = (customer: { name: string; role: string; company: string }) => `
你现在扮演客户：${customer.name}，职位是 ${customer.role}，在 ${customer.company} 工作。
性格特征：资深、理性、时间观念极强、注重实际价值。

重要规则：
1. **根据销售的具体内容回复**：仔细阅读销售说的话，针对性地回应，不要使用模板化回复。
2. **真实自然的对话**：像真实客户一样，根据销售提出的具体问题、方案或建议给出回应。
3. **拒绝敷衍**：如果销售回复过于简短（少于10个字）或缺乏专业性，表现出不悦或困惑。
4. **真实反馈**：模拟真实的商业阻力，提出合理的疑问和顾虑。
5. **引导深度对话**：通过追问来测试销售的需求挖掘能力。

禁止行为：
- 不要重复相同的回复
- 不要使用"visit tencent manager"这样的固定回复
- 不要忽略销售的具体内容
- 每次回复都要基于销售刚才说的话

请根据销售的具体发言，给出自然、真实、有针对性的客户回复。
`;

export async function rolePlayInit(customer: {
  name: string;
  role: string;
  company: string;
}, context: string): Promise<string> {
  const ai = getAI();
  const model = getModel('flash');
  const systemInstruction = ROLE_PLAY_SYSTEM(customer) + '\n开始时请主动发起一段话，说明你现在的状态。';
  const response = await ai.models.generateContent({
    model,
    contents: '请作为客户开始这段对话。',
    config: { systemInstruction, temperature: 0.9 },
  });
  return response.text?.trim() || '';
}

export async function rolePlayMessage(
  customer: { name: string; role: string; company: string },
  _context: string,
  history: { role: string; text: string }[],
  message: string
): Promise<string> {
  const ai = getAI();
  const model = getModel('flash');
  const systemInstruction = ROLE_PLAY_SYSTEM(customer);
  
  // 构建对话历史，确保格式清晰
  const conversationParts: string[] = [];
  history.forEach((h) => {
    const speaker = h.role === 'user' ? '销售' : '客户';
    conversationParts.push(`${speaker}: ${h.text}`);
  });
  
  // 添加当前销售的消息
  conversationParts.push(`销售: ${message}`);
  
  const conversation = conversationParts.join('\n');
  const fullPrompt = `${conversation}\n\n请作为客户 ${customer.name} 回复。注意：必须根据销售刚才说的具体内容（"${message}"）给出有针对性的回复，不要使用模板化或重复的回复。`;
  
  console.log('角色扮演提示词:', fullPrompt.substring(0, 200));
  
  const response = await ai.models.generateContent({
    model,
    contents: fullPrompt,
    config: { 
      systemInstruction, 
      temperature: 0.95, // 提高温度以增加回复多样性
      topP: 0.95,
      topK: 40
    },
  });
  return response.text?.trim() || '';
}

export async function deepDiveIntoInterest(
  interest: string,
  customer: { name: string; role: string; company: string }
): Promise<string> {
  const ai = getAI();
  const model = getModel('pro');
  const prompt = `你是一位顶尖的销售战略专家。针对客户 ${customer.name} (${customer.role} @ ${customer.company}) 表现出的关键兴趣点："${interest}"，请基于其行业背景提供一份【深度情报分析报告】。
内容需包含：核心驱动力分析、差异化竞争策略、高转化谈资、行动建议。使用 Markdown 格式。`;
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: { temperature: 0.7, topP: 0.95 },
  });
  return response.text || '未能获取深度解析。';
}

export async function continueDeepDiveIntoInterest(
  interest: string,
  customer: { name: string; role: string; company: string },
  history: { role: string; text: string }[],
  question: string
): Promise<string> {
  const ai = getAI();
  const model = getModel('pro');
  const context = history.map((h) => `${h.role === 'user' ? '用户提问' : 'AI分析'}: ${h.text}`).join('\n\n');
  const prompt = `背景：我们正在深入探讨客户 ${customer.name} (${customer.role} @ ${customer.company}) 对 "${interest}" 的兴趣。\n之前的对话：\n${context}\n用户的新问题："${question}"\n请继续提供深度的销售战略洞察。`;
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: { temperature: 0.8 },
  });
  return response.text || '未能获取更多深度解析。';
}

export async function askAboutInteraction(
  interaction: {
    customerProfile: { name: string; company: string; summary: string };
    intelligence: { painPoints: string[]; keyInterests: string[] };
    suggestions: string[];
  },
  history: { role: string; text: string }[],
  question: string
): Promise<string> {
  const ai = getAI();
  const model = getModel('flash');
  const context = `客户：${interaction.customerProfile.name} (@ ${interaction.customerProfile.company})\n摘要：${interaction.customerProfile.summary}\n痛点：${interaction.intelligence.painPoints.join(', ')}\n兴趣：${interaction.intelligence.keyInterests.join(', ')}\nAI建议：${interaction.suggestions.join('; ')}`;
  const conversation = history.map((h) => `${h.role === 'user' ? '用户' : '助理'}: ${h.text}`).join('\n');
  const prompt = `你是一位专业的销售助手。请基于以下访谈背景回答用户的追问。\n访谈背景：\n${context}\n历史对话：\n${conversation}\n新问题："${question}"`;
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: { temperature: 0.7 },
  });
  return response.text || '抱歉，我现在无法处理这个问题。';
}

export async function generateCoursePlan(
  customer: { name: string; role: string; company: string },
  context: string
): Promise<Record<string, unknown>> {
  const ai = getAI();
  const model = getModel('pro');
  const prompt = `客户：${customer.name} (${customer.role} @ ${customer.company})\n背景：${context}\n请输出 JSON 格式的课程规划方案，包含 title, objective, modules (数组，每项含 name, topics, duration), resources (数组)。`;
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          objective: { type: Type.STRING },
          modules: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                topics: { type: Type.ARRAY, items: { type: Type.STRING } },
                duration: { type: Type.STRING },
              },
            },
          },
          resources: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['title', 'objective', 'modules'],
      },
    },
  });
  return JSON.parse(response.text || '{}');
}

export async function transcribeAudio(base64Data: string, mimeType: string): Promise<string> {
  const ai = getAI();
  const model = getModel('flash');
  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { inlineData: { data: base64Data, mimeType } },
        { text: '请准确转录这段销售人员的语音内容。只需返回转录文本。' },
      ],
    },
  });
  return response.text?.trim() || '';
}

export async function evaluateRolePlay(history: { role: string; text: string }[]): Promise<Record<string, unknown>> {
  const ai = getAI();
  const model = getModel('pro');
  const content = history.map((h) => `${h.role === 'user' ? '销售' : '客户'}: ${h.text}`).join('\n');
  const prompt = `作为资深销售总监，请严厉且客观地评估以下销售模拟演练。评估准则：识别敷衍、专业度考核、扣分项、真实性。对话记录：\n${content}`;
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: { responseMimeType: 'application/json', responseSchema: EVALUATION_SCHEMA },
  });
  return JSON.parse(response.text || '{}');
}

export async function analyzeSalesInteraction(
  input: string,
  audioData?: { data: string; mimeType: string }
): Promise<Record<string, unknown>> {
  const ai = getAI();
  const model = getModel('flash');
  const parts: { text?: string; inlineData?: { data: string; mimeType: string } }[] = [{ text: input || '分析此次互动' }];
  if (audioData) parts.push({ inlineData: audioData });
  const response = await ai.models.generateContent({
    model,
    contents: { parts },
    config: {
      systemInstruction: '你是一位销售分析师。将语音或文本转化为结构化销售报告。务必提供详细的摘要和具体的下一步行动建议。',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          customerProfile: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              company: { type: Type.STRING },
              role: { type: Type.STRING },
              industry: { type: Type.STRING },
              summary: { type: Type.STRING },
            },
            required: ['name', 'summary'],
          },
          intelligence: {
            type: Type.OBJECT,
            properties: {
              painPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
              keyInterests: { type: Type.ARRAY, items: { type: Type.STRING } },
              currentStage: { type: Type.STRING },
              probability: { type: Type.NUMBER },
              nextSteps: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    action: { type: Type.STRING },
                    priority: { type: Type.STRING },
                    dueDate: { type: Type.STRING },
                  },
                },
              },
            },
            required: ['painPoints', 'currentStage', 'nextSteps'],
          },
          metrics: {
            type: Type.OBJECT,
            properties: {
              talkRatio: { type: Type.NUMBER },
              questionRate: { type: Type.NUMBER },
              sentiment: { type: Type.STRING },
              confidenceScore: { type: Type.NUMBER },
            },
          },
          suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['customerProfile', 'intelligence', 'metrics', 'suggestions'],
      },
    },
  });
  return JSON.parse(response.text || '{}');
}

export async function parseScheduleVoice(text: string): Promise<Record<string, unknown>> {
  const ai = getAI();
  const model = getModel('flash');
  const today = new Date().toISOString().split('T')[0];
  const response = await ai.models.generateContent({
    model,
    contents: `提取此日程: "${text}"`,
    config: {
      systemInstruction: `你是日程助理。从描述中提取日程信息。当前日期是 ${today}。如果用户说"明天"，请计算具体日期。`,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          date: { type: Type.STRING },
          time: { type: Type.STRING },
          customerName: { type: Type.STRING },
          description: { type: Type.STRING },
        },
        required: ['title', 'date'],
      },
    },
  });
  return JSON.parse(response.text || '{}');
}

export async function extractSearchKeywords(text: string): Promise<string> {
  const ai = getAI();
  const model = getModel('flash');
  const response = await ai.models.generateContent({
    model,
    contents: `从以下语音中提取搜索关键词（如人名、公司）："${text}"。只返回关键词，不要其他描述。`,
  });
  return response.text?.trim() || '';
}

export async function parseCustomerVoiceInput(text: string): Promise<Record<string, unknown>> {
  const ai = getAI();
  const model = getModel('flash');
  const response = await ai.models.generateContent({
    model,
    contents: text,
    config: {
      systemInstruction: '提取客户姓名、公司、职位、行业。',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          company: { type: Type.STRING },
          role: { type: Type.STRING },
          industry: { type: Type.STRING },
        },
        required: ['name', 'company'],
      },
    },
  });
  return JSON.parse(response.text || '{}');
}
