"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileController = void 0;
const profile_service_1 = require("../services/profile.service");
const errors_1 = require("../errors");
const achievement_event_1 = require("../services/events/achievement.event");
const achievement_1 = require("../types/achievement");
class ProfileController {
    constructor() {
        this.getProfile = async (req, res, next) => {
            try {
                if (!req.user) {
                    throw new errors_1.UnauthorizedError();
                }
                const profileService = new profile_service_1.ProfileService(req.user);
                const profile = await profileService.getProfile();
                achievement_event_1.achievementEvents.emitAchievementEvent({
                    userId: req.user.id,
                    type: achievement_1.AchievementEventType.PROFILE_UPDATED,
                });
                achievement_event_1.achievementEvents.emitAchievementEvent({
                    userId: req.user.id,
                    type: achievement_1.AchievementEventType.USER_REGISTERED,
                });
                res.json({
                    status: "success",
                    data: profile,
                });
            }
            catch (error) {
                next(error);
            }
        };
        this.updateProfile = async (req, res, next) => {
            try {
                if (!req.user) {
                    throw new errors_1.UnauthorizedError();
                }
                const updateData = {
                    fullName: req.body.fullName,
                    location: req.body.location,
                    phoneNumber: req.body.phoneNumber,
                    badgeDisplayPreference: req.body.badgeDisplayPreference,
                };
                const profileService = new profile_service_1.ProfileService(req.user);
                const updatedProfile = await profileService.updateProfile(updateData);
                achievement_event_1.achievementEvents.emitAchievementEvent({
                    userId: req.user.id,
                    type: achievement_1.AchievementEventType.PROFILE_UPDATED,
                });
                achievement_event_1.achievementEvents.emitAchievementEvent({
                    userId: req.user.id,
                    type: achievement_1.AchievementEventType.USER_REGISTERED,
                });
                console.log("MASUK SINIIII");
                res.json({
                    status: "success",
                    data: updatedProfile,
                });
            }
            catch (error) {
                next(error);
            }
        };
        this.uploadProfileImage = async (req, res, next) => {
            try {
                if (!req.user) {
                    throw new errors_1.UnauthorizedError();
                }
                if (!req.file) {
                    throw new errors_1.BadRequestError("No image file provided");
                }
                const profileService = new profile_service_1.ProfileService(req.user);
                const uploadResult = await profileService.uploadProfileImage(req.file, {
                    width: req.body.width ? parseInt(req.body.width) : undefined,
                    height: req.body.height ? parseInt(req.body.height) : undefined,
                    quality: req.body.quality ? parseInt(req.body.quality) : undefined,
                });
                res.status(201).json({
                    status: "success",
                    data: uploadResult,
                });
            }
            catch (error) {
                next(error);
            }
        };
        this.deleteProfileImage = async (req, res, next) => {
            try {
                if (!req.user) {
                    throw new errors_1.UnauthorizedError();
                }
                const profileService = new profile_service_1.ProfileService(req.user);
                await profileService.deleteProfileImage();
                res.status(204).send();
            }
            catch (error) {
                next(error);
            }
        };
    }
    async updateBadgePreferences(req, res, next) {
        try {
            if (!req.user) {
                throw new errors_1.UnauthorizedError();
            }
            const profileService = new profile_service_1.ProfileService(req.user);
            const updatedPreferences = await profileService.updateBadgePreferences(req.body);
            res.json({
                status: 'success',
                data: updatedPreferences
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getDisplayedAchievements(req, res, next) {
        try {
            if (!req.user) {
                throw new errors_1.UnauthorizedError();
            }
            const profileService = new profile_service_1.ProfileService(req.user);
            const achievements = await profileService.getDisplayedAchievements();
            res.json({
                status: 'success',
                data: achievements
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ProfileController = ProfileController;
//# sourceMappingURL=profile.controller.js.map