"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const import_controller_1 = require("../controllers/import.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
const importController = new import_controller_1.ImportController();
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
router.use(auth_middleware_1.authenticate);
router.get('/quota', asyncHandler(importController.getQuota));
router.post('/process', importController.uploadMiddleware, asyncHandler(importController.processImport));
router.post('/confirm', asyncHandler(importController.confirmImport));
exports.default = router;
//# sourceMappingURL=import.routes.js.map