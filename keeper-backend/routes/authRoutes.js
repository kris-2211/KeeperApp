const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

router.get("/", async (req, res) => {
  res.send("Backend Running");
});

// ✅ Register User
router.post("/register", async (req, res) => {
  try {
    const { fullname, email, password } = req.body;

    if (!fullname || !email || !password) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: "Email already exists." });
    }

    const newUser = new User({ fullname, email, password });
    await newUser.save();

    res.status(201).json({ success: true, message: "User registered successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// ✅ Login User
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid email or password." });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({ success: true, token });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// ✅ Verify User Token
router.get("/verify", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ success: true, valid: true, userId: decoded.id });
  } catch (error) {
    res.status(401).json({ success: false, valid: false, message: "Invalid token" });
  }
});

// ✅ Get User Details
router.get("/me", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ success: false, message: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Invalid token" });
  }
});

// ✅ Middleware to Verify Token
const authenticateUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ success: false, message: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

// ✅ Update Profile (Full Name & Email)
router.put("/update-profile", authenticateUser, async (req, res) => {
  try {
    const { fullname, email, avatar } = req.body;

    if (!fullname || !email) {
      return res.status(400).json({ success: false, message: "Full name and email are required." });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { fullname, email, avatar },
      { new: true, select: "-password" }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    res.json({ success: true, message: "Profile updated successfully.", user: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// ✅ Change Password
router.post("/change-password", authenticateUser, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Old password is incorrect." });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ success: true, message: "Password updated successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error." });
  }
});

module.exports = router;
