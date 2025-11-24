const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Spending = require('../models/Spending');
const User = require('../models/User');

// Get spending records
router.get('/', auth, async (req, res) => {
  try {
    const { startDate, endDate, category } = req.query;
    let query = { spentBy: req.user.id };
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    if (category) query.category = category;

    const spending = await Spending.find(query)
      .populate('spentBy', 'name')
      .sort({ date: -1 });
    
    res.json(spending);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Get spending analytics
router.get('/analytics', auth, async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const { period = 'month' } = req.query;
    const now = new Date();
    let startDate;

    if (period === 'week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === 'month') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else {
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    }

    const userId = new mongoose.Types.ObjectId(req.user.id);

    // Category-wise analytics
    const byCategory = await Spending.aggregate([
      {
        $match: {
          spentBy: userId,
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { total: -1 }
      }
    ]);

    // Timeline analytics (daily spending)
    const byTimeline = await Spending.aggregate([
      {
        $match: {
          spentBy: userId,
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$date' }
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $project: {
          date: '$_id',
          total: 1,
          count: 1,
          _id: 0
        }
      }
    ]);

    res.json({ byCategory, byTimeline });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
});

// Create spending record
router.post('/', auth, async (req, res) => {
  try {
    const spending = new Spending({
      ...req.body,
      spentBy: req.user.id
    });

    await spending.save();
    await spending.populate('spentBy', 'name');
    res.json(spending);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;
