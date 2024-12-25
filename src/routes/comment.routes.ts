import express from 'express';
import { CommentController } from '../controllers/comment.controller';
import { validateRequest } from '../middleware/validation.middleware';
import { 
  CreateCommentSchema, 
  UpdateCommentSchema, 
  GetCommentsQuerySchema 
} from '../schemas/comment.schema';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router({ mergeParams: true }); // Enable access to params from parent router
const commentController = new CommentController();

router.use(authenticate);

// Create a new comment
router.post(
  '/',
  validateRequest(CreateCommentSchema),
  commentController.createComment
);

// Get all comments for a post
router.get(
  '/',
  validateRequest(GetCommentsQuerySchema),
  commentController.getComments
);

// Get a specific comment
router.get(
  '/:commentId',
  commentController.getCommentById
);

// Update a comment
router.put(
  '/:commentId',
  validateRequest(UpdateCommentSchema),
  commentController.updateComment
);

// Delete a comment
router.delete(
  '/:commentId',
  commentController.deleteComment
);

export default router;