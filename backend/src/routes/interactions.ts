import { Router } from 'express';
import mongoose from 'mongoose';
import { authMiddleware } from '../middleware/auth.js';
import { Interaction } from '../lib/mongodb.js';

export const interactionsRouter = Router();
interactionsRouter.use(authMiddleware);

function toInteraction(doc: { _id: mongoose.Types.ObjectId; [key: string]: any }) {
  return {
    id: doc._id.toString(),
    customerId: doc.customerId?.toString?.() ?? undefined,
    date: doc.date ?? '',
    rawInput: doc.rawInput ?? '',
    customerProfile: doc.customerProfile ?? {},
    intelligence: doc.intelligence ?? {},
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
