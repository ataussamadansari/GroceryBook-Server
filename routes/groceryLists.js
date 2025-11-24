const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const GroceryList = require('../models/GroceryList');
const User = require('../models/User');

// Get all lists for user
router.get('/', auth, async (req, res) => {
  try {
    const { status, sort } = req.query;
    let query = { createdBy: req.user.id };
    
    if (status) query.status = status;

    const lists = await GroceryList.find(query)
      .populate('createdBy', 'name email')
      .sort(sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 });
    
    res.json(lists);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Create list
router.post('/', auth, async (req, res) => {
  try {
    const list = new GroceryList({
      name: req.body.name,
      createdBy: req.user.id
    });

    await list.save();
    await list.populate('createdBy', 'name email');
    res.json(list);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Update list
router.put('/:id', auth, async (req, res) => {
  try {
    const list = await GroceryList.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    ).populate('createdBy', 'name email');
    
    res.json(list);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Delete list
router.delete('/:id', auth, async (req, res) => {
  try {
    await GroceryList.findByIdAndDelete(req.params.id);
    res.json({ msg: 'List deleted' });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;
