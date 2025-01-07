// src/controllers/profile.controller.ts
import { Response, NextFunction } from "express";
import { ProfileService } from "../services/profile.service";
import { UnauthorizedError, BadRequestError } from "../errors";
import { AuthenticatedRequest, FileUploadRequest } from "../types/auth";
import { achievementEvents } from "../services/events/achievement.event";
import { AchievementEventType } from "../types/achievement";

export class ProfileController {
  getProfile = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const profileService = new ProfileService(req.user);
      const profile = await profileService.getProfile();
      achievementEvents.emitAchievementEvent({
        userId: req.user.id,
        type: AchievementEventType.PROFILE_UPDATED,
      });

      achievementEvents.emitAchievementEvent({
        userId: req.user.id,
        type: AchievementEventType.USER_REGISTERED,
      });

      res.json({
        status: "success",
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const updateData = {
        fullName: req.body.fullName,
        location: req.body.location,
        phoneNumber: req.body.phoneNumber,
        badgeDisplayPreference: req.body.badgeDisplayPreference,
      };

      const profileService = new ProfileService(req.user);
      const updatedProfile = await profileService.updateProfile(updateData);
      // Add achievement event for new user registration
      achievementEvents.emitAchievementEvent({
        userId: req.user.id,
        type: AchievementEventType.PROFILE_UPDATED,
      });

      achievementEvents.emitAchievementEvent({
        userId: req.user.id,
        type: AchievementEventType.USER_REGISTERED,
      });

      console.log("MASUK SINIIII")

      res.json({
        status: "success",
        data: updatedProfile,
      });
    } catch (error) {
      next(error);
    }
  };

  uploadProfileImage = async (
    req: FileUploadRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      if (!req.file) {
        throw new BadRequestError("No image file provided");
      }

      const profileService = new ProfileService(req.user);
      const uploadResult = await profileService.uploadProfileImage(req.file, {
        width: req.body.width ? parseInt(req.body.width) : undefined,
        height: req.body.height ? parseInt(req.body.height) : undefined,
        quality: req.body.quality ? parseInt(req.body.quality) : undefined,
      });

      res.status(201).json({
        status: "success",
        data: uploadResult,
      });
    } catch (error) {
      next(error);
    }
  };

// src/controllers/profile.controller.ts
async updateBadgePreferences(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const profileService = new ProfileService(req.user);
    const updatedPreferences = await profileService.updateBadgePreferences(req.body);
    
    res.json({
      status: 'success',
      data: updatedPreferences
    });
  } catch (error) {
    next(error);
  }
}

async getDisplayedAchievements(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const profileService = new ProfileService(req.user);
    const achievements = await profileService.getDisplayedAchievements();
    
    res.json({
      status: 'success',
      data: achievements
    });
  } catch (error) {
    next(error);
  }
}

  deleteProfileImage = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const profileService = new ProfileService(req.user);
      await profileService.deleteProfileImage();

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}
