"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const comment_controller_1 = require("../controllers/comment.controller");
const validation_middleware_1 = require("../middleware/validation.middleware");
const comment_schema_1 = require("../schemas/comment.schema");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router({ mergeParams: true });
const commentController = new comment_controller_1.CommentController();
router.use(auth_middleware_1.authenticate);
router.post('/', (0, validation_middleware_1.validateRequest)(comment_schema_1.CreateCommentSchema), commentController.createComment);
router.get('/', (0, validation_middleware_1.validateRequest)(comment_schema_1.GetCommentsQuerySchema), commentController.getComments);
router.get('/:commentId', commentController.getCommentById);
router.put('/:commentId', (0, validation_middleware_1.validateRequest)(comment_schema_1.UpdateCommentSchema), commentController.updateComment);
router.delete('/:commentId', commentController.deleteComment);
exports.default = router;
//# sourceMappingURL=comment.routes.js.map