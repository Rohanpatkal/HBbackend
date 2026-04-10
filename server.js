import express from "express";
import fs from "fs";
import services from "./services/common.js";

const app = express();

app.get("/data", (req, res) => {
    const data = fs.readFileSync("./data/records.txt", "utf-8");
    const value = services.dataBreaker(data);

    console.log("aksjdflj",value);
    
    const result = {};
    res.json(result);
});

app.listen(5000, () => console.log("Server running"));



    // const lines = data.split("\n");
// lines.forEach(line => {
//     const [date, type, amount] = line.split("|").map(i => i.trim());

//     if (!result[date]) result[date] = 0;

//     result[date] += Number(amount);
// });