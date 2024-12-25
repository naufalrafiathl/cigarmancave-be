import express from 'express';
import { PostController } from '../controllers/post.controller';
import { validateRequest } from '../middleware/validation.middleware';
import { CreatePostSchema, UpdatePostSchema, GetPostsQuerySchema } from '../schemas/post.schema';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();
const postController = new PostController();

router.use(authenticate);

// Create a new post
router.post(
  '/',
  validateRequest(CreatePostSchema),
  postController.createPost
);

// Get all posts with filters
router.get(
  '/',
  validateRequest(GetPostsQuerySchema),
  postController.getPosts
);

// Get a specific post
router.get(
  '/:id',
  postController.getPostById
);

// Update a post
router.put(
  '/:id',
  validateRequest(UpdatePostSchema),
  postController.updatePost
);

// Delete a post
router.delete(
  '/:id',
  postController.deletePost
);

// Like a post
router.post(
  '/:id/like',
  postController.likePost
);

// Unlike a post
router.delete(
  '/:id/like',
  postController.unlikePost
);

export default router;