import { Router } from 'express';
import mongoose from 'mongoose';
import { authMiddleware } from '../middleware/auth.js';
import { Schedule } from '../lib/mongodb.js';

export const schedulesRouter = Router();
schedulesRouter.use(authMiddleware);

function toSchedule(doc: { _id: mongoose.Types.ObjectId; [key: string]: any }) {
  return {
    id: doc._id.toString(),
    customerId: doc.customerId?.toString?.() ?? undefined,
    title: doc.title ?? '',
    date: doc.date ?? '',
    time: doc.time ?? undefined,
    description: doc.description ?? undefined,
    status: (doc.status === 'completed' ? 'completed' : 'pending') as 'pending' | 'completed',
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : undefined,
  };
}

schedulesRouter.get('/', async (req: any, res) => {
  try {
    const customerId = req.query.customerId as string | undefined;
    const filter: any = { userId: req.user.id };
    if (customerId) filter.customerId = customerId;
    let list = await Schedule.find(filter).lean();
    list = list.sort((a: any, b: any) => {
      const da = new Date(`${a.date} ${a.time || '00:00'}`).getTime();
      const db_ = new Date(`${b.date} ${b.time || '00:00'}`).getTime();
      return da - db_;
    });
    return res.json(list.map((d: any) => toSchedule(d)));
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to list schedules' });
  }
});

schedulesRouter.post('/', async (req: any, res) => {
  try {
    const { customerId, title, date, time, description, status } = req.body;
    if (!title || !date) {
      return res.status(400).json({ error: 'Title and date required' });
    }
    const schedule = await Schedule.create({
      userId: req.user.id,
      customerId: customerId || null,
      title,
      date,
      time: time ?? null,
      description: description ?? null,
      status: status === 'completed' ? 'completed' : 'pending',
    });
    return res.status(201).json(toSchedule(schedule.toObject()));
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to create schedule' });
  }
});

schedulesRouter.patch('/:id', async (req: any, res) => {
  try {
    const doc = await Schedule.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!doc) return res.status(404).json({ error: 'Schedule not found' });
    const { customerId, title, date, time, description, status } = req.body;
    if (customerId !== undefined) doc.customerId = customerId || null;
    if (title !== undefined) doc.title = title;
    if (date !== undefined) doc.date = date;
    if (time !== undefined) doc.time = time;
    if (description !== undefined) doc.description = description;
    if (status !== undefined) doc.status = status === 'completed' ? 'completed' : 'pending';
    await doc.save();
    return res.json(toSchedule(doc.toObject()));
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to update schedule' });
  }
});

schedulesRouter.delete('/:id', async (req: any, res) => {
  try {
    const doc = await Schedule.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!doc) return res.status(404).json({ error: 'Schedule not found' });
    return res.status(204).send();
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to delete schedule' });
  }
});
