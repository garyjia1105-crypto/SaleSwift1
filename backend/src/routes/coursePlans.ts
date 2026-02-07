import { Router } from 'express';
import mongoose from 'mongoose';
import { authMiddleware } from '../middleware/auth.js';
import { CoursePlan, Customer } from '../lib/mongodb.js';

export const coursePlansRouter = Router();
coursePlansRouter.use(authMiddleware);

function toCoursePlan(doc: { _id: mongoose.Types.ObjectId; [key: string]: any }) {
  return {
    id: doc._id.toString(),
    customerId: doc.customerId?.toString?.() ?? '',
    title: doc.title ?? '',
    objective: doc.objective ?? '',
    modules: Array.isArray(doc.modules) ? doc.modules : [],
    resources: Array.isArray(doc.resources) ? doc.resources : [],
    createdAt: doc.createdAt?.toISOString?.() ?? new Date().toISOString(),
  };
}

coursePlansRouter.get('/', async (req: any, res) => {
  try {
    const customerId = req.query.customerId as string | undefined;
    const filter: any = { userId: req.user.id };
    if (customerId && mongoose.Types.ObjectId.isValid(customerId)) filter.customerId = customerId;
    const list = await CoursePlan.find(filter).sort({ createdAt: -1 }).lean();
    return res.json(list.map((d: any) => toCoursePlan(d)));
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to list course plans' });
  }
});

coursePlansRouter.post('/', async (req: any, res) => {
  try {
    const { customerId, title, objective, modules, resources } = req.body;
    if (!customerId || !title || !objective) {
      return res.status(400).json({ error: 'customerId, title, objective required' });
    }
    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({ error: 'Invalid customerId' });
    }
    const customer = await Customer.findOne({
      _id: customerId,
      userId: req.user.id,
    });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    const plan = await CoursePlan.create({
      userId: req.user.id,
      customerId,
      title,
      objective: objective ?? '',
      modules: Array.isArray(modules) ? modules : [],
      resources: Array.isArray(resources) ? resources : [],
    });
    return res.status(201).json(toCoursePlan(plan.toObject()));
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to create course plan' });
  }
});

coursePlansRouter.get('/:id', async (req: any, res) => {
  try {
    if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const doc = await CoursePlan.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!doc) return res.status(404).json({ error: 'Course plan not found' });
    return res.json(toCoursePlan(doc.toObject()));
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to get course plan' });
  }
});

coursePlansRouter.delete('/:id', async (req: any, res) => {
  try {
    if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const doc = await CoursePlan.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!doc) return res.status(404).json({ error: 'Course plan not found' });
    return res.status(204).send();
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to delete course plan' });
  }
});
