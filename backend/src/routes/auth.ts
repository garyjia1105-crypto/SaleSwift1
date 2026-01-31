import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../lib/mongodb.js';

export const authRouter = Router();
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-me';

authRouter.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      password: hashed,
      displayName: name?.trim() || email.split('@')[0],
      avatar: null,
      language: 'zh',
      theme: 'classic',
      authProvider: 'email',
    });
    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    return res.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        displayName: user.displayName ?? user.email.split('@')[0],
        avatar: user.avatar ?? null,
        language: user.language ?? 'zh',
        theme: user.theme ?? 'classic',
      },
      token,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Registration failed' });
  }
});

authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    const user = await User.findOne({ email });
    if (!user || !user.password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    return res.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        displayName: user.displayName ?? user.email.split('@')[0],
        avatar: user.avatar ?? null,
        language: user.language ?? null,
        theme: user.theme ?? null,
      },
      token,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Login failed' });
  }
});

authRouter.post('/google', async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken || typeof idToken !== 'string') {
      return res.status(400).json({ error: 'idToken required' });
    }
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
    if (!clientId) {
      return res.status(500).json({ error: 'Google OAuth not configured' });
    }
    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({ idToken, audience: clientId });
    const payload = ticket.getPayload();
    if (!payload?.email) {
      return res.status(401).json({ error: 'Invalid Google token' });
    }
    const email = payload.email;
    const displayName = payload.name ?? email.split('@')[0];
    const picture = payload.picture ?? null;

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        email,
        displayName,
        avatar: picture,
        language: 'zh',
        theme: 'classic',
        authProvider: 'google',
      });
    } else {
      user.displayName = user.displayName ?? displayName;
      user.avatar = user.avatar ?? picture;
      await user.save();
    }

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    return res.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        displayName: user.displayName ?? user.email.split('@')[0],
        avatar: user.avatar ?? null,
        language: user.language ?? 'zh',
        theme: user.theme ?? 'classic',
      },
      token,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Google login failed' });
  }
});
