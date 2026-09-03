const jwt = require('jsonwebtoken');
const { getDB } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_grameen_udyog_jwt_key_2026';

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ detail: 'Missing or invalid token' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const db = getDB();
    const user = await db.collection('users').findOne({ id: payload.user_id });
    if (!user) return res.status(401).json({ detail: 'User not found' });
    
    req.user = { id: user.id, email: user.email, name: user.name, points: user.points || 0 };
    next();
  } catch (err) {
    return res.status(401).json({ detail: 'Invalid token' });
  }
}

async function optionalToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      const db = getDB();
      const user = await db.collection('users').findOne({ id: payload.user_id });
      if (user) {
        req.user = { id: user.id, email: user.email, name: user.name, points: user.points || 0 };
      }
    } catch (err) {
      // Ignore token verification errors for optional auth
    }
  }
  next();
}

module.exports = { authenticateToken, optionalToken, JWT_SECRET };
