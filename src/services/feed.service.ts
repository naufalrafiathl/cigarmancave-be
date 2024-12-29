import { PrismaClient, Prisma } from '@prisma/client';
import { BadRequestError } from '../errors';

const prisma = new PrismaClient();

export type FeedSortType = 'recent' | 'top' | 'hot';
export type FeedFilterType = 'all' | 'reviews' | 'general';

interface FeedOptions {
  page?: number;
  limit?: number;
  sortBy?: FeedSortType;
  filterBy?: FeedFilterType;
  startDate?: Date;
  endDate?: Date;
}

export class FeedService {
  private readonly defaultPostInclude = {
    user: {
      select: {
        id: true,
        fullName: true,
        profileImageUrl: true
      }
    },
    review: {
      include: {
        images: true,
        cigar: {
          include: {
            brand: true
          }
        },
        pairings: {
          include: {
            pairing: true
          }
        }
      }
    },
    comments: {
      take: 3,
      orderBy: {
        createdAt: 'desc' as const
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            profileImageUrl: true
          }
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                profileImageUrl: true
              }
            }
          }
        }
      }
    },
    images: true,
    likes: {
      include: {
        user: {
          select: {
            id: true,
            fullName: true
          }
        }
      }
    }
  } satisfies Prisma.PostInclude;

  async getFeed(options: FeedOptions) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'recent',
      filterBy = 'all',
      startDate,
      endDate
    } = options;

    let where: any = {};

    if (filterBy === 'reviews') {
      where.reviewId = { not: null };
    } else if (filterBy === 'general') {
      where.reviewId = null;
    }

    if (startDate || endDate) {
      where.createdAt = {
        ...(startDate && { gte: startDate }),
        ...(endDate && { lte: endDate })
      };
    }

    let orderBy: Prisma.PostOrderByWithRelationInput = { createdAt: 'desc' };
    
    if (sortBy === 'hot') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      where.createdAt = { gte: weekAgo };
      
      orderBy = { 
        createdAt: 'desc'
      };
    } else if (sortBy === 'top') {
      orderBy = { 
        createdAt: 'desc'
      };
    }

    try {
      const [posts, total] = await Promise.all([
        prisma.post.findMany({
          where,
          include: this.defaultPostInclude,
          orderBy,
          skip: (page - 1) * limit,
          take: limit
        }),
        prisma.post.count({ where })
      ]);

      let processedPosts = posts.map(post => {
        const totalLikes = post.likes.length;
        const totalComments = post.comments.length;
        const totalEngagement = totalLikes + totalComments;
        
        return {
          ...post,
          engagement: {
            totalLikes,
            totalComments,
            totalEngagement,
            hasMoreComments: post.comments.length >= 3
          }
        };
      });

      if (sortBy === 'hot') {
        processedPosts = processedPosts.sort((a, b) => {
          const aAge = Date.now() - new Date(a.createdAt).getTime();
          const bAge = Date.now() - new Date(b.createdAt).getTime();
          const aScore = (a.engagement.totalEngagement) / Math.pow(aAge / 3600000 + 2, 1.5);
          const bScore = (b.engagement.totalEngagement) / Math.pow(bAge / 3600000 + 2, 1.5);
          return bScore - aScore;
        });
      } else if (sortBy === 'top') {
        processedPosts = processedPosts.sort((a, b) => 
          b.engagement.totalEngagement - a.engagement.totalEngagement
        );
      }

      return {
        posts: processedPosts,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          currentPage: page,
          perPage: limit
        }
      };
    } catch (error) {
      console.error('Feed fetch error:', error);
      throw new BadRequestError('Failed to fetch feed');
    }
  }
}