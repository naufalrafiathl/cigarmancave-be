"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const achievement_controller_1 = require("../controllers/achievement.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
const achievementController = new achievement_controller_1.AchievementController();
router.use(auth_middleware_1.authenticate);
router.get('/', achievementController.getUserAchievements);
exports.default = router;
//# sourceMappingURL=achievement.routes.js.map