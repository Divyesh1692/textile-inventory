const User = require("../models/User");
const Company = require("../models/Company");
const jwt = require("jsonwebtoken");

const register = async (req, res) => {
  try {
    const { username, password, companyName } = req.body;

    if (!companyName) {
      return res.status(400).json({ message: "Company name is required" });
    }

    const userExists = await User.findOne({ username });
    if (userExists)
      return res.status(400).json({ message: "User already exists" });

    // Create a new Company
    const company = new Company({ name: companyName });
    await company.save();

    // Create User linked to Company
    const user = new User({ username, password, companyId: company._id });
    await user.save();

    res.status(201).json({ message: "User and Company created successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username }).populate("companyId");
    if (!user)
      return res.status(400).json({ message: "Invalid username or password" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid username or password" });

    // Create token using .env
    const token = jwt.sign(
      { 
        id: user._id, 
        username: user.username,
        companyId: user.companyId._id,
        companyName: user.companyId.name
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: { 
        id: user._id, 
        username: user.username,
        companyId: user.companyId._id,
        companyName: user.companyId.name
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { register, login };
