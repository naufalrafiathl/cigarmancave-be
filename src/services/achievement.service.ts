// src/services/achievement.service.ts
import { PrismaClient } from '@prisma/client';
import { RuleContext, AchievementEvent } from 'src/types/achievement';
import { achievementRules } from './achievement.rules';

achievementRules
export class AchievementService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }


  async processAchievementEvent(event: AchievementEvent): Promise<void> {
    try {
      console.log('Processing achievement event:', event);
  
      const user = await this.prisma.user.findUnique({
        where: { id: event.userId },
        include: {
          _count: {
            select: {
              reviews: true,
              humidors: true
            }
          },
          achievements: {
            include: {
              achievement: true
            }
          }
        }
      });
  
      console.log('Found user:', user?.id);
      if (!user) return;
  
      const context: RuleContext = { user, event };
      
      const applicableRules = achievementRules.filter(rule => 
        rule.triggerEvents.includes(event.type)
      );
  
      console.log('Applicable rules:', applicableRules.map(r => r.name));
  
      for (const rule of applicableRules) {
        const alreadyEarned = user.achievements.some(ua => 
          ua.achievementId === rule.id
        );
        console.log(`Rule ${rule.name} already earned:`, alreadyEarned);
        if (alreadyEarned) continue;
  
        const isEligible = await rule.check(context);
        console.log(`Rule ${rule.name} eligibility:`, isEligible);
        if (isEligible) {
          await this.awardAchievement(user.id, rule.id);
        }
      }
    } catch (error) {
      console.error('Error processing achievement event:', error);
    }
  }

  async awardAchievement(userId: number, achievementId: number): Promise<void> {
    try {
      await this.prisma.userAchievement.create({
        data: {
          userId,
          achievementId
        }
      });

      // Here you could also emit a notification or WebSocket event
      // to inform the user about their new achievement
    } catch (error) {
      console.error('Error awarding achievement:', error);
    }
  }

  async getUserAchievements(userId: number) {
    const userWithAchievements = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        achievements: {
          include: {
            achievement: true
          }
        }
      }
    });

    if (!userWithAchievements) {
      throw new Error('User not found');
    }

    // Get all achievements for availability check
    const allAchievements = await this.prisma.achievement.findMany();

    return {
      earned: userWithAchievements.achievements.map(ua => ({
        ...ua.achievement,
        earnedAt: ua.earnedAt
      })),
      available: allAchievements.filter(achievement => 
        !userWithAchievements.achievements.some(ua => 
          ua.achievementId === achievement.id
        )
      )
    };
  }
}