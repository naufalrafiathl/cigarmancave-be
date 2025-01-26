"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const post_controller_1 = require("../controllers/post.controller");
const validation_middleware_1 = require("../middleware/validation.middleware");
const post_schema_1 = require("../schemas/post.schema");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
const postController = new post_controller_1.PostController();
router.use(auth_middleware_1.authenticate);
router.post('/', (0, validation_middleware_1.validateRequest)(post_schema_1.CreatePostSchema), postController.createPost);
router.get('/', (0, validation_middleware_1.validateRequest)(post_schema_1.GetPostsQuerySchema), postController.getPosts);
router.get('/:id', postController.getPostById);
router.put('/:id', (0, validation_middleware_1.validateRequest)(post_schema_1.UpdatePostSchema), postController.updatePost);
router.delete('/:id', postController.deletePost);
router.post('/:id/like', postController.likePost);
router.delete('/:id/like', postController.unlikePost);
exports.default = router;
//# sourceMappingURL=post.routes.js.map