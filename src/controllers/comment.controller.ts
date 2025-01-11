import { Request, Response, NextFunction } from 'express';
import { CommentService } from '../services/comment.service';
import { UnauthorizedError, BadRequestError } from '../errors';

const commentService = new CommentService();

export class CommentController {
  async createComment(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const postId = parseInt(req.params.postId);
      
      if (!userId) {
        throw new UnauthorizedError();
      }

      const comment = await commentService.createComment(userId, postId, req.body);
      
      res.status(201).json({
        status: 'success',
        data: comment
      });
    } catch (error) {
      next(error);
    }
  }

  async getCommentById(req: Request, res: Response, next: NextFunction) {
    try {
      const postId = parseInt(req.params.postId);
      const commentId = parseInt(req.params.commentId);
      
      if (isNaN(postId) || isNaN(commentId)) {
        throw new BadRequestError('Invalid post or comment ID');
      }

      const comment = await commentService.getCommentById(postId, commentId);
      
      res.json({
        status: 'success',
        data: comment
      });
    } catch (error) {
      next(error);
    }
  }

  async getComments(req: Request, res: Response, next: NextFunction) {
    try {
      const postId = parseInt(req.params.postId);
      const { parentId, page, limit } = req.query;

      if (isNaN(postId)) {
        throw new BadRequestError('Invalid post ID');
      }

      const comments = await commentService.getComments({
        postId,
        parentId: parentId ? parseInt(parentId as string) : undefined,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined
      });

      res.json({
        status: 'success',
        data: comments
      });
    } catch (error) {
      next(error);
    }
  }

  async updateComment(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const postId = parseInt(req.params.postId);
      const commentId = parseInt(req.params.commentId);
      
      if (!userId) {
        throw new UnauthorizedError();
      }
      if (isNaN(postId) || isNaN(commentId)) {
        throw new BadRequestError('Invalid post or comment ID');
      }

      const comment = await commentService.updateComment(userId, postId, commentId, req.body);
      
      res.json({
        status: 'success',
        data: comment
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteComment(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const postId = parseInt(req.params.postId);
      const commentId = parseInt(req.params.commentId);
      
      if (!userId) {
        throw new UnauthorizedError();
      }
      if (isNaN(postId) || isNaN(commentId)) {
        throw new BadRequestError('Invalid post or comment ID');
      }

      await commentService.deleteComment(userId, postId, commentId);
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}