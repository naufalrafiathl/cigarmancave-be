"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const profile_controller_1 = require("../controllers/profile.controller");
const validation_middleware_1 = require("../middleware/validation.middleware");
const auth_middleware_1 = require("../middleware/auth.middleware");
const multer_1 = __importDefault(require("multer"));
const errors_1 = require("../errors");
const profile_schema_1 = require("../schemas/profile.schema");
const handleAsync = (fn) => {
    return async (req, res, next) => {
        try {
            return await fn(req, res, next);
        }
        catch (error) {
            next(error);
            return Promise.resolve();
        }
    };
};
const handleFileAsync = (fn) => {
    return async (req, res, next) => {
        try {
            return await fn(req, res, next);
        }
        catch (error) {
            next(error);
            return Promise.resolve();
        }
    };
};
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
    fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith("image/")) {
            return cb(new errors_1.BadRequestError("Only image files are allowed"));
        }
        const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
        if (!allowedTypes.includes(file.mimetype)) {
            return cb(new errors_1.BadRequestError("Only JPEG, PNG, and WebP images are allowed"));
        }
        cb(null, true);
    },
});
const handleFileUpload = (req, res, next) => {
    return new Promise((resolve) => {
        upload.single("image")(req, res, (err) => {
            if (err instanceof multer_1.default.MulterError) {
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
            }
            else if (err) {
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
const router = express_1.default.Router();
const controller = new profile_controller_1.ProfileController();
router.use(auth_middleware_1.authenticate);
router
    .route("/")
    .get(handleAsync(controller.getProfile))
    .put((0, validation_middleware_1.validateRequest)(profile_schema_1.UpdateProfileSchema), handleAsync(controller.updateProfile));
router
    .route("/image")
    .post(handleFileUpload, (0, validation_middleware_1.validateRequest)(profile_schema_1.ImageUploadSchema), handleFileAsync(controller.uploadProfileImage))
    .delete(handleAsync(controller.deleteProfileImage));
router.put("/badges", (0, validation_middleware_1.validateRequest)(profile_schema_1.UpdateBadgePreferencesSchema), handleAsync(controller.updateBadgePreferences));
router.get("/badges", handleAsync(controller.getDisplayedAchievements));
exports.default = router;
//# sourceMappingURL=profile.routes.js.map