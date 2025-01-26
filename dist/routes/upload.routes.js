"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const upload_controller_1 = require("../controllers/upload.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
const uploadController = new upload_controller_1.UploadController();
router.use(auth_middleware_1.authenticate);
router.post('/image', uploadController.uploadMiddleware, uploadController.uploadImage);
router.post('/signed-url', uploadController.getSignedUrl);
exports.default = router;
//# sourceMappingURL=upload.routes.js.map