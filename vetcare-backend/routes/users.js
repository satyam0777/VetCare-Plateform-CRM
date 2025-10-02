// const express = require('express');
// const router = express.Router();
// const User = require('../models/User');

// // POST /api/users - Login/Register
// router.post('/', async (req, res) => {
//   const { name, email, petName } = req.body;
//   try {
//     let user = await User.findOne({ email });
//     if (!user) {
//       user = new User({ name, email, petName });
//       await user.save();
//     }
//     res.status(201).json(user); // Send user with _id
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// module.exports = router;

const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Make sure this file exists


// GET /api/users/:id - Get user info
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

