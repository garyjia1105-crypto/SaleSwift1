
import { GoogleGenAI, Type } from "@google/genai";
import { Interaction, Customer, RolePlayEvaluation, CoursePlan } from "../types";

// Helper to get the AI instance.
const getAI = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// Helper to get the preferred model based on task type.
const getModel = (prefer: 'flash' | 'pro' = 'flash') => {
  return prefer === 'pro' ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
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
          better: { type: Type.STRING }
        }
      }
    },
    dimensions: {
      type: Type.OBJECT,
      properties: {
        professionalism: { type: Type.NUMBER },
        empathy: { type: Type.NUMBER },
        probing: { type: Type.NUMBER },
        closing: { type: Type.NUMBER },
        handlingObjections: { type: Type.NUMBER }
      }
    }
  },
  required: ["score", "strengths", "improvements", "dimensions"]
};

export const startRolePlayChat = (customer: Customer, context: string) => {
  const ai = getAI();
  const model = getModel('flash');
  const systemInstruction = `
    你现在扮演客户：${customer.name}，职位是 ${customer.role}，在 ${customer.company} 工作。
    性格特征：资深、理性、时间观念极强。
    演练目标：用户（销售）需要说服你考虑他们的方案或达成下一步共识。

    行为准则：
    1. **拒绝敷衍**：如果用户回复过于简短（如少于10个字）或缺乏专业性，请表现出不悦或困惑，例如：“我没太听懂你的意思，这就是你的专业水平吗？”
    2. **真实反馈**：模拟真实的商业阻力。如果你觉得销售没有触及你的痛点，不要轻易妥协。
    3. **引导深度对话**：通过追问来测试用户的需求挖掘能力。
    
    开始时请主动发起一段话，说明你现在的状态。
  `;
  return ai.chats.create({
    model,
    config: { systemInstruction, temperature: 0.9 }
  });
};

export const deepDiveIntoInterest = async (interest: string, customer: any): Promise<string> => {
  const ai = getAI();
  const model = getModel('pro');
  const prompt = `你是一位顶尖的销售战略专家。针对客户 ${customer.name} (${customer.role} @ ${customer.company}) 表现出的关键兴趣点：“${interest}”，请基于其行业背景提供一份【深度情报分析报告】。

内容需包含：
1. **核心驱动力分析**：该兴趣点背后隐藏的真实痛点、KPI指标或商业野心是什么？
2. **差异化竞争策略**：目前行业内解决该问题的常见误区是什么？我们应如何通过“重新定义问题”来体现专业度？
3. **高转化谈资**：提供2-3条能够瞬间击中客户兴趣的具体论据、趋势数据或匿名标杆案例思路。
4. **行动建议**：建议销售在下一次沟通中使用的具体提问技巧或引导话术。

要求：
- 语气专业且具洞察力，避免空话。
- 结构清晰，使用 Markdown 格式（标题、列表、加粗）。
- 针对性强，结合客户的职位和公司背景。`;
  
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      temperature: 0.7,
      topP: 0.95,
    }
  });
  return response.text || "未能获取深度解析。";
};

export const continueDeepDiveIntoInterest = async (interest: string, customer: any, history: { role: string, text: string }[], question: string): Promise<string> => {
  const ai = getAI();
  const model = getModel('pro');
  const context = history.map(h => `${h.role === 'user' ? '用户提问' : 'AI分析'}: ${h.text}`).join('\n\n');
  const prompt = `
    背景：我们正在深入探讨客户 ${customer.name} (${customer.role} @ ${customer.company}) 对 “${interest}” 的兴趣。
    
    之前的对话上下文：
    ${context}
    
    用户的新问题：
    "${question}"
    
    请继续提供深度的销售战略洞察。回答应保持专业、尖锐、且极具商业实操价值。
  `;
  
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      temperature: 0.8,
    }
  });
  return response.text || "未能获取更多深度解析。";
};

export const askAboutInteraction = async (interaction: Interaction, history: { role: string, text: string }[], question: string): Promise<string> => {
  const ai = getAI();
  const model = getModel('flash'); // Interaction general chat can be faster
  const context = `
    访谈背景：
    客户：${interaction.customerProfile.name} (@ ${interaction.customerProfile.company})
    摘要：${interaction.customerProfile.summary}
    痛点：${interaction.intelligence.painPoints.join(', ')}
    兴趣：${interaction.intelligence.keyInterests.join(', ')}
    AI建议：${interaction.suggestions.join('; ')}
  `;
  const conversation = history.map(h => `${h.role === 'user' ? '用户' : '助理'}: ${h.text}`).join('\n');
  const prompt = `
    你是一位专业的销售助手。请基于以下访谈背景回答用户的追问。
    
    访谈背景：
    ${context}
    
    历史对话：
    ${conversation}
    
    新问题：
    "${question}"
  `;
  
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: { temperature: 0.7 }
  });
  return response.text || "抱歉，我现在无法处理这个问题。";
};

