import express from 'express';
import { PostController } from '../controllers/post.controller';
import { validateRequest } from '../middleware/validation.middleware';
import { CreatePostSchema, UpdatePostSchema, GetPostsQuerySchema } from '../schemas/post.schema';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();
const postController = new PostController();

router.use(authenticate);

router.post(
  '/',
  validateRequest(CreatePostSchema),
  postController.createPost
);

router.get(
  '/',
  validateRequest(GetPostsQuerySchema),
  postController.getPosts
);

router.get(
  '/:id',
  postController.getPostById
);

router.put(
  '/:id',
  validateRequest(UpdatePostSchema),
  postController.updatePost
);

router.delete(
  '/:id',
  postController.deletePost
);

router.post(
  '/:id/like',
  postController.likePost
);

router.delete(
  '/:id/like',
  postController.unlikePost
);

export default router;