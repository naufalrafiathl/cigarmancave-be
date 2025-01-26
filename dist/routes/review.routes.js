"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const review_controller_1 = require("../controllers/review.controller");
const validation_middleware_1 = require("../middleware/validation.middleware");
const review_schema_1 = require("../schemas/review.schema");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
const reviewController = new review_controller_1.ReviewController();
router.use(auth_middleware_1.authenticate);
router.post('/', (0, validation_middleware_1.validateRequest)(review_schema_1.CreateReviewSchema), reviewController.createReview);
router.get('/', (0, validation_middleware_1.validateRequest)(review_schema_1.GetReviewsQuerySchema), reviewController.getReviews);
router.get('/:id', reviewController.getReviewById);
exports.default = router;
//# sourceMappingURL=review.routes.js.map