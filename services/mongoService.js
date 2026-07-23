
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

// ── Summary ──────────────────────────────────────────────────────────────────
// Returns global stats: total count, best/worst year, best/worst month
const getSummary = async function (userId) {
    const logs = await HabitLog.find({ userId }).select("date count").sort({ date: 1 });

    if (!logs.length) return null;

    // Aggregate by year and month
    const yearMap = {};   // { "2024": totalCount }
    const monthMap = {};  // { "04/2024": totalCount }

    let totalCount = 0;

    for (const log of logs) {
        const d = new Date(log.date);
        const year = String(d.getFullYear());
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const monthKey = `${month}/${year}`;

        totalCount += log.count;
        yearMap[year] = (yearMap[year] || 0) + log.count;
        monthMap[monthKey] = (monthMap[monthKey] || 0) + log.count;
    }

    // Find max/min year
    const years = Object.entries(yearMap);
    const yearMax = years.reduce((a, b) => b[1] > a[1] ? b : a);
    const yearMin = years.reduce((a, b) => b[1] < a[1] ? b : a);

    // Find max/min month
    const months = Object.entries(monthMap);
    const monthMax = months.reduce((a, b) => b[1] > a[1] ? b : a);
    const monthMin = months.reduce((a, b) => b[1] < a[1] ? b : a);

    return {
        totalCount,
        totalYears: years.length,
        totalMonths: months.length,
        yearMax: { year: yearMax[0], count: yearMax[1] },
        yearMin: { year: yearMin[0], count: yearMin[1] },
        monthMax: { month: monthMax[0], count: monthMax[1] },
        monthMin: { month: monthMin[0], count: monthMin[1] },
        years: years.map(([y]) => y).sort(),
    };
};

// ── Yearly breakdown ──────────────────────────────────────────────────────────
// Returns count per year as a flat array — good for bar/line charts
const getYearlyData = async function (userId) {
    const logs = await HabitLog.find({ userId }).select("date count");

    const yearMap = {};

    for (const log of logs) {
        const year = String(new Date(log.date).getFullYear());
        if (!yearMap[year]) yearMap[year] = { year, count: 0, totalMonths: new Set() };
        yearMap[year].count += log.count;
        const month = String(new Date(log.date).getMonth() + 1).padStart(2, "0");
        yearMap[year].totalMonths.add(month);
    }

    return Object.values(yearMap)
        .map(y => ({ year: y.year, count: y.count, totalMonths: y.totalMonths.size }))
        .sort((a, b) => a.year.localeCompare(b.year));
};

// ── Monthly breakdown for a year ─────────────────────────────────────────────
// Returns all months within a given year with count + day-level data
const getMonthlyData = async function (userId, year) {
    const start = new Date(`${year}-01-01`);
    const end = new Date(`${year}-12-31T23:59:59`);

    const logs = await HabitLog
        .find({ userId, date: { $gte: start, $lte: end } })
        .select("_id date count breakCount mood notes")
        .sort({ date: 1 });

    if (!logs.length) return null;

    const monthMap = {};

    for (const log of logs) {
        const d = new Date(log.date);
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        const monthKey = `${month}/${year}`;
        const dateLabel = `${day}/${month}/${year}`;

        if (!monthMap[monthKey]) {
            monthMap[monthKey] = { monthKey, count: 0, totalDays: 0, days: [] };
        }

        monthMap[monthKey].count += log.count;
        monthMap[monthKey].totalDays += 1;
        monthMap[monthKey].days.push({
            _id: log._id,
            date: dateLabel,
            count: log.count,
            breakCount: log.breakCount,
            mood: log.mood,
            notes: log.notes,
        });
    }

    const yearTotal = Object.values(monthMap).reduce((s, m) => s + m.count, 0);

    return {
        year,
        yearTotal,
        data: Object.values(monthMap).sort((a, b) => a.monthKey.localeCompare(b.monthKey)),
    };
};

