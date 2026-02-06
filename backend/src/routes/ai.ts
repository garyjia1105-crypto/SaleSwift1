import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import * as ai from '../ai/gemini.js';

export const aiRouter = Router();
aiRouter.use(authMiddleware);

const QUOTA_MSG = 'AI quota exceeded. Try again later.';

function isQuotaError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return /429|quota|resource_exhausted/i.test(msg);
}

function safeErrorMsg(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes('API_KEY') || msg.includes('apiKey') || msg.includes('apikey')) return 'API key not configured or invalid';
  if (msg.includes('ENOTFOUND') || msg.includes('ETIMEDOUT') || msg.includes('fetch failed')) {
    const hasProxy = !!(process.env.HTTPS_PROXY || process.env.HTTP_PROXY);
    return hasProxy 
      ? 'Unable to reach AI service. Check your network or proxy settings.'
      : 'Unable to reach AI service. If you are in mainland China, you may need to configure HTTPS_PROXY in .env file.';
  }
  if (msg.includes('429') || msg.includes('quota') || msg.includes('resource_exhausted')) return QUOTA_MSG;
  if (msg.includes('404') || msg.includes('model')) return 'AI model unavailable. Please update configuration.';
  if (msg.length > 120) return 'AI service error. Check backend logs.';
  return msg || 'AI analysis failed';
}

function handleAiError(res: import('express').Response, e: unknown, logLabel: string): import('express').Response {
  console.error(logLabel, e);
  // 输出更详细的错误信息到控制台，便于调试
  if (e instanceof Error) {
    console.error(`${logLabel} Error details:`, {
      name: e.name,
      message: e.message,
      stack: e.stack?.split('\n').slice(0, 3).join('\n'),
    });
  }
  if (isQuotaError(e)) return res.status(429).json({ error: QUOTA_MSG });
  return res.status(500).json({ error: safeErrorMsg(e) });
}

/** 从请求头提取用户提供的 Gemini API Key（如果提供） */
function getCustomApiKey(req: import('express').Request): string | undefined {
  const headerKey = req.headers['x-gemini-api-key'] || req.headers['X-Gemini-API-Key'];
  if (typeof headerKey === 'string' && headerKey.trim()) {
    return headerKey.trim();
  }
  return undefined;
}

aiRouter.post('/analyze-sales-interaction', async (req, res) => {
  try {
    const { input, audioData, locale } = req.body;
    const customApiKey = getCustomApiKey(req);
    const result = await ai.analyzeSalesInteraction(input, audioData, locale, customApiKey);
    return res.json(result);
  } catch (e) {
    return handleAiError(res, e, 'analyze-sales-interaction:');
  }
});

aiRouter.post('/role-play-init', async (req, res) => {
  try {
    const { customer, context } = req.body;
    if (!customer?.name || !customer?.company) {
      return res.status(400).json({ error: 'customer.name and customer.company required' });
    }
    const customApiKey = getCustomApiKey(req);
    const text = await ai.rolePlayInit(customer, context || '', customApiKey);
    return res.json({ text });
  } catch (e) {
    return handleAiError(res, e, 'role-play-init:');
  }
});

aiRouter.post('/role-play-message', async (req, res) => {
  try {
    const { customer, context, history, message } = req.body;
    if (!customer?.name || !customer?.company || message === undefined) {
      return res.status(400).json({ error: 'customer and message required' });
    }
    const customApiKey = getCustomApiKey(req);
    const text = await ai.rolePlayMessage(customer, context || '', Array.isArray(history) ? history : [], message, customApiKey);
    return res.json({ text });
  } catch (e) {
    return handleAiError(res, e, 'role-play-message:');
  }
});

aiRouter.post('/evaluate-role-play', async (req, res) => {
  try {
    const { history } = req.body;
    if (!Array.isArray(history)) {
      return res.status(400).json({ error: 'history array required' });
    }
    const customApiKey = getCustomApiKey(req);
    const result = await ai.evaluateRolePlay(history, customApiKey);
    return res.json(result);
  } catch (e) {
    return handleAiError(res, e, 'evaluate-role-play:');
  }
});

