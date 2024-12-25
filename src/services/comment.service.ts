// src/services/comment.service.ts
import { PrismaClient } from '@prisma/client';
import { NotFoundError, ValidationError, BadRequestError, UnauthorizedError } from '../errors';

const prisma = new PrismaClient();

export class CommentService {
  private readonly defaultCommentInclude = {
    user: {
      select: {
        id: true,
        fullName: true,
        profileImageUrl: true,
      }
    },
    replies: {
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            profileImageUrl: true,
          }
        }
      }
    }
  };

  async createComment(userId: number, postId: number, data: any) {
    // Verify post exists
    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post) {
      throw new NotFoundError('Post not found');
    }

    // If this is a reply, verify parent comment exists and belongs to the same post
    if (data.parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { 
          id: data.parentId,
          postId: postId
        }
      });

      if (!parentComment) {
        throw new NotFoundError('Parent comment not found');
      }
    }

    try {
      const comment = await prisma.comment.create({
        data: {
          content: data.content,
          userId,
          postId,
          parentId: data.parentId
        },
        include: this.defaultCommentInclude
      });

      return comment;
    } catch (error) {
      throw new BadRequestError('Failed to create comment');
    }
  }

  async getCommentById(postId: number, commentId: number) {
    const comment = await prisma.comment.findUnique({
      where: { 
        id: commentId,
        postId
      },
      include: this.defaultCommentInclude
    });

    if (!comment) {
      throw new NotFoundError('Comment not found');
    }

    return comment;
  }

  async getComments(options: {
    postId: number;
    parentId?: number;
    page?: number;
    limit?: number;
  }) {
    const { postId, parentId, page = 1, limit = 10 } = options;
    
    if (page < 1 || limit < 1) {
      throw new ValidationError('Invalid pagination parameters');
    }

    const skip = (page - 1) * limit;
    const where = {
      postId,
      parentId: parentId ?? null // If parentId not provided, get top-level comments
    };

    try {
      const [comments, total] = await Promise.all([
        prisma.comment.findMany({
          where,
          include: this.defaultCommentInclude,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.comment.count({ where })
      ]);

      return {
        comments,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          currentPage: page,
          perPage: limit
        }
      };
    } catch (error) {
      throw new BadRequestError('Failed to fetch comments');
    }
  }

  async updateComment(userId: number, postId: number, commentId: number, data: any) {
    // Verify comment exists and belongs to the user
    const comment = await prisma.comment.findUnique({
      where: { 
        id: commentId,
        postId
      }
    });

    if (!comment) {
      throw new NotFoundError('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new UnauthorizedError('Not authorized to update this comment');
    }

    try {
      const updatedComment = await prisma.comment.update({
        where: { id: commentId },
        data: {
          content: data.content
        },
        include: this.defaultCommentInclude
      });

      return updatedComment;
    } catch (error) {
      throw new BadRequestError('Failed to update comment');
    }
  }

  async deleteComment(userId: number, postId: number, commentId: number) {
    // Verify comment exists and belongs to the user
    const comment = await prisma.comment.findUnique({
      where: { 
        id: commentId,
        postId
      }
    });

    if (!comment) {
      throw new NotFoundError('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new UnauthorizedError('Not authorized to delete this comment');
    }

    try {
      await prisma.$transaction([
        // First delete all replies to this comment
        prisma.comment.deleteMany({
          where: { parentId: commentId }
        }),
        // Then delete the comment itself
        prisma.comment.delete({
          where: { id: commentId }
        })
      ]);
    } catch (error) {
      throw new BadRequestError('Failed to delete comment');
    }
  }
}