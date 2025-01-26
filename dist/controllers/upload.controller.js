"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadController = void 0;
const multer_1 = __importDefault(require("multer"));
const image_service_1 = require("../services/image.service");
const errors_1 = require("../errors");
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
    fileFilter: (_req, file, cb) => {
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
        }
    },
});
class UploadController {
    constructor() {
        this.uploadMiddleware = upload.single('image');
        this.uploadImage = async (req, res, next) => {
            try {
                if (!req.file) {
                    throw new errors_1.BadRequestError('No image file provided');
                }
                const folder = req.body.folder || 'uploads';
                const generateVariants = req.body.generateVariants === 'true';
                const options = {
                    width: req.body.width ? parseInt(req.body.width) : undefined,
                    height: req.body.height ? parseInt(req.body.height) : undefined,
                    quality: req.body.quality ? parseInt(req.body.quality) : undefined,
                    generateVariants,
                };
                const urls = await this.imageService.uploadImage(req.file, folder, options);
                res.status(201).json({
                    status: 'success',
                    data: urls,
                });
            }
            catch (error) {
                next(error);
            }
        };
        this.getSignedUrl = async (req, res, next) => {
            try {
                const { fileName, contentType, folder } = req.body;
                if (!fileName || !contentType) {
                    throw new errors_1.BadRequestError('fileName and contentType are required');
                }
                const signedUrl = await this.imageService.getSignedUploadUrl(fileName, folder, contentType);
                res.json({
                    status: 'success',
                    data: { signedUrl },
                });
            }
            catch (error) {
                next(error);
            }
        };
        this.imageService = new image_service_1.ImageService();
    }
}
exports.UploadController = UploadController;
//# sourceMappingURL=upload.controller.js.map