"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AchievementController = void 0;
const achievement_service_1 = require("../services/achievement.service");
class AchievementController {
    constructor() {
        this.getUserAchievements = async (req, res, next) => {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!userId) {
                    throw new Error('User not authenticated');
                }
                const achievements = await this.achievementService.getUserAchievements(userId);
                res.json({
                    status: 'success',
                    data: achievements
                });
            }
            catch (error) {
                next(error);
            }
        };
        this.achievementService = new achievement_service_1.AchievementService();
    }
}
exports.AchievementController = AchievementController;
//# sourceMappingURL=achievement.controller.js.map