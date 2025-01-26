"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostService = void 0;
const client_1 = require("@prisma/client");
const errors_1 = require("../errors");
const moderation_service_1 = require("./moderation.service");
const prisma = new client_1.PrismaClient();
class PostService {
    constructor() {
        this.moderationService = new moderation_service_1.ModerationService();
    }
    getPostInclude(isDetailView = false) {
        return {
            user: {
                select: {
                    id: true,
                    fullName: true,
                    profileImageUrl: true,
                },
            },
            images: true,
            review: true,
            comments: Object.assign(Object.assign({ where: {
                    parentId: null,
                } }, (isDetailView ? {} : { take: 3 })), { orderBy: {
                    createdAt: "desc",
                }, include: {
                    user: {
                        select: {
                            id: true,
                            fullName: true,
                            profileImageUrl: true,
                        },
                    },
                    replies: {
                        include: {
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
                            user: {
                                select: {
                                    id: true,
                                    fullName: true,
                                    profileImageUrl: true,
                                },
                            },
                        },
                    },
                } }),
            likes: {
                include: {
                    user: {
                        select: {
                            id: true,
                            fullName: true,
                        },
                    },
                },
            },
            _count: {
                select: {
                    comments: true,
                    likes: true,
                },
            },
        };
    }
    async createPost(userId, data) {
        return await prisma.$transaction(async (tx) => {
            var _a;
            try {
                await this.moderationService.validateContent({
                    text: data.content,
                    imageUrls: data.imageUrls,
                });
                if (data.reviewId) {
                    const review = await tx.review.findUnique({
                        where: {
                            id: data.reviewId,
                            userId: userId,
                        },
                    });
                    if (!review) {
                        throw new errors_1.NotFoundError("Review not found or unauthorized");
                    }
                }
                const post = await tx.post.create({
                    data: {
                        content: data.content,
                        userId: userId,
                        reviewId: data.reviewId,
                    },
                });
                if ((_a = data.imageUrls) === null || _a === void 0 ? void 0 : _a.length) {
                    await tx.postImage.createMany({
                        data: data.imageUrls.map((url) => ({
                            url,
                            postId: post.id,
                        })),
                    });
                }
                const completePost = await tx.post.findUnique({
                    where: { id: post.id },
                    include: this.getPostInclude(false),
                });
                if (!completePost) {
                    throw new errors_1.NotFoundError("Failed to retrieve created post");
                }
                return completePost;
            }
            catch (error) {
                if (error instanceof moderation_service_1.ModerationError) {
                    throw error;
                }
                throw new errors_1.AppError(error instanceof Error ? error.message : 'Failed to create post', 400);
            }
        });
    }
    async getPostById(id, isDetailView = false) {
        const post = await prisma.post.findUnique({
            where: { id },
            include: this.getPostInclude(isDetailView),
        });
        if (!post) {
            throw new errors_1.NotFoundError("Post not found");
        }
        return post;
    }
    async getPosts(options) {
        const { userId, reviewId, page = 1, limit = 10, isDetailView = false, } = options;
        if (page < 1 || limit < 1) {
            throw new errors_1.ValidationError("Invalid pagination parameters");
        }
        const skip = (page - 1) * limit;
        const where = Object.assign(Object.assign({}, (userId && { userId })), (reviewId && { reviewId }));
        try {
            const [posts, total] = await Promise.all([
                prisma.post.findMany({
                    where,
                    include: this.getPostInclude(isDetailView),
                    orderBy: { createdAt: "desc" },
                    skip,
                    take: limit,
                }),
                prisma.post.count({ where }),
            ]);
            return {
                posts,
                pagination: {
                    total,
                    pages: Math.ceil(total / limit),
                    currentPage: page,
                    perPage: limit,
                },
            };
        }
        catch (error) {
            throw new errors_1.BadRequestError("Failed to fetch posts");
        }
    }
    async updatePost(userId, postId, data, isDetailView = false) {
        const post = await prisma.post.findUnique({
            where: { id: postId },
        });
        if (!post) {
            throw new errors_1.NotFoundError("Post not found");
        }
        if (post.userId !== userId) {
            throw new errors_1.UnauthorizedError("Not authorized to update this post");
        }
        try {
            const updatedPost = await prisma.post.update({
                where: { id: postId },
                data: {
                    content: data.content,
                },
                include: this.getPostInclude(isDetailView),
            });
            const totalLikes = updatedPost.likes.length;
            const totalComments = updatedPost._count.comments;
            const totalEngagement = totalLikes + totalComments;
            return Object.assign(Object.assign({}, updatedPost), { engagement: {
                    totalLikes,
                    totalComments,
                    totalEngagement,
                    hasMoreComments: !isDetailView && updatedPost.comments.length >= 3,
                } });
        }
        catch (error) {
            console.error("Failed to update post:", error);
            throw new errors_1.BadRequestError("Failed to update post");
        }
    }
    async deletePost(userId, postId) {
        const post = await prisma.post.findUnique({
            where: { id: postId },
        });
        if (!post) {
            throw new errors_1.NotFoundError("Post not found");
        }
        if (post.userId !== userId) {
            throw new errors_1.UnauthorizedError("Not authorized to delete this post");
        }
        try {
            await prisma.$transaction([
                prisma.like.deleteMany({
                    where: { postId },
                }),
                prisma.comment.deleteMany({
                    where: { postId },
                }),
                prisma.postImage.deleteMany({
                    where: { postId },
                }),
                prisma.post.delete({
                    where: { id: postId },
                }),
            ]);
        }
        catch (error) {
            throw new errors_1.BadRequestError("Failed to delete post");
        }
    }
    async likePost(userId, postId) {
        try {
            await prisma.like.create({
                data: {
                    userId,
                    postId,
                },
            });
        }
        catch (error) {
            if (error.code === "P2002") {
                throw new errors_1.BadRequestError("Post already liked");
            }
            throw new errors_1.BadRequestError("Failed to like post");
        }
    }
    async unlikePost(userId, postId) {
        try {
            await prisma.like.delete({
                where: {
                    postId_userId: {
                        postId,
                        userId,
                    },
                },
            });
        }
        catch (error) {
            if (error.code === "P2025") {
                throw new errors_1.NotFoundError("Like not found");
            }
            throw new errors_1.BadRequestError("Failed to unlike post");
        }
    }
}
exports.PostService = PostService;
//# sourceMappingURL=post.service.js.map