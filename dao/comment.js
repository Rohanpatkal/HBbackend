import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        userName: {
            type: String,
            required: true,
            trim: true,
        },
        text: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1000,
        },
        likes: {
            type: Number,
            default: 0,
        },
        likedBy: {
            // stores userIds who liked — prevents double-liking
            type: [mongoose.Schema.Types.ObjectId],
            default: [],
        },
    },
    { timestamps: true }
);

export default mongoose.model("Comment", commentSchema);
