// src/routes/profile.routes.ts
import express, {
  NextFunction,
  Request,
  Response,
  RequestHandler,
} from "express";
import { ProfileController } from "../controllers/profile.controller";
import { validateRequest } from "../middleware/validation.middleware";
import { authenticate } from "../middleware/auth.middleware";
import multer from "multer";
import { BadRequestError } from "../errors";
import {
  UpdateProfileSchema,
  ImageUploadSchema,
  UpdateBadgePreferencesSchema,
} from "../schemas/profile.schema";
import { AuthenticatedRequest, FileUploadRequest } from "../types/auth";

// Type assertion helper
const handleAsync = (
  fn: (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => Promise<void>
): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      return await fn(req as AuthenticatedRequest, res, next);
    } catch (error) {
      next(error);
      return Promise.resolve();
    }
  };
};

const handleFileAsync = (
  fn: (
    req: FileUploadRequest,
    res: Response,
    next: NextFunction
  ) => Promise<void>
): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      return await fn(req as FileUploadRequest, res, next);
    } catch (error) {
      next(error);
      return Promise.resolve();
    }
  };
};

// Configure multer for image uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    // Accept only image files
    if (!file.mimetype.startsWith("image/")) {
      return cb(new BadRequestError("Only image files are allowed"));
    }

    // Check specific image types if needed
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(
        new BadRequestError("Only JPEG, PNG, and WebP images are allowed")
      );
    }

    cb(null, true);
  },
});

// Middleware to handle multer errors
const handleFileUpload = (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  return new Promise((resolve) => {
    upload.single("image")(req, res, (err: any) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          res.status(400).json({
            status: "error",
            message: "File size cannot exceed 5MB",
          });
          return resolve();
        }
        res.status(400).json({
          status: "error",
          message: "File upload error",
          details: err.message,
        });
        return resolve();
      } else if (err) {
        res.status(400).json({
          status: "error",
          message: err.message,
        });
        return resolve();
      }
      next();
      resolve();
    });
  });
};

// Create router and controller
const router = express.Router();
const controller = new ProfileController();

// Apply authentication middleware to all routes
router.use(authenticate);

// Profile Routes
router
  .route("/")
  .get(handleAsync(controller.getProfile))
  .put(
    validateRequest(UpdateProfileSchema),
    handleAsync(controller.updateProfile)
  );

// Profile Image Routes
router
  .route("/image")
  .post(
    handleFileUpload,
    validateRequest(ImageUploadSchema),
    handleFileAsync(controller.uploadProfileImage)
  )
  .delete(handleAsync(controller.deleteProfileImage));

router.put(
  "/badges",
  validateRequest(UpdateBadgePreferencesSchema),
  handleAsync(controller.updateBadgePreferences)
);

router.get("/badges", handleAsync(controller.getDisplayedAchievements));

export default router;
