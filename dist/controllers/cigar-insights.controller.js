"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CigarInsightsController = void 0;
const cigar_insights_service_1 = require("../services/cigar-insights.service");
const errors_1 = require("../errors");
class CigarInsightsController {
    constructor() {
        this.getInsights = async (req, res, next) => {
            var _a;
            try {
                const cigarId = parseInt(req.params.cigarId);
                if (isNaN(cigarId)) {
                    throw new errors_1.BadRequestError('Invalid cigar ID');
                }
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!userId) {
                    throw new errors_1.BadRequestError('User ID is required');
                }
                const insights = await this.cigarInsightsService.getOrCreateInsights(cigarId, userId);
                res.json({
                    status: 'success',
                    data: insights
                });
            }
            catch (error) {
                next(error);
            }
        };
        this.cigarInsightsService = new cigar_insights_service_1.CigarInsightsService();
    }
}
exports.CigarInsightsController = CigarInsightsController;
//# sourceMappingURL=cigar-insights.controller.js.map