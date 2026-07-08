
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

// ── Single log entry ──────────────────────────────────────────────────────────
// Adds or updates a single day's log for a user.
// If a log already exists for that date, count and breakCount are incremented
// and the note is appended. All other fields are replaced.
const addSingleLog = async function (userId, { date, count, breakCount, mood, notes }) {
    if (!date || count === undefined) {
        throw new Error("date and count are required");
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate)) throw new Error("Invalid date format. Use YYYY-MM-DD");

    const existing = await HabitLog.findOne({ userId, date: parsedDate });

    if (!existing) {
        const log = await HabitLog.create({
            userId,
            date: parsedDate,
            count: Number(count),
            breakCount: Number(breakCount || 0),
            mood: mood ?? "",
            notes: notes?.trim() ? [{ text: notes.trim() }] : [],
        });
        return { action: "created", log };
    }

    existing.count += Number(count);
    existing.breakCount += Number(breakCount || 0);
    // Only overwrite mood if a new value is explicitly provided
    if (mood !== undefined && mood !== null && mood.trim() !== "") {
        existing.mood = mood;
    }
    // else keep existing.mood as-is

    if (notes?.trim()) {
        existing.notes.push({ text: notes.trim() });
    }

    await existing.save();
    return { action: "updated", log: existing };
};

// ── Edit a log ────────────────────────────────────────────────────────────────
// Replaces only the fields that are sent. Unset fields stay as-is.
const editLog = async function (userId, logId, updates) {
    const log = await HabitLog.findOne({ _id: logId, userId });

    if (!log) throw new Error("Log not found or does not belong to this user");

    const { count, breakCount, mood, notes } = updates;

    if (count !== undefined) log.count = Number(count);
    if (breakCount !== undefined) log.breakCount = Number(breakCount);
    if (mood !== undefined) log.mood = mood;

    // notes replacement: send a full notes array to overwrite,
    // or send a single string to replace all notes with one entry
    if (notes !== undefined) {
        if (Array.isArray(notes)) {
            log.notes = notes.map(n => ({ text: typeof n === "string" ? n : n.text }));
        } else if (typeof notes === "string") {
            log.notes = notes.trim() ? [{ text: notes.trim() }] : [];
        }
    }

    await log.save();
    return log;
};

// ── Delete a log ──────────────────────────────────────────────────────────────
const deleteLog = async function (userId, logId) {
    const log = await HabitLog.findOneAndDelete({ _id: logId, userId });
    if (!log) throw new Error("Log not found or does not belong to this user");
    return log;
};

export default { saveToMongo, saveMultipleToMongo, getUserHabitData, addSingleLog, editLog, deleteLog };