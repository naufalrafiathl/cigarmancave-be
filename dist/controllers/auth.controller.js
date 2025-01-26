"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const user_service_1 = require("../services/user.service");
const achievement_event_1 = require("../services/events/achievement.event");
const achievement_1 = require("../types/achievement");
class AuthController {
    static async getProfile(req, res) {
        try {
            const auth0User = req.auth;
            console.log('AUTH0 USER DATA:', JSON.stringify(auth0User, null, 2));
            if (!(auth0User === null || auth0User === void 0 ? void 0 : auth0User.sub)) {
                res.status(401).json({ error: 'Invalid token' });
                return;
            }
            let user = await user_service_1.UserService.getUserProfile(auth0User.sub);
            if (!user) {
                res.status(404).json({ error: 'User not found' });
                return;
            }
            await user_service_1.UserService.updateLastLogin(auth0User.sub);
            res.json({ user });
        }
        catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async handleCallback(req, res) {
        try {
            const userInfo = req.body.user;
            const auth0User = req.auth;
            if (!(auth0User === null || auth0User === void 0 ? void 0 : auth0User.sub)) {
                res.status(401).json({ error: 'Invalid token' });
                return;
            }
            const userData = {
                sub: auth0User.sub,
                email: userInfo.email || '',
                email_verified: userInfo.email_verified || false,
                name: userInfo.name || '',
                picture: userInfo.picture || '',
                locale: auth0User.locale
            };
            const user = await user_service_1.UserService.createOrUpdateUser(userData);
            console.log('Emitting USER_REGISTERED event for user:', user.id);
            achievement_event_1.achievementEvents.emitAchievementEvent({
                userId: user.id,
                type: achievement_1.AchievementEventType.USER_REGISTERED
            });
            res.json({ user });
        }
        catch (error) {
            console.error('Auth callback error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=auth.controller.js.map