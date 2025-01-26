"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewService = void 0;
const client_1 = require("@prisma/client");
const errors_1 = require("../errors");
const library_1 = require("@prisma/client/runtime/library");
const moderation_service_1 = require("./moderation.service");
const achievement_event_1 = require("./events/achievement.event");
const achievement_1 = require("../types/achievement");
const prisma = new client_1.PrismaClient();
class ReviewService {
    constructor() {
        this.moderationService = new moderation_service_1.ModerationService();
    }
    calculateOverallScore(review) {
        const scores = [
            review.constructionScore,
            review.drawScore,
            review.flavorScore,
            review.burnScore,
            review.impressionScore,
        ].filter((score) => score !== undefined);
        if (scores.length === 0)
            return 0;
        return Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2));
    }
    async createReview(userId, data) {
        await this.moderationService.validateContent({
            text: data.notes,
        });
        const cigar = await prisma.cigar.findUnique({
            where: { id: data.cigarId },
        });
        if (!cigar) {
            throw new errors_1.NotFoundError("Cigar not found");
        }
        return await prisma.$transaction(async (tx) => {
            var _a, _b;
            try {
                if (data.humidorCigarId) {
                    const humidorCigar = await tx.humidorCigar.findUnique({
                        where: { id: data.humidorCigarId },
                        include: {
                            humidor: true,
                        },
                    });
                    if (humidorCigar && humidorCigar.humidor.userId === userId) {
                        if (humidorCigar.quantity === 1) {
                            await tx.humidorCigar.delete({
                                where: { id: data.humidorCigarId },
                            });
                        }
                        else {
                            await tx.humidorCigar.update({
                                where: { id: data.humidorCigarId },
                                data: {
                                    quantity: {
                                        decrement: 1,
                                    },
                                },
                            });
                        }
                    }
                }
                const review = await tx.review.create({
                    data: {
                        userId,
                        cigarId: data.cigarId,
                        date: new Date(),
                        strength: data.strength,
                        duration: data.duration,
                        constructionScore: data.constructionScore,
                        drawScore: data.drawScore,
                        flavorScore: data.flavorScore,
                        burnScore: data.burnScore,
                        impressionScore: data.impressionScore,
                        overallScore: this.calculateOverallScore(data),
                        FirstThird: data.FirstThird || [],
                        SecondThird: data.SecondThird || [],
                        FinalThird: data.FinalThird || [],
                        flavorPepperScore: data.flavorPepperScore,
                        flavorChocolateScore: data.flavorChocolateScore,
                        flavorCreamyScore: data.flavorCreamyScore,
                        flavorLeatherScore: data.flavorLeatherScore,
                        flavorWoodyScore: data.flavorWoodyScore,
                        flavorEarthyScore: data.flavorEarthyScore,
                        flavorNuttyScore: data.flavorNuttyScore,
                        flavorSweetScore: data.flavorSweetScore,
                        flavorFruityScore: data.flavorFruityScore,
                        flavorGrassyScore: data.flavorGrassyScore,
                        flavorBerryScore: data.flavorBerryScore,
                        flavorCoffeeScore: data.flavorCoffeeScore,
                        flavorBittersScore: data.flavorBittersScore,
                        notes: data.notes,
                        buyAgain: data.buyAgain,
                    },
                });
                if ((_a = data.images) === null || _a === void 0 ? void 0 : _a.length) {
                    await tx.reviewImage.createMany({
                        data: data.images.map((url) => ({
                            url,
                            reviewId: review.id,
                        })),
                    });
                }
                if ((_b = data.pairings) === null || _b === void 0 ? void 0 : _b.length) {
                    for (const pairing of data.pairings) {
                        const pairingRecord = await tx.pairing.upsert({
                            where: {
                                name_type: {
                                    name: pairing.name,
                                    type: pairing.type,
                                },
                            },
                            create: {
                                name: pairing.name,
                                type: pairing.type,
                            },
                            update: {},
                        });
                        await tx.reviewPairing.create({
                            data: {
                                reviewId: review.id,
                                pairingId: pairingRecord.id,
                                notes: pairing.notes,
                            },
                        });
                    }
                }
                const completeReview = await tx.review.findUnique({
                    where: { id: review.id },
                    include: {
                        images: true,
                        user: {
                            select: {
                                id: true,
                                fullName: true,
                                profileImageUrl: true,
                            },
                        },
                        cigar: true,
                    },
                });
                if (!completeReview) {
                    throw new errors_1.NotFoundError("Failed to retrieve created review");
                }
                achievement_event_1.achievementEvents.emitAchievementEvent({
                    userId: userId,
                    type: achievement_1.AchievementEventType.REVIEW_CREATED,
                });
                return completeReview;
            }
            catch (error) {
                if (error instanceof moderation_service_1.ModerationError) {
                    throw error;
                }
                if (error instanceof library_1.PrismaClientKnownRequestError) {
                    throw new errors_1.BadRequestError(`Database error: ${error.message}`);
                }
                throw error;
            }
        });
    }
    async getReviewById(id) {
        const review = await prisma.review.findUnique({
            where: { id },
            include: {
                images: true,
                pairings: {
                    include: {
                        pairing: true,
                    },
                },
            },
        });
        if (!review) {
            throw new errors_1.NotFoundError("Review not found");
        }
        return review;
    }
    async getReviews(options) {
        const { userId, cigarId, page = 1, limit = 10 } = options;
        if (!userId) {
            throw new errors_1.ValidationError("User ID is required");
        }
        if (page < 1 || limit < 1) {
            throw new errors_1.ValidationError("Invalid pagination parameters");
        }
        const skip = (page - 1) * limit;
        const where = Object.assign({ userId }, (cigarId && { cigarId }));
        try {
            const [reviews, total] = await Promise.all([
                prisma.review.findMany({
                    where,
                    include: {
                        images: true,
                        cigar: {
                            include: {
                                brand: true,
                            },
                        },
                        user: {
                            select: {
                                id: true,
                                fullName: true,
                                profileImageUrl: true,
                            },
                        },
                        pairings: {
                            include: {
                                pairing: true,
                            },
                        },
                    },
                    orderBy: { createdAt: "desc" },
                    skip,
                    take: limit,
                }),
                prisma.review.count({ where }),
            ]);
            const transformedReviews = reviews.map((review) => (Object.assign(Object.assign({}, review), { cigar: {
                    id: review.cigar.id,
                    name: review.cigar.name,
                    brand: review.cigar.brand.name,
                } })));
            return {
                reviews: transformedReviews,
                pagination: {
                    total,
                    pages: Math.ceil(total / limit),
                    currentPage: page,
                    perPage: limit,
                },
            };
        }
        catch (error) {
            console.error("Error fetching reviews:", error);
            throw new errors_1.BadRequestError("Failed to fetch reviews");
        }
    }
}
exports.ReviewService = ReviewService;
//# sourceMappingURL=review.service.js.map