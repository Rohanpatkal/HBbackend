import express from "express";
import fs from "fs";
import services from "./services/common.js";
import filterdData from "./filterdAllData.json" with { type: "json" };
import cors from "cors";

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000", // Replace with your Next.js port
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());

app.get("/data", (req, res) => {
    try {
        const data = fs.readFileSync("./data/records.txt", "utf-8");
        const value = services.dataBreaker(data);

        console.log(value);

        res.json(value);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to read data" });
    }
});

app.get("/getData", (req, res) => {
    // console.log("Sending filtered data:", filterdData);
    res.json(filterdData);
});

const PORT = 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
