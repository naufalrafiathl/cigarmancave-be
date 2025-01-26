"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const feed_controller_1 = require("../controllers/feed.controller");
const validation_middleware_1 = require("../middleware/validation.middleware");
const auth_middleware_1 = require("../middleware/auth.middleware");
const feed_schema_1 = require("../schemas/feed.schema");
const router = express_1.default.Router();
const feedController = new feed_controller_1.FeedController();
router.use(auth_middleware_1.authenticate);
router.get('/', (0, validation_middleware_1.validateRequest)(feed_schema_1.GetFeedSchema), feedController.getFeed.bind(feedController));
exports.default = router;
//# sourceMappingURL=feed.routes.js.map