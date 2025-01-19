import express from 'express';
import { CommentController } from '../controllers/comment.controller';
import { validateRequest } from '../middleware/validation.middleware';
import { 
  CreateCommentSchema, 
  UpdateCommentSchema, 
  GetCommentsQuerySchema 
} from '../schemas/comment.schema';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router({ mergeParams: true }); 
const commentController = new CommentController();

router.use(authenticate);

router.post(
  '/',
  validateRequest(CreateCommentSchema),
  commentController.createComment
);

router.get(
  '/',
  validateRequest(GetCommentsQuerySchema),
  commentController.getComments
);

router.get(
  '/:commentId',
  commentController.getCommentById
);

router.put(
  '/:commentId',
  validateRequest(UpdateCommentSchema),
  commentController.updateComment
);

router.delete(
  '/:commentId',
  commentController.deleteComment
);

export default router;