export const generateCoursePlan = async (customer: Customer, context: string): Promise<Partial<CoursePlan>> => {
  const ai = getAI();
  const model = getModel('pro');
  const systemInstruction = `你是一位专业的企业培训课程设计师。请根据客户背景和之前的沟通历史，设计一套定制化的课程规划。`;
  const prompt = `
    客户：${customer.name} (${customer.role} @ ${customer.company})
    背景：${context}
    
    请输出 JSON 格式的课程规划方案。
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
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
                duration: { type: Type.STRING }
              }
            }
          },
          resources: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["title", "objective", "modules"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

export const transcribeAudio = async (base64Data: string, mimeType: string): Promise<string> => {
  const ai = getAI();
  const model = getModel('flash');
  const prompt = "请准确转录这段销售人员的语音内容。只需返回转录文本。";
  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { inlineData: { data: base64Data, mimeType } },
        { text: prompt }
      ]
    }
  });
  return response.text?.trim() || "";
};

export const evaluateRolePlay = async (history: { role: string, text: string }[]): Promise<RolePlayEvaluation> => {
  const ai = getAI();
  const model = getModel('pro'); // Evaluation needs 'pro' for better reasoning
  const content = history.map(h => `${h.role === 'user' ? '销售' : '客户'}: ${h.text}`).join('\n');
  
  const prompt = `
    作为资深销售总监，请严厉且客观地评估以下销售模拟演练。
    
    评估准则（必须严格遵守）：
    1. **识别敷衍**：如果销售人员的回复普遍偏短（例如大多在15字以内）或只是简单的礼貌性回复，总分禁止超过 40 分。
    2. **专业度考核**：检查销售是否使用了诸如 SPIN、利益点转化、同理心倾听等技巧。
    3. **扣分项**：对于缺乏内容、回答敷衍、态度不积极的情况，必须在“改进建议”中直接批评。
    4. **真实性**：不需要为了鼓励而给高分，我们要的是真实的反馈。

    对话记录：\n${content}
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: { responseMimeType: "application/json", responseSchema: EVALUATION_SCHEMA }
  });
  return JSON.parse(response.text || '{}');
};

export const analyzeSalesInteraction = async (input: string, audioData?: { data: string, mimeType: string }) => {
  const ai = getAI();
  const model = getModel('flash');
  const systemInstruction = "你是一位销售分析师。将语音或文本转化为结构化销售报告。务必提供详细的摘要和具体的下一步行动建议。";
  const parts: any[] = [{ text: input || "分析此次互动" }];
  if (audioData) parts.push({ inlineData: audioData });
  const response = await ai.models.generateContent({
    model,
    contents: { parts },
    config: { systemInstruction, responseMimeType: "application/json", responseSchema: {
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
            required: ["name", "summary"]
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
                    dueDate: { type: Type.STRING }
                  }
                }
              }
            },
            required: ["painPoints", "currentStage", "nextSteps"]
          },
          metrics: {
            type: Type.OBJECT,
            properties: {
              talkRatio: { type: Type.NUMBER },
              questionRate: { type: Type.NUMBER },
              sentiment: { type: Type.STRING },
              confidenceScore: { type: Type.NUMBER }
            }
          },
          suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["customerProfile", "intelligence", "metrics", "suggestions"]
      } 
    }
  });
  return JSON.parse(response.text || '{}');
};

export const parseScheduleVoice = async (text: string): Promise<any> => {
  const ai = getAI();
  const model = getModel('flash');
  const systemInstruction = `你是一个日程助理。从用户的描述中提取日程信息。当前日期是 ${new Date().toISOString().split('T')[0]}。
  如果用户说“明天”，请计算具体日期。`;
  const response = await ai.models.generateContent({
    model,
    contents: `提取此日程: "${text}"`,
    config: { systemInstruction, responseMimeType: "application/json", responseSchema: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "日程主题，如：拜访、开会" },
        date: { type: Type.STRING, description: "日期格式 YYYY-MM-DD" },
        time: { type: Type.STRING, description: "时间格式 HH:mm" },
        customerName: { type: Type.STRING, description: "提到的客户姓名或公司名" },
        description: { type: Type.STRING, description: "额外备注内容" }
      },
      required: ["title", "date"]
    } }
  });
  return JSON.parse(response.text || '{}');
};

export const extractSearchKeywords = async (text: string): Promise<string> => {
  const ai = getAI();
  const model = getModel('flash');
  const response = await ai.models.generateContent({
    model,
    contents: `从以下语音中提取搜索关键词（如人名、公司）："${text}"。只返回关键词，不要其他描述。`,
  });
  return response.text?.trim() || "";
};

export const parseCustomerVoiceInput = async (text: string) => {
  const ai = getAI();
  const model = getModel('flash');
  const systemInstruction = "提取客户姓名、公司、职位、行业。";
  const response = await ai.models.generateContent({
    model,
    contents: text,
    config: { systemInstruction, responseMimeType: "application/json", responseSchema: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        company: { type: Type.STRING },
        role: { type: Type.STRING },
        industry: { type: Type.STRING }
      },
      required: ["name", "company"]
    }}
  });
  return JSON.parse(response.text || '{}');
};
