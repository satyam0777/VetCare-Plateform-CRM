const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authController = require('../controllers/authController');

// Admin notifications (doctor approval, appointment updates)
router.get('/admin-notifications', authController.adminNotifications);
// Doctor login via unique access link
router.post('/doctor-link-login', authController.doctorLinkLogin);

// Test route
router.get("/test", (req, res) => {
  res.json({ message: "Auth routes are working!" });
});

// Register route
router.post("/register", async (req, res) => {
  const { name, email, mobile, password, petName, role } = req.body;

  try {
    // Check if user already exists
    let existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user
    const user = new User({
      name,
      email,
      mobile,
      password: hashedPassword,
      petName: petName || '',
      role: role || 'user',
    });

    await user.save();

    // Add new user ID to admin's userIds array
    const Admin = require('../models/Admin');
    await Admin.findOneAndUpdate(
      { email: process.env.ADMIN_EMAIL },
      { $addToSet: { userIds: user._id } },
      { upsert: true }
    );

    // Create JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email }, 
      process.env.JWT_SECRET, 
      { expiresIn: "7d" }
    );

    // Fetch full user info (excluding password)
    const userInfo = await User.findById(user._id).select('-password');

    // Send response
    res.status(201).json({
      message: "User registered successfully",
      token,
      user: userInfo,
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
});

// Login route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    console.log('🔐 Login attempt for:', email);
    console.log('📋 Full request body:', req.body);
    console.log('📊 Email length:', email?.length);
    console.log('📊 Password length:', password?.length);
    
    // ✅ Check if this is an admin login attempt
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@vetcare.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    if (email === adminEmail) {
      console.log('🔑 Admin login attempt detected');
      
      // Check admin password
      if (password === adminPassword) {
        console.log('✅ Admin authentication successful');
        
        // Create admin user object
        const adminUser = {
          _id: 'admin',
          name: process.env.ADMIN_NAME || 'VetCare Admin',
          email: adminEmail,
          role: 'admin',
          isSystemAdmin: true
        };
        
        // Create JWT token for admin
        const token = jwt.sign(
          { id: 'admin', email: adminEmail, role: 'admin' }, 
          process.env.JWT_SECRET, 
          { expiresIn: "7d" }
        );
        
        console.log('🎯 Admin token generated successfully');
        
        return res.json({
          message: "Admin login successful",
          token,
          user: adminUser
        });
      } else {
        console.log('❌ Admin password incorrect');
        return res.status(401).json({ message: "Invalid admin credentials" });
      }
    }
    
    // Regular user authentication (existing logic)
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    console.log('✅ User found:', user.name, 'Role:', user.role);

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('❌ Password mismatch for:', email);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    console.log('✅ Password match for:', email);

    // Create JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email }, 
      process.env.JWT_SECRET, 
      { expiresIn: "7d" }
    );

    // Fetch full user info (excluding password)
    const userInfo = await User.findById(user._id).select('-password');

    // Send response
    res.status(200).json({
      message: "Login successful",
      token,
      user: userInfo,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error during login" });
  }
});

module.exports = router;