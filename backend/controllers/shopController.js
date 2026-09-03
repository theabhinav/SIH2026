const { v4: uuidv4 } = require('uuid');
const { getDB } = require('../config/db');

const POINTS = { SHOP_DETAILS: 10, SHOP_PHOTO: 5, SHOP_CONTACT: 3, UPVOTE_THRESHOLD: 2 };

async function createShop(req, res) {
  try {
    const { category, address, village, district, contact, photo, details } = req.body || {};
    const name = req.body?.name || req.body?.shop_name;
    if (!name || !category || !village || !district) {
      return res.status(400).json({ detail: 'Shop name, category, village and district required' });
    }

    let potential = POINTS.SHOP_DETAILS;
    if (photo && photo.trim()) potential += POINTS.SHOP_PHOTO;
    if (contact && contact.trim()) potential += POINTS.SHOP_CONTACT;

    const shop = {
      id: uuidv4(),
      user_id: req.user.id,
      user_name: req.user.name,
      name,
      category,
      address: address || '',
      village,
      district,
      contact: contact || '',
      photo: photo || '',
      details: details || '',
      upvotes: 0,
      upvoted_by: [],
      points_potential: potential,
      points_credited: false,
      created_at: new Date().toISOString(),
    };

    const db = getDB();
    await db.collection('shops').insertOne(shop);
    res.json({
      shop,
      points_earned: 0,
      points_pending: potential,
      message: `Shop added! ${potential} points pending — unlock when 2 users upvote!`,
    });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
}

async function getShops(req, res) {
  try {
    const db = getDB();
    const shops = await db.collection('shops').find({}).sort({ created_at: -1 }).limit(100).toArray();
    const myId = req.user ? req.user.id : null;

    res.json(shops.map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      address: s.address,
      village: s.village,
      district: s.district,
      contact: s.contact,
      photo: s.photo,
      details: s.details,
      upvotes: s.upvotes || 0,
      added_by: s.user_name || 'Community Member',
      is_my_shop: myId ? s.user_id === myId : false,
      upvoted_by_me: myId && Array.isArray(s.upvoted_by) ? s.upvoted_by.includes(myId) : false,
      points_credited: s.points_credited || false,
      points_potential: s.points_potential || 10,
    })));
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
}

async function upvoteShop(req, res) {
  try {
    const db = getDB();
    const shop = await db.collection('shops').findOne({ id: req.params.id });
    if (!shop) return res.status(404).json({ detail: 'Shop not found' });
    if (shop.user_id === req.user.id) {
      return res.status(400).json({ detail: 'You cannot upvote your own shop' });
    }

    const upvotedBy = Array.isArray(shop.upvoted_by) ? shop.upvoted_by : [];
    const already = upvotedBy.includes(req.user.id);
    let newUpvoted = already ? upvotedBy.filter((id) => id !== req.user.id) : [...upvotedBy, req.user.id];
    let newCount = newUpvoted.length;

    await db.collection('shops').updateOne(
      { id: shop.id },
      { $set: { upvotes: newCount, upvoted_by: newUpvoted } }
    );

    const updated = await db.collection('shops').findOne({ id: shop.id });
    const potential = updated.points_potential || 10;
    let credited = updated.points_credited || false;

    if (updated.upvotes >= POINTS.UPVOTE_THRESHOLD && !credited) {
      await db.collection('users').updateOne({ id: shop.user_id }, { $inc: { points: potential } });
      await db.collection('shops').updateOne({ id: shop.id }, { $set: { points_credited: true } });
      credited = true;
    } else if (updated.upvotes < POINTS.UPVOTE_THRESHOLD && credited) {
      await db.collection('users').updateOne({ id: shop.user_id }, { $inc: { points: -potential } });
      await db.collection('shops').updateOne({ id: shop.id }, { $set: { points_credited: false } });
      credited = false;
    }

    res.json({
      upvotes: updated.upvotes,
      upvoted_by_me: !already,
      points_credited: credited,
      upvotes_needed: POINTS.UPVOTE_THRESHOLD,
    });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
}

async function getLeaderboard(req, res) {
  try {
    const db = getDB();
    const top = await db.collection('users')
      .find({}, { projection: { _id: 0, name: 1, points: 1 } })
      .sort({ points: -1 })
      .limit(20)
      .toArray();

    res.json(top.map((u, i) => ({ rank: i + 1, name: u.name, points: u.points || 0 })));
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
}

module.exports = { createShop, getShops, upvoteShop, getLeaderboard };
