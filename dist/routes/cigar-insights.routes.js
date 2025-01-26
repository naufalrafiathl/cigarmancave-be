"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cigar_insights_controller_1 = require("../controllers/cigar-insights.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
const cigarInsightsController = new cigar_insights_controller_1.CigarInsightsController();
router.use(auth_middleware_1.authenticate);
router.get('/:cigarId/insights', cigarInsightsController.getInsights);
exports.default = router;
//# sourceMappingURL=cigar-insights.routes.js.map