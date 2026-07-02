import express from "express";
import fs from "fs";
import services from "./services/common.js";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import FilteredData from "./dao/filteredData.js";
import FullData from "./dao/fullData.js";

dotenv.config();

const app = express();

// Connect Database
connectDB();


app.use("/api/users", userRoutes);

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());

app.get("/data", async (req, res) => {
    try {
        const data = fs.readFileSync("./data/records.txt", "utf-8");
        const value = await services.dataBreaker(data);

        console.log(value);

        res.json({ message: value });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to read data" });
    }
});

app.get("/getData", async (req, res) => {
    try {
        const doc = await FilteredData.findOne().sort({ createdAt: -1 });
        if (!doc) return res.status(404).json({ error: "No data found. Hit /data first to process and store data." });
        res.json(doc);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch data" });
    }
});

// Fetch the latest FullData from MongoDB
app.get("/api/fullData", async (req, res) => {
    try {
        const doc = await FullData.findOne().sort({ createdAt: -1 });
        if (!doc) return res.status(404).json({ error: "No data found" });
        res.json(doc);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch full data" });
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
