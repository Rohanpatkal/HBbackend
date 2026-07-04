
import HabitLog from "../dao/habitLog.js";


const saveToMongo = async function (HabitLogData) {
    try {
        const { userId, date, count, breakCount, mood, notes } = HabitLogData;

        const existing = await HabitLog.findOne({ userId, date });

        if (!existing) {
            await HabitLog.create({ userId, date, count, breakCount, mood, notes });
        } else {
            existing.count += count;
            existing.breakCount += breakCount;
            existing.mood = mood;

            if (notes?.trim()) {
                if (!Array.isArray(existing.notes)) {
                    existing.notes = [];
                }
                existing.notes.push({
                    text: notes.trim()
                });
            }

            await existing.save();
        }
        console.log("Data saved to MongoDB");
    } catch (err) {
        console.error("MongoDB save error:", err.message);
        throw err;
    }
}

const getUserHabitData = async function (userId) {
    try {
        const logs = await HabitLog.find({ userId }).select("date count breakCount mood notes").sort({ date: 1 });
        return logs;
    } catch (err) {
        console.error("MongoDB find error:", err.message);
        throw err;
    }
}

const saveMultipleToMongo = async function (data, userId) {

    try {
        const documents = [];

        for (const year of Object.keys(data)) {
            for (const month of Object.keys(data[year])) {
                for (const day of Object.values(data[year][month])) {
                    console.log("Processing document for date:", day);

                    documents.push({
                        userId,
                        date: new Date(day.date),
                        count: Number(day.count),
                        breakCount: Number(day.breakCount || 0),
                        mood: day.mood ?? null,
                        notes: day.notes?.trim()
                            ? [
                                {
                                    text: day.notes.trim()
                                }
                            ]
                            : []
                    });
                }
            }
        }

        console.log("Total documents:", documents.length);

        await HabitLog.insertMany(documents);
    } catch (err) {
        console.error("Error saving multiple documents to MongoDB:", err.message);
        throw err;
    }
}

export default { saveToMongo, saveMultipleToMongo, getUserHabitData };