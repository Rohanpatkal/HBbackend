import mongoose from "mongoose";

// One document per calendar day per IP address.
// This lets us count unique daily visitors without a separate "all-time" counter —
// total visitors = count of all visitor documents ever created.
const visitorSchema = new mongoose.Schema(
    {
        ip: {
            type: String,
            required: true,
        },
        date: {
            type: String,   // "YYYY-MM-DD" — keeps the unique index simple
            required: true,
        },
    },
    { timestamps: true }
);

// One record per IP per day — duplicate visits in the same day are ignored
visitorSchema.index({ ip: 1, date: 1 }, { unique: true });

export default mongoose.model("Visitor", visitorSchema);
