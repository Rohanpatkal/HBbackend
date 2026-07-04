import fs from 'fs';
import User from './dao/user.js';
import services from './services/common.js';
import textFormaterService from './services/textFormaterService.js';
import multer from "multer";
import path from "path";
import mongoService from './services/mongoService.js';

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
        const user = await User.create(req.body);
        const userId = user._id;

        res.status(201).json({
            success: true,
            userId: userId,
            message: "User created successfully",
            data: user,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message,
        });
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
    getUser,
    textFormater,
    getUserHabitLogs
};
