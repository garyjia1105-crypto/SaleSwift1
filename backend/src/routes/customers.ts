import { Router } from 'express';
import mongoose from 'mongoose';
import { authMiddleware } from '../middleware/auth.js';
import { Customer } from '../lib/mongodb.js';

export const customersRouter = Router();
customersRouter.use(authMiddleware);

function toCustomer(doc: { _id: mongoose.Types.ObjectId; [key: string]: any }) {
  return {
    id: doc._id.toString(),
    name: doc.name ?? '',
    company: doc.company ?? '',
    role: doc.role ?? '',
    industry: doc.industry ?? '',
    email: doc.email ?? undefined,
    phone: doc.phone ?? undefined,
    tags: Array.isArray(doc.tags) ? doc.tags : [],
    createdAt: doc.createdAt?.toISOString?.() ?? new Date().toISOString(),
  };
}

customersRouter.get('/', async (req: any, res) => {
  try {
    const search = (req.query.search as string)?.trim() || '';
    let list = await Customer.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .lean();
    if (search) {
      const lower = search.toLowerCase();
      list = list.filter(
        (c: any) =>
          (c.name ?? '').toLowerCase().includes(lower) ||
          (c.company ?? '').toLowerCase().includes(lower) ||
          (c.email && c.email.toLowerCase().includes(lower))
      );
    }
    return res.json(list.map((d: any) => toCustomer(d)));
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to list customers' });
  }
});

customersRouter.post('/', async (req: any, res) => {
  try {
    const { name, company, role, industry, email, phone, tags } = req.body;
    if (!name || !company) {
      return res.status(400).json({ error: 'Name and company required' });
    }
    const customer = await Customer.create({
      userId: req.user.id,
      name,
      company: company ?? '',
      role: role ?? '',
      industry: industry ?? '',
      email: email ?? null,
      phone: phone ?? null,
      tags: Array.isArray(tags) ? tags : [],
    });
    return res.status(201).json(toCustomer(customer.toObject()));
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to create customer' });
  }
});

customersRouter.get('/:id', async (req: any, res) => {
  try {
    const doc = await Customer.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!doc) return res.status(404).json({ error: 'Customer not found' });
    return res.json(toCustomer(doc.toObject()));
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to get customer' });
  }
});

customersRouter.patch('/:id', async (req: any, res) => {
  try {
    const doc = await Customer.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!doc) return res.status(404).json({ error: 'Customer not found' });
    const { name, company, role, industry, email, phone, tags } = req.body;
    if (name !== undefined) doc.name = name;
    if (company !== undefined) doc.company = company;
    if (role !== undefined) doc.role = role;
    if (industry !== undefined) doc.industry = industry;
    if (email !== undefined) doc.email = email;
    if (phone !== undefined) doc.phone = phone;
    if (tags !== undefined) doc.tags = Array.isArray(tags) ? tags : [];
    await doc.save();
    return res.json(toCustomer(doc.toObject()));
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to update customer' });
  }
});

customersRouter.delete('/:id', async (req: any, res) => {
  try {
    const doc = await Customer.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!doc) return res.status(404).json({ error: 'Customer not found' });
    return res.status(204).send();
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to delete customer' });
  }
});
