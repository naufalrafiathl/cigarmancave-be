import { PrismaClient } from '@prisma/client';
import { Auth0User, UserProfile } from '../types/auth.types';

const prisma = new PrismaClient();

export class UserService {
  static async createOrUpdateUser(auth0User: Auth0User): Promise<UserProfile> {
    console.log('USER SERVICE RECEIVED DATA:', JSON.stringify(auth0User, null, 2));
    
    try {
      const upsertData = {
        where: { auth0Id: auth0User.sub },
        update: {
          email: auth0User.email,
          emailVerified: auth0User.email_verified,
          fullName: auth0User.name,
          profileImageUrl: auth0User.picture,
          lastLogin: new Date(),
        },
        create: {
          auth0Id: auth0User.sub,
          email: auth0User.email,
          emailVerified: auth0User.email_verified,
          fullName: auth0User.name,
          profileImageUrl: auth0User.picture,
          badgeDisplayPreference: {},
          isPremium: false,
          lastLogin: new Date(),
        },
      };

      console.log('UPSERTING WITH DATA:', JSON.stringify(upsertData, null, 2));
      const user = await prisma.user.upsert(upsertData);
      console.log('UPSERT RESULT:', JSON.stringify(user, null, 2));

      return user as UserProfile;
    } catch (error) {
      console.error('Error in createOrUpdateUser:', error);
      throw error;
    }
  }

  static async getUserProfile(auth0Id: string): Promise<UserProfile | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { auth0Id },
        select: {
          id: true,
          email: true,
          auth0Id: true,
          emailVerified: true,
          fullName: true,
          profileImageUrl: true,
          isPremium: true,
          locale: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
        },
      }) as UserProfile | null;
      
      console.log('Retrieved user profile:', user);
      return user;
    } catch (error) {
      console.error('Error in getUserProfile:', error);
      throw error;
    }
  }

  static async updateLastLogin(auth0Id: string): Promise<void> {
    try {
      await prisma.user.update({
        where: { auth0Id },
        data: {
          lastLogin: new Date(),
        },
      });
    } catch (error) {
      console.error('Error in updateLastLogin:', error);
      throw error;
    }
  }
}