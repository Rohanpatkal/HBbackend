import express from "express";
import middleware from '../middleware.js';
import upload from '../services/upload.js';

const router = express.Router();

// ── User ──────────────────────────────────────────────────────────────────────
router.post("/user/createUser", middleware.createUser);
router.post("/user/login", middleware.login);
router.get("/user/getUsers", middleware.getUser);
router.get("/user/:userId", middleware.getUserHabitLogs);

// ── Data upload ───────────────────────────────────────────────────────────────
router.post("/data/textFormater", upload.single("file"), middleware.textFormater);

// ── Single log entry ──────────────────────────────────────────────────────────
// Add or update a single day's habit log for a user
router.post("/log/:userId", middleware.addSingleLog);

// Edit a specific log by its _id (only fields sent will be updated)
router.put("/log/:userId/:logId", middleware.editLog);

// Delete a specific log by its _id
router.delete("/log/:userId/:logId", middleware.deleteLog);

// ── Comments ──────────────────────────────────────────────────────────────────
// Get all comments (newest first)
router.get("/comments", middleware.getComments);

// Post a new comment
router.post("/comments", middleware.addComment);

// Delete a comment (author only)
router.delete("/comments/:commentId", middleware.deleteComment);

// Toggle like on a comment
router.post("/comments/:commentId/like", middleware.toggleLike);

// ── Visitor tracking ──────────────────────────────────────────────────────────
// Record a visit (call on app load) — returns { total, today, isNew }
router.post("/visitors/ping", middleware.pingVisitor);

// Get visitor counts — returns { total, today }
router.get("/visitors/count", middleware.getVisitorCount);

// ── Stats & analytics ─────────────────────────────────────────────────────────
// Global summary: totalCount, best/worst year & month
router.get("/stats/:userId/summary", middleware.getSummary);

// Year-wise breakdown: array of { year, count, totalMonths }
router.get("/stats/:userId/yearly", middleware.getYearlyData);

// All months in a year: { year, yearTotal, data: [...months] }
router.get("/stats/:userId/monthly/:year", middleware.getMonthlyData);

// Single month detail: { month, count, totalDays, max, min, days: [...] }
router.get("/stats/:userId/monthly/:year/:month", middleware.getMonthDetail);

export default router;