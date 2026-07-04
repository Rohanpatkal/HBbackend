import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
    {
        text: {
            type: String,
            required: true,
            trim: true,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    { _id: false }
);

const habitLogSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        date: {
            type: Date,
            required: true,
            index: true,
        },

        count: {
            type: Number,
            required: true,
            default: 0,
        },

        breakCount: {
            type: Number,
            default: 0,
        },

        mood: {
            type: String,
            default: "",
        },

        notes: [noteSchema]
    },
    {
        timestamps: true,
    }
);

habitLogSchema.index(
    { userId: 1, date: 1 },
    { unique: true }
);

export default mongoose.model("HabitLog", habitLogSchema);