"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class UserService {
    static async createOrUpdateUser(auth0User) {
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
                    isOnboarded: true
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
            return user;
        }
        catch (error) {
            console.error('Error in createOrUpdateUser:', error);
            throw error;
        }
    }
    static async getUserProfile(auth0Id) {
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
            });
            console.log('Retrieved user profile:', user);
            return user;
        }
        catch (error) {
            console.error('Error in getUserProfile:', error);
            throw error;
        }
    }
    static async updateLastLogin(auth0Id) {
        try {
            await prisma.user.update({
                where: { auth0Id },
                data: {
                    lastLogin: new Date(),
                },
            });
        }
        catch (error) {
            console.error('Error in updateLastLogin:', error);
            throw error;
        }
    }
}
exports.UserService = UserService;
//# sourceMappingURL=user.service.js.map