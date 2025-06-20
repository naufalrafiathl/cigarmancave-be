import { PrismaClient } from '@prisma/client';
import { ImageService } from './image.service';
import { NotFoundError, ValidationError, BadRequestError } from '../errors';

const prisma = new PrismaClient();

interface UpdateProfileData {
  fullName?: string;
  location?: string;
  profileImageUrl?: string;
  badgeDisplayPreference?: Record<string, any>;
  phoneNumber?: string;
}

interface ProfileUploadOptions {
  width?: number;
  height?: number;
  quality?: number;
}

export class ProfileService {
  private imageService: ImageService;
  private user: { id: number };

  constructor(user: { id: number }) {
    this.imageService = new ImageService();
    this.user = user;
  }

  async updateBadgePreferences(preferences: {
    achievementIds: number[]; 
    displayOrder?: boolean;   
  }) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: this.user.id },
        include: {
          achievements: {
            include: {
              achievement: true
            }
          }
        }
      });
  
      if (!user) {
        throw new NotFoundError('User not found');
      }
  
      const earnedAchievementIds = user.achievements.map(ua => ua.achievementId);
      const invalidAchievements = preferences.achievementIds.filter(
        id => !earnedAchievementIds.includes(id)
      );
  
      if (invalidAchievements.length > 0) {
        throw new ValidationError('Some achievements have not been earned yet');
      }
  
      const updatedUser = await prisma.user.update({
        where: { id: this.user.id },
        data: {
          badgeDisplayPreference: {
            displayedAchievements: preferences.achievementIds,
            displayOrder: preferences.displayOrder ?? true
          }
        }
      });
  
      return updatedUser.badgeDisplayPreference;
    } catch (error) {
      throw new BadRequestError('Failed to update badge preferences');
    }
  }
  
  async getDisplayedAchievements() {
    const user = await prisma.user.findUnique({
      where: { id: this.user.id },
      include: {
        achievements: {
          include: {
            achievement: true
          }
        }
      }
    });
  
    if (!user) {
      throw new NotFoundError('User not found');
    }
  
    const preferences = user.badgeDisplayPreference as {
      displayedAchievements: number[];
      displayOrder: boolean;
    } | null;
  
    if (!preferences?.displayedAchievements?.length) {
      return [];
    }
  
    const achievementMap = new Map(
      user.achievements.map(ua => [ua.achievementId, ua])
    );
  
    return preferences.displayedAchievements
      .map(id => {
        const userAchievement = achievementMap.get(id);
        if (!userAchievement) return null;
        return {
          ...userAchievement.achievement,
          earnedAt: userAchievement.earnedAt
        };
      })
      .filter(Boolean);
  }

  async getProfile() {
    const user = await prisma.user.findUnique({
      where: { id: this.user.id },
      select: {
        id: true,
        fullName: true,
        email: true,
        location: true,
        profileImageUrl: true,
        isPremium: true,
        isOnboarded: true,
        badgeDisplayPreference: true,
        phoneNumber: true,
        createdAt: true,
        _count: {
          select: {
            reviews: true,
            humidors: true,
            followedBy: true,
            following: true
          }
        },
        achievements: {
          include: {
            achievement: true
          }
        }
      }
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  async updateProfile(data: UpdateProfileData) {
    console.log("TEST MASUK")
    if (data.fullName && (data.fullName.length < 2 || data.fullName.length > 50)) {
      throw new ValidationError('Full name must be between 2 and 50 characters');
    }

    if (data.location && data.location.length > 100) {
      throw new ValidationError('Location must not exceed 100 characters');
    }

    if (data.phoneNumber) {
      const phoneRegex = /^\+?[\d\s-]{8,20}$/;
      if (!phoneRegex.test(data.phoneNumber)) {
        throw new ValidationError('Invalid phone number format');
      }
    }

    try {
      const updatedUser = await prisma.user.update({
        where: { id: this.user.id },
        data: {
          fullName: data.fullName,
          location: data.location,
          profileImageUrl: data.profileImageUrl,
          badgeDisplayPreference: data.badgeDisplayPreference,
          phoneNumber: data.phoneNumber,
          isOnboarded: true,
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          location: true,
          profileImageUrl: true,
          isPremium: true,
          badgeDisplayPreference: true,
          phoneNumber: true,
          createdAt: true,
          isOnboarded: true 
        }
      });

      return updatedUser;
    } catch (error) {
      throw new BadRequestError('Failed to update profile');
    }
  }

  async uploadProfileImage(file: Express.Multer.File, options: ProfileUploadOptions = {}) {
    try {
      const uploadResult = await this.imageService.uploadImage(file, 'profiles', {
        width: options.width || 400,
        height: options.height || 400,
        quality: options.quality || 85,
        generateVariants: true
      });

      const updatedUser = await prisma.user.update({
        where: { id: this.user.id },
        data: {
          profileImageUrl: uploadResult.medium || uploadResult.original,
          isOnboarded: true
        }
      });

      return {
        profileImageUrl: updatedUser.profileImageUrl,
        variants: uploadResult
      };
    } catch (error) {
      throw new BadRequestError('Failed to upload profile image');
    }
  }

  async deleteProfileImage() {
    try {
      const updatedUser = await prisma.user.update({
        where: { id: this.user.id },
        data: {
          profileImageUrl: null
        }
      });

      return updatedUser;
    } catch (error) {
      throw new BadRequestError('Failed to delete profile image');
    }
  }
}