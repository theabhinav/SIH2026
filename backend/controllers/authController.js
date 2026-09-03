const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getDB } = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth');

async function register(req, res) {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ detail: 'Name, email and password required' });
    }
    const db = getDB();
    const existing = await db.collection('users').findOne({ email: String(email).toLowerCase() });
    if (existing) {
      return res.status(400).json({ detail: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = {
      id: uuidv4(),
      name,
      email: String(email).toLowerCase(),
      password: hashedPassword,
      points: 0,
      created_at: new Date().toISOString(),
    };

    await db.collection('users').insertOne(user);
    const token = jwt.sign({ user_id: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, points: user.points },
    });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ detail: 'Email and password required' });
    }
    const db = getDB();
    const user = await db.collection('users').findOne({ email: String(email).toLowerCase() });
    if (!user) {
      return res.status(401).json({ detail: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ detail: 'Invalid credentials' });
    }

    const token = jwt.sign({ user_id: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, points: user.points || 0 },
    });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
}

async function me(req, res) {
  res.json(req.user);
}

module.exports = { register, login, me };
