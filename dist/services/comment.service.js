"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentService = void 0;
const client_1 = require("@prisma/client");
const errors_1 = require("../errors");
const moderation_service_1 = require("./moderation.service");
const prisma = new client_1.PrismaClient();
class CommentService {
    constructor() {
        this.defaultCommentInclude = {
            user: {
                select: {
                    id: true,
                    fullName: true,
                    profileImageUrl: true,
                },
            },
            replies: {
                include: {
                    user: {
                        select: {
                            id: true,
                            fullName: true,
                            profileImageUrl: true,
                        },
                    },
                },
            },
        };
        this.moderationService = new moderation_service_1.ModerationService();
    }
    async createComment(userId, postId, data) {
        await this.moderationService.validateContent({
            text: data.content
        });
        const post = await prisma.post.findUnique({
            where: { id: postId },
        });
        if (!post) {
            throw new errors_1.NotFoundError("Post not found");
        }
        if (data.parentId) {
            const parentComment = await prisma.comment.findUnique({
                where: {
                    id: data.parentId,
                    postId: postId,
                },
            });
            if (!parentComment) {
                throw new errors_1.NotFoundError("Parent comment not found");
            }
        }
        try {
            const comment = await prisma.comment.create({
                data: {
                    content: data.content,
                    userId,
                    postId,
                    parentId: data.parentId,
                },
                include: this.defaultCommentInclude,
            });
            return comment;
        }
        catch (error) {
            if (error instanceof moderation_service_1.ModerationError) {
                throw error;
            }
            throw new errors_1.BadRequestError("Failed to create comment");
        }
    }
    async getCommentById(postId, commentId) {
        const comment = await prisma.comment.findUnique({
            where: {
                id: commentId,
                postId,
            },
            include: this.defaultCommentInclude,
        });
        if (!comment) {
            throw new errors_1.NotFoundError("Comment not found");
        }
        return comment;
    }
    async getComments(options) {
        const { postId, parentId, page = 1, limit = 10 } = options;
        if (page < 1 || limit < 1) {
            throw new errors_1.ValidationError("Invalid pagination parameters");
        }
        const skip = (page - 1) * limit;
        const where = {
            postId,
            parentId: parentId !== null && parentId !== void 0 ? parentId : null,
        };
        try {
            const [comments, total] = await Promise.all([
                prisma.comment.findMany({
                    where,
                    include: this.defaultCommentInclude,
                    orderBy: { createdAt: "desc" },
                    skip,
                    take: limit,
                }),
                prisma.comment.count({ where }),
            ]);
            return {
                comments,
                pagination: {
                    total,
                    pages: Math.ceil(total / limit),
                    currentPage: page,
                    perPage: limit,
                },
            };
        }
        catch (error) {
            throw new errors_1.BadRequestError("Failed to fetch comments");
        }
    }
    async updateComment(userId, postId, commentId, data) {
        const comment = await prisma.comment.findUnique({
            where: {
                id: commentId,
                postId,
            },
        });
        if (!comment) {
            throw new errors_1.NotFoundError("Comment not found");
        }
        if (comment.userId !== userId) {
            throw new errors_1.UnauthorizedError("Not authorized to update this comment");
        }
        try {
            const updatedComment = await prisma.comment.update({
                where: { id: commentId },
                data: {
                    content: data.content,
                },
                include: this.defaultCommentInclude,
            });
            return updatedComment;
        }
        catch (error) {
            throw new errors_1.BadRequestError("Failed to update comment");
        }
    }
    async deleteComment(userId, postId, commentId) {
        const comment = await prisma.comment.findUnique({
            where: {
                id: commentId,
                postId,
            },
        });
        if (!comment) {
            throw new errors_1.NotFoundError("Comment not found");
        }
        if (comment.userId !== userId) {
            throw new errors_1.UnauthorizedError("Not authorized to delete this comment");
        }
        try {
            await prisma.$transaction([
                prisma.comment.deleteMany({
                    where: { parentId: commentId },
                }),
                prisma.comment.delete({
                    where: { id: commentId },
                }),
            ]);
        }
        catch (error) {
            throw new errors_1.BadRequestError("Failed to delete comment");
        }
    }
}
exports.CommentService = CommentService;
//# sourceMappingURL=comment.service.js.map