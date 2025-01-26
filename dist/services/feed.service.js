"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeedService = void 0;
const client_1 = require("@prisma/client");
const errors_1 = require("../errors");
const prisma = new client_1.PrismaClient();
class FeedService {
    constructor() {
        this.defaultPostInclude = {
            user: {
                select: {
                    id: true,
                    fullName: true,
                    profileImageUrl: true
                }
            },
            review: {
                include: {
                    images: true,
                    cigar: {
                        include: {
                            brand: true
                        }
                    },
                    pairings: {
                        include: {
                            pairing: true
                        }
                    }
                }
            },
            comments: {
                where: {
                    parentId: null
                },
                take: 3,
                orderBy: {
                    createdAt: 'desc'
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            fullName: true,
                            profileImageUrl: true
                        }
                    },
                    replies: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    fullName: true,
                                    profileImageUrl: true
                                }
                            }
                        }
                    }
                }
            },
            images: true,
            likes: {
                include: {
                    user: {
                        select: {
                            id: true,
                            fullName: true
                        }
                    }
                }
            }
        };
    }
    async getFeed(options) {
        const { page = 1, limit = 10, sortBy = 'recent', filterBy = 'all', startDate, endDate } = options;
        let where = {};
        if (filterBy === 'reviews') {
            where.reviewId = { not: null };
        }
        else if (filterBy === 'general') {
            where.reviewId = null;
        }
        if (startDate || endDate) {
            where.createdAt = Object.assign(Object.assign({}, (startDate && { gte: startDate })), (endDate && { lte: endDate }));
        }
        let orderBy = { createdAt: 'desc' };
        if (sortBy === 'hot') {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            where.createdAt = { gte: weekAgo };
            orderBy = {
                createdAt: 'desc'
            };
        }
        else if (sortBy === 'top') {
            orderBy = {
                createdAt: 'desc'
            };
        }
        try {
            const [posts, total] = await Promise.all([
                prisma.post.findMany({
                    where,
                    include: this.defaultPostInclude,
                    orderBy,
                    skip: (page - 1) * limit,
                    take: limit
                }),
                prisma.post.count({ where })
            ]);
            let processedPosts = posts.map(post => {
                const totalLikes = post.likes.length;
                const totalComments = post.comments.length;
                const totalEngagement = totalLikes + totalComments;
                return Object.assign(Object.assign({}, post), { engagement: {
                        totalLikes,
                        totalComments,
                        totalEngagement,
                        hasMoreComments: post.comments.length >= 3
                    } });
            });
            if (sortBy === 'hot') {
                processedPosts = processedPosts.sort((a, b) => {
                    const aAge = Date.now() - new Date(a.createdAt).getTime();
                    const bAge = Date.now() - new Date(b.createdAt).getTime();
                    const aScore = (a.engagement.totalEngagement) / Math.pow(aAge / 3600000 + 2, 1.5);
                    const bScore = (b.engagement.totalEngagement) / Math.pow(bAge / 3600000 + 2, 1.5);
                    return bScore - aScore;
                });
            }
            else if (sortBy === 'top') {
                processedPosts = processedPosts.sort((a, b) => b.engagement.totalEngagement - a.engagement.totalEngagement);
            }
            return {
                posts: processedPosts,
                pagination: {
                    total,
                    pages: Math.ceil(total / limit),
                    currentPage: page,
                    perPage: limit
                }
            };
        }
        catch (error) {
            console.error('Feed fetch error:', error);
            throw new errors_1.BadRequestError('Failed to fetch feed');
        }
    }
}
exports.FeedService = FeedService;
//# sourceMappingURL=feed.service.js.map