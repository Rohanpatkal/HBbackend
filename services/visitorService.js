import Visitor from "../dao/visitor.js";

// Extract the real client IP, handling proxies / load balancers
function getClientIp(req) {
    const forwarded = req.headers["x-forwarded-for"];
    if (forwarded) {
        // x-forwarded-for can be a comma-separated list — first is the real client
        return forwarded.split(",")[0].trim();
    }
    return req.socket?.remoteAddress ?? "unknown";
}

// Today as "YYYY-MM-DD" in UTC
function todayUTC() {
    return new Date().toISOString().slice(0, 10);
}

/**
 * Record a visit.
 * Uses upsert with unique index on { ip, date } so a single IP can only be
 * counted once per calendar day.  Returns { isNew: true/false }.
 */
export async function recordVisit(req) {
    const ip   = getClientIp(req);
    const date = todayUTC();

    try {
        await Visitor.create({ ip, date });
        return { isNew: true };
    } catch (err) {
        // Duplicate key error = same IP already visited today — that's fine
        if (err.code === 11000) return { isNew: false };
        throw err;
    }
}

/**
 * Return visitor counts.
 * - total:   all-time unique daily visitor count (total documents)
 * - today:   unique visitors today
 */
export async function getVisitorCounts() {
    const todayStr = todayUTC();

    const [total, today] = await Promise.all([
        Visitor.countDocuments(),
        Visitor.countDocuments({ date: todayStr }),
    ]);

    return { total, today };
}
