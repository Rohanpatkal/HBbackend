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