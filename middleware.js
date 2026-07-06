import fs from 'fs';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from './dao/user.js';
import services from './services/common.js';
import textFormaterService from './services/textFormaterService.js';
import mongoService from './services/mongoService.js';
import { recordVisit, getVisitorCounts } from './services/visitorService.js';

const textFormater = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please upload a file."
            });
        }

        const textData = fs.readFileSync(req.file.path, "utf8");
        const formattedData = textFormaterService(textData);
        await mongoService.saveMultipleToMongo(formattedData, req.body.userId);

        return res.json(formattedData);

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            error: error.message
        });

    } finally {
        if (req.file) {
            try {
                await fs.unlink(req.file.path);
                console.log("File deleted");
            } catch (err) {
                console.error("Delete failed:", err);
            }
        }
    }
};

export const getUserHabitLogs = async (req, res) => {
    try {
        const { userId } = req.params;

        const data = await mongoService.getUserHabitData(userId);
        console.log("Fetched data for userId:", userId, "Data:", data);
        res.status(200).json({
            success: true,
            count: data.length,
            data
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const createUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: "Name, email and password are required" });
        }

        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(409).json({ success: false, message: "Email already registered" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ name, email, password: hashedPassword });

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
        );

        res.status(201).json({
            success: true,
            message: "User created successfully",
            userId: user._id,
            token,
            user: { id: user._id, name: user.name, email: user.email },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email and password are required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
        );

        res.json({
            success: true,
            message: "Login successful",
            userId: user._id,
            token,
            user: { id: user._id, name: user.name, email: user.email },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const getUser = async (req, res) => {
    try {
        const users = await User.find();

        res.json(users);
    } catch (err) {
        res.status(500).json({
            message: err.message,
        });
    }
};

export default {
    createUser,
    login,
    getUser,
    textFormater,
    getUserHabitLogs,
    getSummary: async (req, res) => {
        try {
            const { userId } = req.params;
            const data = await mongoService.getSummary(userId);
            if (!data) return res.status(404).json({ success: false, message: "No data found for this user" });
            res.json({ success: true, data });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },
    getYearlyData: async (req, res) => {
        try {
            const { userId } = req.params;
            const data = await mongoService.getYearlyData(userId);
            if (!data.length) return res.status(404).json({ success: false, message: "No data found for this user" });
            res.json({ success: true, data });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },
    getMonthlyData: async (req, res) => {
        try {
            const { userId, year } = req.params;
            const data = await mongoService.getMonthlyData(userId, year);
            if (!data) return res.status(404).json({ success: false, message: `No data found for ${year}` });
            res.json({ success: true, ...data });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },
    getMonthDetail: async (req, res) => {
        try {
            const { userId, year, month } = req.params;
            const data = await mongoService.getMonthDetail(userId, year, month);
            if (!data) return res.status(404).json({ success: false, message: `No data found for ${month}/${year}` });
            res.json({ success: true, ...data });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    addSingleLog: async (req, res) => {
        try {
            const { userId } = req.params;
            const { date, count, breakCount, mood, notes } = req.body;

            if (!date || count === undefined) {
                return res.status(400).json({ success: false, message: "date and count are required" });
            }

            const result = await mongoService.addSingleLog(userId, { date, count, breakCount, mood, notes });

            res.status(result.action === "created" ? 201 : 200).json({
                success: true,
                action: result.action,
                message: result.action === "created" ? "Log entry created" : "Log entry updated",
                data: result.log,
            });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },

    editLog: async (req, res) => {
        try {
            const { userId, logId } = req.params;
            const { count, breakCount, mood, notes } = req.body;

            const hasUpdate = [count, breakCount, mood, notes].some(v => v !== undefined);
            if (!hasUpdate) {
                return res.status(400).json({ success: false, message: "Provide at least one field to update: count, breakCount, mood, notes" });
            }

            const log = await mongoService.editLog(userId, logId, { count, breakCount, mood, notes });

            res.json({
                success: true,
                message: "Log updated successfully",
                data: log,
            });
        } catch (err) {
            const status = err.message.includes("not found") ? 404 : 500;
            res.status(status).json({ success: false, message: err.message });
        }
    },

    deleteLog: async (req, res) => {
        try {
            const { userId, logId } = req.params;
            const log = await mongoService.deleteLog(userId, logId);

            res.json({
                success: true,
                message: "Log deleted successfully",
                data: log,
            });
        } catch (err) {
            const status = err.message.includes("not found") ? 404 : 500;
            res.status(status).json({ success: false, message: err.message });
        }
    },

    // ── Visitor tracking ────────────────────────────────────────────────────────

    pingVisitor: async (req, res) => {
        try {
            const { isNew } = await recordVisit(req);
            const counts    = await getVisitorCounts();
            res.json({ success: true, isNew, ...counts });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    getVisitorCount: async (req, res) => {
        try {
            const counts = await getVisitorCounts();
            res.json({ success: true, ...counts });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },
};
