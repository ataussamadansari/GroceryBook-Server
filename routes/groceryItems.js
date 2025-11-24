const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const GroceryItem = require('../models/GroceryItem');
const GroceryList = require('../models/GroceryList');

// Get items for a list
router.get('/list/:listId', auth, async (req, res) => {
  try {
    const { category, status } = req.query;
    let query = { listId: req.params.listId };
    
    if (category) query.category = category;
    if (status) query.status = status;

    const items = await GroceryItem.find(query)
      .populate('addedBy', 'name')
      .sort({ createdAt: -1 });
    
    res.json(items);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Create item
router.post('/', auth, async (req, res) => {
  try {
    const item = new GroceryItem({
      ...req.body,
      addedBy: req.user.id
    });

    await item.save();
    await item.populate('addedBy', 'name');
    res.json(item);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Helper function to calculate actual price with unit conversion
const calculateItemPrice = (quantity, unit, pricePerBaseUnit) => {
  let actualQuantity = quantity;
  
  // Convert smaller units to base units
  if (unit === 'gram') {
    actualQuantity = quantity / 1000; // gram to kg
  } else if (unit === 'ml') {
    actualQuantity = quantity / 1000; // ml to liter
  }
  
  return actualQuantity * pricePerBaseUnit;
};

// Update item
router.put('/:id', auth, async (req, res) => {
  try {
    const oldItem = await GroceryItem.findById(req.params.id);
    
    const item = await GroceryItem.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    ).populate('addedBy', 'name');

    // If item is marked as purchased, create spending record
    if (req.body.status === 'purchased' && oldItem.status !== 'purchased' && req.body.price) {
      const Spending = require('../models/Spending');
      const totalAmount = calculateItemPrice(item.quantity, item.unit, item.price);
      
      await Spending.create({
        listId: item.listId,
        amount: totalAmount,
        category: item.category,
        description: `${item.name} - ${item.quantity} ${item.unit}`,
        spentBy: req.user.id,
        date: new Date()
      });
    }

    // Update list total if price changed or status is purchased
    if (req.body.price !== undefined || req.body.status !== undefined) {
      const allItems = await GroceryItem.find({ listId: item.listId, status: 'purchased' });
      const total = allItems.reduce((sum, i) => {
        return sum + calculateItemPrice(i.quantity, i.unit, i.price);
      }, 0);
      await GroceryList.findByIdAndUpdate(item.listId, { totalSpent: total });
    }
    
    res.json(item);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Delete item
router.delete('/:id', auth, async (req, res) => {
  try {
    await GroceryItem.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Item deleted' });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;
