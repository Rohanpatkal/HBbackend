import Comment from "../dao/comment.js";

/**
 * Get all comments, newest first.
 * Returns an array of comment objects.
 */
export async function getComments({ limit = 50, skip = 0 } = {}) {
    const [comments, total] = await Promise.all([
        Comment.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Comment.countDocuments(),
    ]);
    return { comments, total };
}

/**
 * Add a new comment.
 * Returns the saved comment document.
 */
export async function addComment({ userId, userName, text }) {
    if (!text?.trim()) throw new Error("Comment text is required");
    const comment = await Comment.create({ userId, userName, text: text.trim() });
    return comment;
}

/**
 * Delete a comment — only the author can delete their own comment.
 */
export async function deleteComment(commentId, userId) {
    const comment = await Comment.findOne({ _id: commentId, userId });
    if (!comment) throw new Error("Comment not found or you are not the author");
    await comment.deleteOne();
    return comment;
}

/**
 * Toggle like on a comment.
 * If the user has already liked it, remove the like.
 * Returns the updated comment.
 */
export async function toggleLike(commentId, userId) {
    const comment = await Comment.findById(commentId);
    if (!comment) throw new Error("Comment not found");

    const alreadyLiked = comment.likedBy.some(id => id.toString() === userId.toString());

    if (alreadyLiked) {
        comment.likedBy = comment.likedBy.filter(id => id.toString() !== userId.toString());
        comment.likes   = Math.max(0, comment.likes - 1);
    } else {
        comment.likedBy.push(userId);
        comment.likes += 1;
    }

    await comment.save();
    return comment;
}
