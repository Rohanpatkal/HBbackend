import  express from "express";
import User from '../dao/user.js';


const router = express.Router();

// Create User
router.post("/", async (req, res) => {
  try {
    const user = await User.create(req.body);

    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

// Get Users
router.get("/", async (req, res) => {
  try {
    const users = await User.find();

    res.json(users);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

export default router;