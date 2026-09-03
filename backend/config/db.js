const { MongoClient } = require('mongodb');
require('dotenv').config();

const mongoUrl = (process.env.MONGO_URL || 'mongodb://localhost:27017').trim();
const mongoOptions = mongoUrl.startsWith('mongodb+srv')
  ? { family: 4, serverSelectionTimeoutMS: 15000 }
  : {};

const mongoClient = new MongoClient(mongoUrl, mongoOptions);
let db = null;

async function connectDB() {
  if (db) return db;
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoClient.connect();
    db = mongoClient.db(process.env.DB_NAME || 'grameen_udyog');
    
    // Create necessary database indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ id: 1 }, { unique: true });
    await db.collection('reports').createIndex({ id: 1 }, { unique: true });
    await db.collection('reports').createIndex({ user_id: 1 });
    await db.collection('villages').createIndex({ village_name_normalized: 1 }, { name: 'idx_village_name_norm' });

    console.log('✅ MongoDB Connected:', process.env.DB_NAME || 'grameen_udyog');
    return db;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    throw error;
  }
}

function getDB() {
  if (!db) {
    throw new Error('Database not initialized. Call connectDB first.');
  }
  return db;
}

module.exports = { connectDB, getDB };
