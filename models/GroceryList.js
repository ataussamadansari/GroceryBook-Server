const mongoose = require('mongoose');

const groceryListSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'archived'],
    default: 'active'
  },
  totalSpent: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('GroceryList', groceryListSchema);
