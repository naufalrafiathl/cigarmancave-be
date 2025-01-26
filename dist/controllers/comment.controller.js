"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentController = void 0;
const comment_service_1 = require("../services/comment.service");
const errors_1 = require("../errors");
const commentService = new comment_service_1.CommentService();
class CommentController {
    async createComment(req, res, next) {
        var _a;
        try {
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            const postId = parseInt(req.params.postId);
            if (!userId) {
                throw new errors_1.UnauthorizedError();
            }
            const comment = await commentService.createComment(userId, postId, req.body);
            res.status(201).json({
                status: 'success',
                data: comment
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getCommentById(req, res, next) {
        try {
            const postId = parseInt(req.params.postId);
            const commentId = parseInt(req.params.commentId);
            if (isNaN(postId) || isNaN(commentId)) {
                throw new errors_1.BadRequestError('Invalid post or comment ID');
            }
            const comment = await commentService.getCommentById(postId, commentId);
            res.json({
                status: 'success',
                data: comment
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getComments(req, res, next) {
        try {
            const postId = parseInt(req.params.postId);
            const { parentId, page, limit } = req.query;
            if (isNaN(postId)) {
                throw new errors_1.BadRequestError('Invalid post ID');
            }
            const comments = await commentService.getComments({
                postId,
                parentId: parentId ? parseInt(parentId) : undefined,
                page: page ? parseInt(page) : undefined,
                limit: limit ? parseInt(limit) : undefined
            });
            res.json({
                status: 'success',
                data: comments
            });
        }
        catch (error) {
            next(error);
        }
    }
    async updateComment(req, res, next) {
        var _a;
        try {
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            const postId = parseInt(req.params.postId);
            const commentId = parseInt(req.params.commentId);
            if (!userId) {
                throw new errors_1.UnauthorizedError();
            }
            if (isNaN(postId) || isNaN(commentId)) {
                throw new errors_1.BadRequestError('Invalid post or comment ID');
            }
            const comment = await commentService.updateComment(userId, postId, commentId, req.body);
            res.json({
                status: 'success',
                data: comment
            });
        }
        catch (error) {
            next(error);
        }
    }
    async deleteComment(req, res, next) {
        var _a;
        try {
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            const postId = parseInt(req.params.postId);
            const commentId = parseInt(req.params.commentId);
            if (!userId) {
                throw new errors_1.UnauthorizedError();
            }
            if (isNaN(postId) || isNaN(commentId)) {
                throw new errors_1.BadRequestError('Invalid post or comment ID');
            }
            await commentService.deleteComment(userId, postId, commentId);
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    }
}
exports.CommentController = CommentController;
//# sourceMappingURL=comment.controller.js.map