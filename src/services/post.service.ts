import { PrismaClient, Prisma } from "@prisma/client";
import {
  NotFoundError,
  ValidationError,
  BadRequestError,
  UnauthorizedError,
  AppError,
} from "../errors";
import { ModerationService, ModerationError } from "./moderation.service";

const prisma = new PrismaClient();

export class PostService {
  private moderationService: ModerationService;

  constructor() {
    this.moderationService = new ModerationService();
  }

  private getPostInclude(isDetailView = false): Prisma.PostInclude {
    return {
      user: {
        select: {
          id: true,
          fullName: true,
          profileImageUrl: true,
        },
      },
      images: true,
      review: true,
      comments: {
        where: {
          parentId: null,
        },
        ...(isDetailView ? {} : { take: 3 }),
        orderBy: {
          createdAt: "desc" as const,
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              profileImageUrl: true,
            },
          },
          replies: {
            include: {
              replies: {
                include: {
                  user: {
                    select: {
                      id: true,
                      fullName: true,
                      profileImageUrl: true,
                    },
                  },
                },
              },
              user: {
                select: {
                  id: true,
                  fullName: true,
                  profileImageUrl: true,
                },
              },
            },
          },
        },
      },
      likes: {
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
      },
      _count: {
        select: {
          comments: true,
          likes: true,
        },
      },
    };
  }
  async createPost(userId: number, data: any) {
    return await prisma.$transaction(async (tx) => {
      try {
        await this.moderationService.validateContent({
          text: data.content,
          imageUrls: data.imageUrls,
        });

        if (data.reviewId) {
          const review = await tx.review.findUnique({
            where: {
              id: data.reviewId,
              userId: userId,
            },
          });

          if (!review) {
            throw new NotFoundError("Review not found or unauthorized");
          }
        }

        const post = await tx.post.create({
          data: {
            content: data.content,
            userId: userId,
            reviewId: data.reviewId,
          },
        });

        if (data.imageUrls?.length) {
          await tx.postImage.createMany({
            data: data.imageUrls.map((url: string) => ({
              url,
              postId: post.id,
            })),
          });
        }

        const completePost = await tx.post.findUnique({
          where: { id: post.id },
          include: this.getPostInclude(false),
        });

        if (!completePost) {
          throw new NotFoundError("Failed to retrieve created post");
        }

        return completePost;
      } catch (error) {
        if (error instanceof ModerationError) {
          throw error;
        }
        throw new AppError(
          error instanceof Error ? error.message : 'Failed to create post',
          400
        );
      }
      
    });
  }

  async getPostById(id: number, isDetailView = false) {
    const post = await prisma.post.findUnique({
      where: { id },
      include: this.getPostInclude(isDetailView),
    });

    if (!post) {
      throw new NotFoundError("Post not found");
    }

    return post;
  }

  async getPosts(options: {
    userId?: number;
    reviewId?: number;
    page?: number;
    limit?: number;
    isDetailView?: boolean;
  }) {
    const {
      userId,
      reviewId,
      page = 1,
      limit = 10,
      isDetailView = false,
    } = options;

    if (page < 1 || limit < 1) {
      throw new ValidationError("Invalid pagination parameters");
    }

    const skip = (page - 1) * limit;
    const where = {
      ...(userId && { userId }),
      ...(reviewId && { reviewId }),
    };

    try {
      const [posts, total] = await Promise.all([
        prisma.post.findMany({
          where,
          include: this.getPostInclude(isDetailView),
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.post.count({ where }),
      ]);

      return {
        posts,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          currentPage: page,
          perPage: limit,
        },
      };
    } catch (error) {
      throw new BadRequestError("Failed to fetch posts");
    }
  }

  async updatePost(
    userId: number,
    postId: number,
    data: any,
    isDetailView = false
  ) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundError("Post not found");
    }

    if (post.userId !== userId) {
      throw new UnauthorizedError("Not authorized to update this post");
    }

    try {
      const updatedPost = await prisma.post.update({
        where: { id: postId },
        data: {
          content: data.content,
        },
        include: this.getPostInclude(isDetailView),
      });

      const totalLikes = updatedPost.likes.length;
      const totalComments = updatedPost._count.comments;
      const totalEngagement = totalLikes + totalComments;

      return {
        ...updatedPost,
        engagement: {
          totalLikes,
          totalComments,
          totalEngagement,
          hasMoreComments: !isDetailView && updatedPost.comments.length >= 3,
        },
      };
    } catch (error) {
      console.error("Failed to update post:", error);
      throw new BadRequestError("Failed to update post");
    }
  }

  async deletePost(userId: number, postId: number) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundError("Post not found");
    }

    if (post.userId !== userId) {
      throw new UnauthorizedError("Not authorized to delete this post");
    }

    try {
      await prisma.$transaction([
        prisma.like.deleteMany({
          where: { postId },
        }),
        prisma.comment.deleteMany({
          where: { postId },
        }),
        prisma.postImage.deleteMany({
          where: { postId },
        }),
        prisma.post.delete({
          where: { id: postId },
        }),
      ]);
    } catch (error) {
      throw new BadRequestError("Failed to delete post");
    }
  }

  async likePost(userId: number, postId: number) {
    try {
      await prisma.like.create({
        data: {
          userId,
          postId,
        },
      });
    } catch (error) {
      if (error.code === "P2002") {
        throw new BadRequestError("Post already liked");
      }
      throw new BadRequestError("Failed to like post");
    }
  }

  async unlikePost(userId: number, postId: number) {
    try {
      await prisma.like.delete({
        where: {
          postId_userId: {
            postId,
            userId,
          },
        },
      });
    } catch (error) {
      if (error.code === "P2025") {
        throw new NotFoundError("Like not found");
      }
      throw new BadRequestError("Failed to unlike post");
    }
  }
}
