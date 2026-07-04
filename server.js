import express from "express";
import fs from "fs";
import services from "./services/common.js";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import routes from "./routes/route.js";
import FilteredData from "./dao/filteredData.js";
import FullData from "./dao/fullData.js";

dotenv.config();

const app = express();

// Connect Database
connectDB();

// Setup middleware BEFORE routes
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());

app.use("/api/", routes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
