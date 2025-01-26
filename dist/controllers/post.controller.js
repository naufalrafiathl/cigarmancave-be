"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostController = void 0;
const post_service_1 = require("../services/post.service");
const errors_1 = require("../errors");
const postService = new post_service_1.PostService();
class PostController {
    async createPost(req, res, next) {
        var _a;
        try {
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            if (!userId) {
                throw new errors_1.UnauthorizedError();
            }
            const post = await postService.createPost(userId, req.body);
            res.status(201).json({
                status: 'success',
                data: post
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getPostById(req, res, next) {
        try {
            const postId = parseInt(req.params.id);
            const isDetailView = req.query.isDetailView === 'true';
            if (isNaN(postId)) {
                throw new errors_1.BadRequestError('Invalid post ID');
            }
            const post = await postService.getPostById(postId, isDetailView);
            res.json({
                status: 'success',
                data: post
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getPosts(req, res, next) {
        try {
            const { userId, reviewId, page, limit } = req.query;
            const posts = await postService.getPosts({
                userId: userId ? parseInt(userId) : undefined,
                reviewId: reviewId ? parseInt(reviewId) : undefined,
                page: page ? parseInt(page) : undefined,
                limit: limit ? parseInt(limit) : undefined
            });
            res.json({
                status: 'success',
                data: posts
            });
        }
        catch (error) {
            next(error);
        }
    }
    async updatePost(req, res, next) {
        var _a;
        try {
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            const postId = parseInt(req.params.id);
            if (!userId) {
                throw new errors_1.UnauthorizedError();
            }
            if (isNaN(postId)) {
                throw new errors_1.BadRequestError('Invalid post ID');
            }
            const post = await postService.updatePost(userId, postId, req.body);
            res.json({
                status: 'success',
                data: post
            });
        }
        catch (error) {
            next(error);
        }
    }
    async deletePost(req, res, next) {
        var _a;
        try {
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            const postId = parseInt(req.params.id);
            if (!userId) {
                throw new errors_1.UnauthorizedError();
            }
            if (isNaN(postId)) {
                throw new errors_1.BadRequestError('Invalid post ID');
            }
            await postService.deletePost(userId, postId);
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    }
    async likePost(req, res, next) {
        var _a;
        try {
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            const postId = parseInt(req.params.id);
            if (!userId) {
                throw new errors_1.UnauthorizedError();
            }
            if (isNaN(postId)) {
                throw new errors_1.BadRequestError('Invalid post ID');
            }
            await postService.likePost(userId, postId);
            res.status(201).json({
                status: 'success',
                message: 'Post liked successfully'
            });
        }
        catch (error) {
            next(error);
        }
    }
    async unlikePost(req, res, next) {
        var _a;
        try {
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            const postId = parseInt(req.params.id);
            if (!userId) {
                throw new errors_1.UnauthorizedError();
            }
            if (isNaN(postId)) {
                throw new errors_1.BadRequestError('Invalid post ID');
            }
            await postService.unlikePost(userId, postId);
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    }
}
exports.PostController = PostController;
//# sourceMappingURL=post.controller.js.map