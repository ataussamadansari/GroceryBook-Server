const mongoose = require('mongoose');

const groceryItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    default: 1
  },
  unit: {
    type: String,
    enum: ['kg', 'gram', 'ltr', 'ml', 'pic', 'pack', 'dozen'],
    default: 'pic'
  },
  price: {
    type: Number,
    default: 0
  },
  category: {
    type: String,
    enum: ['vegetables', 'fruits', 'dairy', 'meat', 'bakery', 'beverages', 'snacks', 'other'],
    default: 'other'
  },
  status: {
    type: String,
    enum: ['pending', 'purchased', 'not_available'],
    default: 'pending'
  },
  listId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GroceryList',
    required: true
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('GroceryItem', groceryItemSchema);
