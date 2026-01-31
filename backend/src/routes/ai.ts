import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import * as ai from '../ai/gemini.js';

export const aiRouter = Router();
aiRouter.use(authMiddleware);

function safeErrorMsg(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes('API_KEY') || msg.includes('apiKey') || msg.includes('apikey')) return 'API key not configured or invalid';
  if (msg.includes('ENOTFOUND') || msg.includes('ETIMEDOUT') || msg.includes('fetch')) return 'Unable to reach AI service. Check your network.';
  if (msg.includes('429') || msg.includes('quota') || msg.includes('resource_exhausted')) return 'AI quota exceeded. Try again later.';
  if (msg.includes('404') || msg.includes('model')) return 'AI model unavailable. Please update configuration.';
  if (msg.length > 120) return 'AI service error. Check backend logs.';
  return msg || 'AI analysis failed';
}

aiRouter.post('/analyze-sales-interaction', async (req, res) => {
  try {
    const { input, audioData } = req.body;
    const result = await ai.analyzeSalesInteraction(input, audioData);
    return res.json(result);
  } catch (e) {
    console.error('analyze-sales-interaction:', e);
    return res.status(500).json({ error: safeErrorMsg(e) });
  }
});

aiRouter.post('/role-play-init', async (req, res) => {
  try {
    const { customer, context } = req.body;
    if (!customer?.name || !customer?.company) {
      return res.status(400).json({ error: 'customer.name and customer.company required' });
    }
    const text = await ai.rolePlayInit(customer, context || '');
    return res.json({ text });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Role play init failed' });
  }
});

aiRouter.post('/role-play-message', async (req, res) => {
  try {
    const { customer, context, history, message } = req.body;
    if (!customer?.name || !customer?.company || message === undefined) {
      return res.status(400).json({ error: 'customer and message required' });
    }
    const text = await ai.rolePlayMessage(customer, context || '', Array.isArray(history) ? history : [], message);
    return res.json({ text });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Role play message failed' });
  }
});

aiRouter.post('/evaluate-role-play', async (req, res) => {
  try {
    const { history } = req.body;
    if (!Array.isArray(history)) {
      return res.status(400).json({ error: 'history array required' });
    }
    const result = await ai.evaluateRolePlay(history);
    return res.json(result);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Evaluate role play failed' });
  }
});

aiRouter.post('/transcribe-audio', async (req, res) => {
  try {
    const { base64Data, mimeType } = req.body;
    if (!base64Data) {
      return res.status(400).json({ error: 'base64Data required' });
    }
    const text = await ai.transcribeAudio(base64Data, mimeType || 'audio/webm');
    return res.json({ text });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Transcribe failed' });
  }
});

aiRouter.post('/deep-dive-interest', async (req, res) => {
  try {
    const { interest, customer } = req.body;
    if (!interest || !customer?.name) {
      return res.status(400).json({ error: 'interest and customer required' });
    }
    const text = await ai.deepDiveIntoInterest(interest, customer);
    return res.json({ text });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Deep dive failed' });
  }
});

aiRouter.post('/continue-deep-dive', async (req, res) => {
  try {
    const { interest, customer, history, question } = req.body;
    if (!interest || !customer?.name || !Array.isArray(history) || question === undefined) {
      return res.status(400).json({ error: 'interest, customer, history, question required' });
    }
    const text = await ai.continueDeepDiveIntoInterest(interest, customer, history, question);
    return res.json({ text });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Continue deep dive failed' });
  }
});

aiRouter.post('/ask-about-interaction', async (req, res) => {
  try {
    const { interaction, history, question } = req.body;
    if (!interaction?.customerProfile || question === undefined) {
      return res.status(400).json({ error: 'interaction and question required' });
    }
    const text = await ai.askAboutInteraction(
      interaction,
      Array.isArray(history) ? history : [],
      question
    );
    return res.json({ text });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Ask about interaction failed' });
  }
});

aiRouter.post('/generate-course-plan', async (req, res) => {
  try {
    const { customer, context } = req.body;
    if (!customer?.name || !customer?.company) {
      return res.status(400).json({ error: 'customer required' });
    }
    const result = await ai.generateCoursePlan(customer, context || '');
    return res.json(result);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Generate course plan failed' });
  }
});

aiRouter.post('/parse-schedule-voice', async (req, res) => {
  try {
    const { text } = req.body;
    if (typeof text !== 'string') {
      return res.status(400).json({ error: 'text required' });
    }
    const result = await ai.parseScheduleVoice(text);
    return res.json(result);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Parse schedule voice failed' });
  }
});

aiRouter.post('/parse-customer-voice', async (req, res) => {
  try {
    const { text } = req.body;
    if (typeof text !== 'string') {
      return res.status(400).json({ error: 'text required' });
    }
    const result = await ai.parseCustomerVoiceInput(text);
    return res.json(result);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Parse customer voice failed' });
  }
});

aiRouter.post('/extract-search-keywords', async (req, res) => {
  try {
    const { text } = req.body;
    if (typeof text !== 'string') {
      return res.status(400).json({ error: 'text required' });
    }
    const keywords = await ai.extractSearchKeywords(text);
    return res.json({ keywords });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Extract keywords failed' });
  }
});
