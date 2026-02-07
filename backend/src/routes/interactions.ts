import { Router } from 'express';
import mongoose from 'mongoose';
import { authMiddleware } from '../middleware/auth.js';
import { Interaction } from '../lib/mongodb.js';

export const interactionsRouter = Router();
interactionsRouter.use(authMiddleware);

function toInteraction(doc: { _id: mongoose.Types.ObjectId; [key: string]: any }) {
  const rawIntel = doc.intelligence ?? {};
  const nextSteps = Array.isArray(rawIntel.nextSteps)
    ? rawIntel.nextSteps.map((s: any, i: number) => ({
        ...s,
        id: typeof s.id === 'string' && s.id.trim() ? s.id.trim() : `step-${i}`,
      }))
    : [];
  const intelligence = nextSteps.length ? { ...rawIntel, nextSteps } : rawIntel;
  return {
    id: doc._id.toString(),
    customerId: doc.customerId != null ? doc.customerId.toString() : null,
    date: doc.date ?? '',
    rawInput: doc.rawInput ?? '',
    customerProfile: doc.customerProfile ?? {},
    intelligence,
    metrics: doc.metrics ?? {},
    suggestions: Array.isArray(doc.suggestions) ? doc.suggestions : [],
  };
}

interactionsRouter.get('/', async (req: any, res) => {
  try {
    const customerId = req.query.customerId as string | undefined;
    const filter: any = { userId: req.user.id };
    if (customerId && mongoose.Types.ObjectId.isValid(customerId)) filter.customerId = customerId;
    const list = await Interaction.find(filter)
      .sort({ date: -1 })
      .lean();
    return res.json(list.map((d: any) => toInteraction(d)));
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to list interactions' });
  }
});

interactionsRouter.post('/', async (req: any, res) => {
  try {
    const { customerId, date, rawInput, customerProfile, intelligence, metrics, suggestions } = req.body;
    if (!customerProfile || !intelligence || !metrics || !Array.isArray(suggestions)) {
      return res.status(400).json({ error: 'customerProfile, intelligence, metrics, suggestions required' });
    }
    const validCustomerId = customerId && mongoose.Types.ObjectId.isValid(customerId) ? customerId : null;
    const interaction = await Interaction.create({
      userId: req.user.id,
      customerId: validCustomerId,
      date: date || new Date().toISOString(),
      rawInput: rawInput ?? '',
      customerProfile,
      intelligence,
      metrics,
      suggestions,
    });
    return res.status(201).json(toInteraction(interaction.toObject()));
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to create interaction' });
  }
});

interactionsRouter.get('/:id', async (req: any, res) => {
  try {
    if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const doc = await Interaction.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!doc) return res.status(404).json({ error: 'Interaction not found' });
    return res.json(toInteraction(doc.toObject()));
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to get interaction' });
  }
});

interactionsRouter.patch('/:id', async (req: any, res) => {
  try {
    if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const { customerId, intelligence } = req.body;
    const update: Record<string, unknown> = {};
    if (customerId === null || customerId === undefined || customerId === '') {
      update.customerId = null;
    } else if (typeof customerId === 'string' && mongoose.Types.ObjectId.isValid(customerId)) {
      update.customerId = new mongoose.Types.ObjectId(customerId);
    }
    if (intelligence && typeof intelligence === 'object' && Array.isArray(intelligence.nextSteps)) {
      update['intelligence.nextSteps'] = intelligence.nextSteps.map((s: any) => ({
        id: typeof s.id === 'string' && s.id.trim() ? s.id.trim() : new mongoose.Types.ObjectId().toString(),
        action: typeof s.action === 'string' ? s.action : '',
        priority: s.priority === '高' || s.priority === '中' || s.priority === '低' ? s.priority : '中',
        dueDate: typeof s.dueDate === 'string' ? s.dueDate : undefined,
      }));
    }
    if (Object.keys(update).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    const doc = await Interaction.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: update },
      { new: true }
    );
    if (!doc) return res.status(404).json({ error: 'Interaction not found' });
    return res.json(toInteraction(doc.toObject()));
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to update interaction' });
  }
});

interactionsRouter.delete('/:id', async (req: any, res) => {
  try {
    if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const doc = await Interaction.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!doc) return res.status(404).json({ error: 'Interaction not found' });
    return res.status(204).send();
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to delete interaction' });
  }
});
