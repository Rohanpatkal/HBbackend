import express from "express";
import middleware from '../middleware.js';
import upload from '../services/upload.js';

const router = express.Router();

// Create User
router.post("/user/createUser", middleware.createUser);
// Get Users
router.get("/user/getUsers", middleware.getUser);
// Get User with all logs
router.get("/user/:userId", middleware.getUserHabitLogs);

//data
router.post("/data/textFormater", upload.single("file"), middleware.textFormater);


// app.get("/getData", async (req, res) => {
//     try {
//         const doc = await FilteredData.findOne().sort({ createdAt: -1 });
//         if (!doc) return res.status(404).json({ error: "No data found. Hit /data first to process and store data." });
//         res.json(doc);
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ error: "Failed to fetch data" });
//     }
// });

// // Fetch the latest FullData from MongoDB
// app.get("/api/fullData", async (req, res) => {
//     try {
//         const doc = await FullData.findOne().sort({ createdAt: -1 });
//         if (!doc) return res.status(404).json({ error: "No data found" });
//         res.json(doc);
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ error: "Failed to fetch full data" });
//     }
// });

export default router;