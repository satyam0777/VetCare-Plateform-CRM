const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  userIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Array of user IDs
  resetPasswordCode: { type: String },
  resetPasswordExpires: { type: Date },
  // ...other admin fields
});

module.exports = mongoose.model('Admin', adminSchema);
