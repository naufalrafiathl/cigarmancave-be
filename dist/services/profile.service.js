"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileService = void 0;
const client_1 = require("@prisma/client");
const image_service_1 = require("./image.service");
const errors_1 = require("../errors");
const prisma = new client_1.PrismaClient();
class ProfileService {
    constructor(user) {
        this.imageService = new image_service_1.ImageService();
        this.user = user;
    }
    async updateBadgePreferences(preferences) {
        var _a;
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
                throw new errors_1.NotFoundError('User not found');
            }
            const earnedAchievementIds = user.achievements.map(ua => ua.achievementId);
            const invalidAchievements = preferences.achievementIds.filter(id => !earnedAchievementIds.includes(id));
            if (invalidAchievements.length > 0) {
                throw new errors_1.ValidationError('Some achievements have not been earned yet');
            }
            const updatedUser = await prisma.user.update({
                where: { id: this.user.id },
                data: {
                    badgeDisplayPreference: {
                        displayedAchievements: preferences.achievementIds,
                        displayOrder: (_a = preferences.displayOrder) !== null && _a !== void 0 ? _a : true
                    }
                }
            });
            return updatedUser.badgeDisplayPreference;
        }
        catch (error) {
            throw new errors_1.BadRequestError('Failed to update badge preferences');
        }
    }
    async getDisplayedAchievements() {
        var _a;
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
            throw new errors_1.NotFoundError('User not found');
        }
        const preferences = user.badgeDisplayPreference;
        if (!((_a = preferences === null || preferences === void 0 ? void 0 : preferences.displayedAchievements) === null || _a === void 0 ? void 0 : _a.length)) {
            return [];
        }
        const achievementMap = new Map(user.achievements.map(ua => [ua.achievementId, ua]));
        return preferences.displayedAchievements
            .map(id => {
            const userAchievement = achievementMap.get(id);
            if (!userAchievement)
                return null;
            return Object.assign(Object.assign({}, userAchievement.achievement), { earnedAt: userAchievement.earnedAt });
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
            throw new errors_1.NotFoundError('User not found');
        }
        return user;
    }
    async updateProfile(data) {
        console.log("TEST MASUK");
        if (data.fullName && (data.fullName.length < 2 || data.fullName.length > 50)) {
            throw new errors_1.ValidationError('Full name must be between 2 and 50 characters');
        }
        if (data.location && data.location.length > 100) {
            throw new errors_1.ValidationError('Location must not exceed 100 characters');
        }
        if (data.phoneNumber) {
            const phoneRegex = /^\+?[\d\s-]{8,20}$/;
            if (!phoneRegex.test(data.phoneNumber)) {
                throw new errors_1.ValidationError('Invalid phone number format');
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
        }
        catch (error) {
            throw new errors_1.BadRequestError('Failed to update profile');
        }
    }
    async uploadProfileImage(file, options = {}) {
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
        }
        catch (error) {
            throw new errors_1.BadRequestError('Failed to upload profile image');
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
        }
        catch (error) {
            throw new errors_1.BadRequestError('Failed to delete profile image');
        }
    }
}
exports.ProfileService = ProfileService;
//# sourceMappingURL=profile.service.js.map