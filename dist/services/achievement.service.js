"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AchievementService = void 0;
const client_1 = require("@prisma/client");
const achievement_rules_1 = require("./achievement.rules");
achievement_rules_1.achievementRules;
class AchievementService {
    constructor() {
        this.prisma = new client_1.PrismaClient();
    }
    async processAchievementEvent(event) {
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
            console.log('Found user:', user === null || user === void 0 ? void 0 : user.id);
            if (!user)
                return;
            const context = { user, event };
            const applicableRules = achievement_rules_1.achievementRules.filter(rule => rule.triggerEvents.includes(event.type));
            console.log('Applicable rules:', applicableRules.map(r => r.name));
            for (const rule of applicableRules) {
                const alreadyEarned = user.achievements.some(ua => ua.achievementId === rule.id);
                console.log(`Rule ${rule.name} already earned:`, alreadyEarned);
                if (alreadyEarned)
                    continue;
                const isEligible = await rule.check(context);
                console.log(`Rule ${rule.name} eligibility:`, isEligible);
                if (isEligible) {
                    await this.awardAchievement(user.id, rule.id);
                }
            }
        }
        catch (error) {
            console.error('Error processing achievement event:', error);
        }
    }
    async awardAchievement(userId, achievementId) {
        try {
            await this.prisma.userAchievement.create({
                data: {
                    userId,
                    achievementId
                }
            });
        }
        catch (error) {
            console.error('Error awarding achievement:', error);
        }
    }
    async getUserAchievements(userId) {
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
        const allAchievements = await this.prisma.achievement.findMany();
        return {
            earned: userWithAchievements.achievements.map(ua => (Object.assign(Object.assign({}, ua.achievement), { earnedAt: ua.earnedAt }))),
            available: allAchievements.filter(achievement => !userWithAchievements.achievements.some(ua => ua.achievementId === achievement.id))
        };
    }
}
exports.AchievementService = AchievementService;
//# sourceMappingURL=achievement.service.js.map