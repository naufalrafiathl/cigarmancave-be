import { Request, Response, NextFunction } from 'express';
import { PostService } from '../services/post.service';
import { UnauthorizedError, BadRequestError } from '../errors';

const postService = new PostService();

export class PostController {
  async createPost(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError();
      }

      const post = await postService.createPost(userId, req.body);
      
      res.status(201).json({
        status: 'success',
        data: post
      });
    } catch (error) {
      next(error);
    }
  }

  async getPostById(req: Request, res: Response, next: NextFunction) {
    try {
      const postId = parseInt(req.params.id);
      const isDetailView = req.query.isDetailView === 'true';
      if (isNaN(postId)) {
        throw new BadRequestError('Invalid post ID');
      }

      const post = await postService.getPostById(postId,isDetailView);
      
      res.json({
        status: 'success',
        data: post
      });
    } catch (error) {
      next(error);
    }
  }

  async getPosts(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, reviewId, page, limit } = req.query;

      const posts = await postService.getPosts({
        userId: userId ? parseInt(userId as string) : undefined,
        reviewId: reviewId ? parseInt(reviewId as string) : undefined,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined
      });

      res.json({
        status: 'success',
        data: posts
      });
    } catch (error) {
      next(error);
    }
  }

  async updatePost(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const postId = parseInt(req.params.id);
      
      if (!userId) {
        throw new UnauthorizedError();
      }
      if (isNaN(postId)) {
        throw new BadRequestError('Invalid post ID');
      }

      const post = await postService.updatePost(userId, postId, req.body);
      
      res.json({
        status: 'success',
        data: post
      });
    } catch (error) {
      next(error);
    }
  }

  async deletePost(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const postId = parseInt(req.params.id);
      
      if (!userId) {
        throw new UnauthorizedError();
      }
      if (isNaN(postId)) {
        throw new BadRequestError('Invalid post ID');
      }

      await postService.deletePost(userId, postId);
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async likePost(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const postId = parseInt(req.params.id);
      
      if (!userId) {
        throw new UnauthorizedError();
      }
      if (isNaN(postId)) {
        throw new BadRequestError('Invalid post ID');
      }

      await postService.likePost(userId, postId);
      
      res.status(201).json({
        status: 'success',
        message: 'Post liked successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async unlikePost(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const postId = parseInt(req.params.id);
      
      if (!userId) {
        throw new UnauthorizedError();
      }
      if (isNaN(postId)) {
        throw new BadRequestError('Invalid post ID');
      }

      await postService.unlikePost(userId, postId);
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}