aiRouter.post('/transcribe-audio', async (req, res) => {
  try {
    const { base64Data, mimeType } = req.body;
    if (!base64Data) {
      return res.status(400).json({ error: 'base64Data required' });
    }
    if (base64Data.length < 100) {
      return res.status(400).json({ error: '音频数据太短，请重新录音（至少录音2秒）' });
    }
    
    // 支持的音频格式
    const supportedTypes = ['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/mpeg'];
    const finalMimeType = mimeType && supportedTypes.some(t => mimeType.includes(t.split('/')[1])) 
      ? mimeType 
      : 'audio/webm';
    
    console.log('转录音频，MIME类型:', finalMimeType, '数据长度:', base64Data.length);
    
    const customApiKey = getCustomApiKey(req);
    const text = await ai.transcribeAudio(base64Data, finalMimeType, customApiKey);
    if (!text || !text.trim()) {
      return res.status(500).json({ error: '未能识别出文字内容，请重新录音或检查音频质量' });
    }
    return res.json({ text });
  } catch (e) {
    return handleAiError(res, e, 'transcribe-audio:');
  }
});

aiRouter.post('/deep-dive-interest', async (req, res) => {
  try {
    const { interest, customer } = req.body;
    if (!interest || !customer?.name) {
      return res.status(400).json({ error: 'interest and customer required' });
    }
    const customApiKey = getCustomApiKey(req);
    const text = await ai.deepDiveIntoInterest(interest, customer, customApiKey);
    return res.json({ text });
  } catch (e) {
    return handleAiError(res, e, 'deep-dive-interest:');
  }
});

aiRouter.post('/continue-deep-dive', async (req, res) => {
  try {
    const { interest, customer, history, question } = req.body;
    if (!interest || !customer?.name || !Array.isArray(history) || question === undefined) {
      return res.status(400).json({ error: 'interest, customer, history, question required' });
    }
    const customApiKey = getCustomApiKey(req);
    const text = await ai.continueDeepDiveIntoInterest(interest, customer, history, question, customApiKey);
    return res.json({ text });
  } catch (e) {
    return handleAiError(res, e, 'continue-deep-dive:');
  }
});

aiRouter.post('/ask-about-interaction', async (req, res) => {
  try {
    const { interaction, history, question } = req.body;
    if (!interaction?.customerProfile || question === undefined) {
      return res.status(400).json({ error: 'interaction and question required' });
    }
    const customApiKey = getCustomApiKey(req);
    const text = await ai.askAboutInteraction(
      interaction,
      Array.isArray(history) ? history : [],
      question,
      customApiKey
    );
    return res.json({ text });
  } catch (e) {
    return handleAiError(res, e, 'ask-about-interaction:');
  }
});

aiRouter.post('/generate-course-plan', async (req, res) => {
  try {
    const { customer, context } = req.body;
    if (!customer?.name || !customer?.company) {
      return res.status(400).json({ error: 'customer required' });
    }
    const customApiKey = getCustomApiKey(req);
    const result = await ai.generateCoursePlan(customer, context || '', customApiKey);
    return res.json(result);
  } catch (e) {
    return handleAiError(res, e, 'generate-course-plan:');
  }
});

aiRouter.post('/parse-schedule-voice', async (req, res) => {
  try {
    const { text } = req.body;
    if (typeof text !== 'string') {
      return res.status(400).json({ error: 'text required' });
    }
    const customApiKey = getCustomApiKey(req);
    const result = await ai.parseScheduleVoice(text, customApiKey);
    return res.json(result);
  } catch (e) {
    return handleAiError(res, e, 'parse-schedule-voice:');
  }
});

aiRouter.post('/parse-customer-voice', async (req, res) => {
  try {
    const { text } = req.body;
    if (typeof text !== 'string') {
      return res.status(400).json({ error: 'text required' });
    }
    const customApiKey = getCustomApiKey(req);
    const result = await ai.parseCustomerVoiceInput(text, customApiKey);
    return res.json(result);
  } catch (e) {
    return handleAiError(res, e, 'parse-customer-voice:');
  }
});

aiRouter.post('/extract-search-keywords', async (req, res) => {
  try {
    const { text } = req.body;
    if (typeof text !== 'string') {
      return res.status(400).json({ error: 'text required' });
    }
    const customApiKey = getCustomApiKey(req);
    const keywords = await ai.extractSearchKeywords(text, customApiKey);
    return res.json({ keywords });
  } catch (e) {
    return handleAiError(res, e, 'extract-search-keywords:');
  }
});
