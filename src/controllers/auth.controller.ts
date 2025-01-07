import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { Auth0JwtPayload } from '../config/auth';
import { achievementEvents } from '../services/events/achievement.event';
import { AchievementEventType } from '../types/achievement';

export class AuthController {
  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const auth0User = req.auth as Auth0JwtPayload;
      // Debug log to see the complete token payload
      console.log('AUTH0 USER DATA:', JSON.stringify(auth0User, null, 2));
      
      if (!auth0User?.sub) {
        res.status(401).json({ error: 'Invalid token' });
        return;
      }

      let user = await UserService.getUserProfile(auth0User.sub);

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      
      await UserService.updateLastLogin(auth0User.sub);
      res.json({ user });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async handleCallback(req: Request, res: Response): Promise<void> {
    try {
      const userInfo = req.body.user;
      const auth0User = req.auth as Auth0JwtPayload;
      
      if (!auth0User?.sub) {
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
  
      const user = await UserService.createOrUpdateUser(userData);
  
      console.log('Emitting USER_REGISTERED event for user:', user.id);
      achievementEvents.emitAchievementEvent({
        userId: user.id,
        type: AchievementEventType.USER_REGISTERED
      });
  
      res.json({ user });
    } catch (error) {
      console.error('Auth callback error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}