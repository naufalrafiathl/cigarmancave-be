import { PrismaClient } from '@prisma/client';
import { NotFoundError, ValidationError, BadRequestError } from '../errors';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { ModerationService, ModerationError } from "./moderation.service";

const prisma = new PrismaClient();

export class ReviewService {
  private moderationService: ModerationService;

  constructor() {
    this.moderationService = new ModerationService();
  }

  private calculateOverallScore(review: any): number {
    const scores = [
      review.constructionScore,
      review.drawScore,
      review.flavorScore,
      review.burnScore,
      review.impressionScore
    ].filter(score => score !== undefined) as number[];

    if (scores.length === 0) return 0;
    return Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2));
  }

  async createReview(userId: number, data: any) {
    await this.moderationService.validateContent({
      text: data.notes
    });

    const cigar = await prisma.cigar.findUnique({
      where: { id: data.cigarId }
    });

    if (!cigar) {
      throw new NotFoundError('Cigar not found');
    }

    return await prisma.$transaction(async (tx) => {
      try {
        const review = await tx.review.create({
          data: {
            userId,
            cigarId: data.cigarId,
            date: new Date(),
            strength: data.strength,
            duration: data.duration,
            constructionScore: data.constructionScore,
            drawScore: data.drawScore,
            flavorScore: data.flavorScore,
            burnScore: data.burnScore,
            impressionScore: data.impressionScore,
            overallScore: this.calculateOverallScore(data),
            FirstThird: data.FirstThird || [],
            SecondThird: data.SecondThird || [],
            FinalThird: data.FinalThird || [],
            flavorPepperScore: data.flavorPepperScore,
            flavorChocolateScore: data.flavorChocolateScore,
            flavorCreamyScore: data.flavorCreamyScore,
            flavorLeatherScore: data.flavorLeatherScore,
            flavorWoodyScore: data.flavorWoodyScore,
            flavorEarthyScore: data.flavorEarthyScore,
            flavorNuttyScore: data.flavorNuttyScore,
            flavorSweetScore: data.flavorSweetScore,
            flavorFruityScore: data.flavorFruityScore,
            flavorGrassyScore: data.flavorGrassyScore,
            flavorBerryScore: data.flavorBerryScore,
            flavorCoffeeScore: data.flavorCoffeeScore,
            flavorBittersScore: data.flavorBittersScore,
            notes: data.notes,
            buyAgain: data.buyAgain
          }
        });

        if (data.images?.length) {
          await tx.reviewImage.createMany({
            data: data.images.map((url: string) => ({
              url,
              reviewId: review.id
            }))
          });
        }

        if (data.pairings?.length) {
          for (const pairing of data.pairings) {
            const pairingRecord = await tx.pairing.upsert({
              where: { 
                name_type: {
                  name: pairing.name,
                  type: pairing.type
                }
              },
              create: {
                name: pairing.name,
                type: pairing.type
              },
              update: {}
            });

            await tx.reviewPairing.create({
              data: {
                reviewId: review.id,
                pairingId: pairingRecord.id,
                notes: pairing.notes
              }
            });
          }
        }

        const completeReview = await tx.review.findUnique({
          where: { id: review.id },
          include: {
            images: true,
            user: {
              select: {
                id: true,
                fullName: true,
                profileImageUrl: true
              }
            },
            cigar: true
          }
        });

        if (!completeReview) {
          throw new NotFoundError('Failed to retrieve created review');
        }

        return completeReview;
      } catch (error) {
        if (error instanceof ModerationError) {
          throw error; 
        }
        if (error instanceof PrismaClientKnownRequestError) {
          throw new BadRequestError(`Database error: ${error.message}`);
        }
        throw error; 
      }
    });
  }

  async getReviewById(id: number) {
    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        images: true,
        pairings: {
          include: {
            pairing: true
          }
        }
      }
    });

    if (!review) {
      throw new NotFoundError('Review not found');
    }

    return review;
  }

  async getReviews(options: {
    userId: number;
    cigarId?: number;
    page?: number;
    limit?: number;
  }) {
    const { userId, cigarId, page = 1, limit = 10 } = options;
    
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    if (page < 1 || limit < 1) {
      throw new ValidationError('Invalid pagination parameters');
    }
  
    const skip = (page - 1) * limit;
    const where = {
      userId,
      ...(cigarId && { cigarId })
    };
  
    try {
      const [reviews, total] = await Promise.all([
        prisma.review.findMany({
          where,
          include: {
            images: true,
            cigar: {
              include: {
                brand: true
              }
            },
            user: {
              select: {
                id: true,
                fullName: true,
                profileImageUrl: true
              }
            },
            pairings: {
              include: {
                pairing: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.review.count({ where })
      ]);
  
      const transformedReviews = reviews.map(review => ({
        ...review,
        cigar: {
          id: review.cigar.id,
          name: review.cigar.name,
          brand: review.cigar.brand.name
        }
      }));
  
      return {
        reviews: transformedReviews,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          currentPage: page,
          perPage: limit
        }
      };
    } catch (error) {
      console.error('Error fetching reviews:', error);
      throw new BadRequestError('Failed to fetch reviews');
    }
  }
}