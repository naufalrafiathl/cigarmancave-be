// src/services/post.service.ts
import { PrismaClient } from '@prisma/client';
import { NotFoundError, ValidationError, BadRequestError, UnauthorizedError } from '../errors';

const prisma = new PrismaClient();

export class PostService {
  private readonly defaultPostInclude = {
    user: {
      select: {
        id: true,
        fullName: true,
        profileImageUrl: true,
      }
    },
    images: true,
    review: true,
    comments: {
      include: {
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
      }
    },
    likes: {
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
          }
        }
      }
    },
    _count: {
      select: {
        comments: true,
        likes: true,
      }
    }
  };

  async createPost(userId: number, data: any) {
    return await prisma.$transaction(async (tx) => {
      try {
        if (data.reviewId) {
          const review = await tx.review.findUnique({
            where: { 
              id: data.reviewId,
              userId: userId
            }
          });

          if (!review) {
            throw new NotFoundError('Review not found or unauthorized');
          }
        }

        // Create the post
        const post = await tx.post.create({
          data: {
            content: data.content,
            userId: userId,
            reviewId: data.reviewId,
          }
        });

        if (data.imageUrls?.length) {
          await tx.postImage.createMany({
            data: data.imageUrls.map((url: string) => ({
              url,
              postId: post.id
            }))
          });
        }

        const completePost = await tx.post.findUnique({
          where: { id: post.id },
          include: this.defaultPostInclude
        });

        if (!completePost) {
          throw new NotFoundError('Failed to retrieve created post');
        }

        return completePost;
      } catch (error) {
        throw new BadRequestError('Failed to create post');
      }
    });
  }

  async getPostById(id: number) {
    const post = await prisma.post.findUnique({
      where: { id },
      include: this.defaultPostInclude
    });

    if (!post) {
      throw new NotFoundError('Post not found');
    }

    return post;
  }

  async getPosts(options: {
    userId?: number;
    reviewId?: number;
    page?: number;
    limit?: number;
  }) {
    const { userId, reviewId, page = 1, limit = 10 } = options;
    
    if (page < 1 || limit < 1) {
      throw new ValidationError('Invalid pagination parameters');
    }

    const skip = (page - 1) * limit;
    const where = {
      ...(userId && { userId }),
      ...(reviewId && { reviewId })
    };

    try {
      const [posts, total] = await Promise.all([
        prisma.post.findMany({
          where,
          include: this.defaultPostInclude,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.post.count({ where })
      ]);

      return {
        posts,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          currentPage: page,
          perPage: limit
        }
      };
    } catch (error) {
      throw new BadRequestError('Failed to fetch posts');
    }
  }

  async updatePost(userId: number, postId: number, data: any) {
    // Verify post exists and belongs to user
    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post) {
      throw new NotFoundError('Post not found');
    }

    if (post.userId !== userId) {
      throw new UnauthorizedError('Not authorized to update this post');
    }

    try {
      const updatedPost = await prisma.post.update({
        where: { id: postId },
        data: {
          content: data.content
        },
        include: this.defaultPostInclude
      });

      return updatedPost;
    } catch (error) {
      throw new BadRequestError('Failed to update post');
    }
  }

  async deletePost(userId: number, postId: number) {
    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post) {
      throw new NotFoundError('Post not found');
    }

    if (post.userId !== userId) {
      throw new UnauthorizedError('Not authorized to delete this post');
    }

    try {
      await prisma.$transaction([
        prisma.like.deleteMany({
          where: { postId }
        }),
        prisma.comment.deleteMany({
          where: { postId }
        }),
        prisma.postImage.deleteMany({
          where: { postId }
        }),
        // Finally delete the post
        prisma.post.delete({
          where: { id: postId }
        })
      ]);
    } catch (error) {
      throw new BadRequestError('Failed to delete post');
    }
  }

  async likePost(userId: number, postId: number) {
    try {
      await prisma.like.create({
        data: {
          userId,
          postId
        }
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new BadRequestError('Post already liked');
      }
      throw new BadRequestError('Failed to like post');
    }
  }

  async unlikePost(userId: number, postId: number) {
    try {
      await prisma.like.delete({
        where: {
          postId_userId: {
            postId,
            userId
          }
        }
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundError('Like not found');
      }
      throw new BadRequestError('Failed to unlike post');
    }
  }
}