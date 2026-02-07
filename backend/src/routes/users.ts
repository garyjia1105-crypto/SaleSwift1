import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { User } from '../lib/mongodb.js';

export const usersRouter = Router();
usersRouter.use(authMiddleware);

usersRouter.get('/me', async (req: any, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({
      id: user._id.toString(),
      email: user.email,
      displayName: user.displayName ?? (user.email ? user.email.split('@')[0] : 'User'),
      avatar: user.avatar ?? null,
      language: user.language ?? null,
      theme: user.theme ?? null,
      industry: user.industry ?? '',
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to get user' });
  }
});

usersRouter.patch('/me', async (req: any, res) => {
  try {
    const { avatar, language, theme, displayName, industry } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (avatar !== undefined) user.avatar = avatar;
    if (language !== undefined) user.language = language;
    if (theme !== undefined) user.theme = theme;
    if (displayName !== undefined) user.displayName = displayName;
    if (industry !== undefined) user.industry = typeof industry === 'string' ? industry : '';
    await user.save();
    return res.json({
      id: user._id.toString(),
      email: user.email,
      displayName: user.displayName ?? (user.email ? user.email.split('@')[0] : 'User'),
      avatar: user.avatar ?? null,
      language: user.language ?? null,
      theme: user.theme ?? null,
      industry: user.industry ?? '',
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to update user' });
  }
});
