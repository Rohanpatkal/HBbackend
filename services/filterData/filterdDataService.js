import communData from "../../common/common.json" with { type: "json" }
// ── Summary ──────────────────────────────────────────────────────────────────
// Returns global stats: total count, best/worst year, best/worst month

const getFilterdDetails = async function (logs) {
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
        yearMap[year] = (yearMap[year] || 0) + log.count; //year get reapetly and add values again and again
        monthMap[monthKey] = (monthMap[monthKey] || 0) + log.count; //month not get reapetly so month not add again and again
    }
    const sortedLogs = [...logs].sort(
        (a, b) => new Date(a.date) - new Date(b.date)
    );

    const gaps = [];

    for (let i = 1; i < sortedLogs.length; i++) {
        const previous = new Date(sortedLogs[i - 1].date);
        const current = new Date(sortedLogs[i].date);

        const diffInMs = current - previous;

        const gapDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

        gaps.push({
            from: sortedLogs[i - 1].date,
            to: sortedLogs[i].date,
            gap: gapDays
        });
    }

    return gaps.slice(communData.gaps_count); // Last 5 gaps

    // [
    //     {
    //         data: "04/2024",
    //         count: 4
    //     },
    //     {
    //         data: "04/2024",
    //         count: 4
    //     },
    //     {
    //         data: "04/2024",
    //         count: 4
    //     },
    //     {
    //         data: "04/2024",
    //         count: 4
    //     }
    // ]
    return {
        logs
    };
}


const getSummaryFilterd = async function (logs) {
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
        yearMap[year] = (yearMap[year] || 0) + log.count; //year get reapetly and add values again and again
        monthMap[monthKey] = (monthMap[monthKey] || 0) + log.count; //month not get reapetly so month not add again and again
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
// ── Single month detail ───────────────────────────────────────────────────────
// Returns day-level detail for one specific month with max/min day stats
const getMonthDetail = async function (logs, year, month) {
    const paddedMonth = month.padStart(2, "0");
    const start = new Date(`${year}-${paddedMonth}-01`);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);

    // Filter to only logs within this specific month
    const filtered = logs.filter(log => {
        const d = new Date(log.date);
        return d >= start && d < end;
    });

    if (!filtered.length) return null;

    const days = filtered.map(log => {
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

// ── Monthly breakdown for a year ─────────────────────────────────────────────
// Returns all months within a given year with count + day-level data
const getMonthlyData = async function (logs, year) {
    const start = new Date(`${year}-01-01`);
    const end = new Date(`${year}-12-31T23:59:59`);

    // Filter to only logs within the requested year
    const filtered = logs.filter(log => {
        const d = new Date(log.date);
        return d >= start && d <= end;
    });

    if (!filtered.length) return null;

    const monthMap = {};

    for (const log of filtered) {
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

// ── Yearly breakdown ──────────────────────────────────────────────────────────
// Returns count per year as a flat array — good for bar/line charts
const getYearlyData = async function (logs) {
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

export default {
    getSummaryFilterd,
    getMonthDetail,
    getMonthlyData,
    getYearlyData,
    getFilterdDetails
}