// ── Single month detail ───────────────────────────────────────────────────────
// Returns day-level detail for one specific month with max/min day stats
const getMonthDetail = async function (userId, year, month) {
    const paddedMonth = month.padStart(2, "0");
    const start = new Date(`${year}-${paddedMonth}-01`);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);

    const logs = await HabitLog
        .find({ userId, date: { $gte: start, $lt: end } })
        .select("date count breakCount mood notes")
        .sort({ date: 1 });

    if (!logs.length) return null;

    const days = logs.map(log => {
        const d = new Date(log.date);
        const day = String(d.getDate()).padStart(2, "0");
        return {
            date: `${day}/${paddedMonth}/${year}`,
            count: log.count,
            breakCount: log.breakCount,
            mood: log.mood,
            notes: log.notes,
        };
    });

    const total = days.reduce((s, d) => s + d.count, 0);
    const maxDay = days.reduce((a, b) => b.count > a.count ? b : a);
    const minDay = days.reduce((a, b) => b.count < a.count ? b : a);

    return {
        month: `${paddedMonth}/${year}`,
        count: total,
        totalDays: days.length,
        max: { date: maxDay.date, count: maxDay.count },
        min: { date: minDay.date, count: minDay.count },
        days,
    };
};

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

    if (count !== undefined)      log.count      = Number(count);
    if (breakCount !== undefined) log.breakCount = Number(breakCount);
    if (mood !== undefined)       log.mood       = mood;

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

// ── Gap Stats ─────────────────────────────────────────────────────────────────
// Returns smoke-free gap frequency distribution — per year and globally.
// A "gap" = consecutive run of days where count === 0 (smoke-free).
//
// Response shape:
// {
//   globalGaps: { average: 8.3, top5: [{ gap: 10, count: 5 }, ...] },
//   yearlyGaps: { "2024": { average: 9.1, top5: [...] }, ... }
// }
//
// Sorting: top5 is sorted by occurrence COUNT descending (most frequent gap first).
// Tiebreaker: higher gap length ranks first.
const getGapStats = async function (userId) {
    // Fetch all logs sorted by date ascending
    const logs = await HabitLog.find({ userId }).select("date count").sort({ date: 1 });

    if (!logs.length) return { globalGaps: { average: 0, top5: [] }, yearlyGaps: {} };

    // ── Build per-year arrays of smoke-free flags ──────────────────────────────
    // Each log entry: smokeFree = (count === 0)
    const yearBuckets = {}; // { "2024": [true, false, true, ...] }

    for (const log of logs) {
        const d = new Date(log.date);
        const year = String(d.getFullYear());
        if (!yearBuckets[year]) yearBuckets[year] = [];
        yearBuckets[year].push(log.count === 0);
    }

    // ── Helper: compute gap runs from boolean array ────────────────────────────
    // Returns array of gap lengths, e.g. [3, 10, 2, 7]
    function computeRuns(flags) {
        const runs = [];
        let current = 0;
        for (const free of flags) {
            if (free) {
                current++;
            } else if (current > 0) {
                runs.push(current);
                current = 0;
            }
        }
        if (current > 0) runs.push(current);
        return runs;
    }

    // ── Helper: build { average, top5 } from a runs array ─────────────────────
    function buildGapResult(runs) {
        if (!runs.length) return { average: 0, top5: [] };

        // Frequency map: { gapLength -> occurrenceCount }
        const freq = {};
        for (const r of runs) {
            freq[r] = (freq[r] || 0) + 1;
        }

        // Average of all gap lengths (not weighted by frequency)
        const average = Math.round((runs.reduce((a, b) => a + b, 0) / runs.length) * 10) / 10;

        // Sort by occurrence count DESC, tiebreak by gap length DESC
        const sorted = Object.entries(freq)
            .map(([gap, count]) => ({ gap: Number(gap), count }))
            .sort((a, b) => b.count - a.count || b.gap - a.gap);

        return { average, top5: sorted.slice(0, 5) };
    }

    // ── Per-year computation ───────────────────────────────────────────────────
    const yearlyGaps = {};
    const allRuns = [];

    for (const [year, flags] of Object.entries(yearBuckets)) {
        const runs = computeRuns(flags);
        allRuns.push(...runs);
        yearlyGaps[year] = buildGapResult(runs);
    }

    // ── Global computation ─────────────────────────────────────────────────────
    const globalGaps = buildGapResult(allRuns);

    return { globalGaps, yearlyGaps };
};

export default { saveToMongo, saveMultipleToMongo, getUserHabitData, getSummary, getYearlyData, getMonthlyData, getMonthDetail, addSingleLog, editLog, deleteLog, getGapStats };