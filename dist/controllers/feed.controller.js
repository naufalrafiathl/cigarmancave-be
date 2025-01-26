"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeedController = void 0;
const feed_service_1 = require("../services/feed.service");
class FeedController {
    constructor() {
        this.feedService = new feed_service_1.FeedService();
    }
    async getFeed(req, res, next) {
        try {
            const { page, limit, sortBy, filterBy, startDate, endDate } = req.query;
            const feed = await this.feedService.getFeed({
                page: page ? parseInt(page) : undefined,
                limit: limit ? parseInt(limit) : undefined,
                sortBy: sortBy,
                filterBy: filterBy,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined
            });
            res.json({
                status: 'success',
                data: feed
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.FeedController = FeedController;
//# sourceMappingURL=feed.controller.js.map