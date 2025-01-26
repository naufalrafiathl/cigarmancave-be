"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewController = void 0;
const review_service_1 = require("../services/review.service");
const errors_1 = require("../errors");
const reviewService = new review_service_1.ReviewService();
class ReviewController {
    async createReview(req, res, next) {
        var _a;
        try {
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            console.log('Creating review with user:', userId);
            console.log('Review data:', req.body);
            if (!userId) {
                throw new errors_1.UnauthorizedError();
            }
            const review = await reviewService.createReview(userId, req.body);
            res.status(201).json({
                status: 'success',
                data: review
            });
        }
        catch (error) {
            console.error('Review creation error:', error);
            next(error);
        }
    }
    async getReviewById(req, res, next) {
        try {
            const reviewId = parseInt(req.params.id);
            if (isNaN(reviewId)) {
                throw new errors_1.BadRequestError('Invalid review ID');
            }
            const review = await reviewService.getReviewById(reviewId);
            res.json({
                status: 'success',
                data: review
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getReviews(req, res, next) {
        var _a;
        try {
            const userId = (_a = req === null || req === void 0 ? void 0 : req.user) === null || _a === void 0 ? void 0 : _a.id;
            if (!userId) {
                throw new errors_1.UnauthorizedError('User not authenticated');
            }
            const { cigarId, page, limit } = req.query;
            const reviews = await reviewService.getReviews({
                cigarId: cigarId ? parseInt(cigarId) : undefined,
                userId,
                page: page ? parseInt(page) : undefined,
                limit: limit ? parseInt(limit) : undefined
            });
            res.json({
                status: 'success',
                data: reviews
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ReviewController = ReviewController;
//# sourceMappingURL=review.controller.js.map