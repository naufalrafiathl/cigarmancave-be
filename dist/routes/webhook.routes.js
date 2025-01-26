"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const subscription_controller_1 = require("../controllers/subscription.controller");
const router = express_1.default.Router();
const subscriptionController = new subscription_controller_1.SubscriptionController();
router.post('/stripe', express_1.default.raw({ type: 'application/json' }), subscriptionController.handleWebhook);
exports.default = router;
//# sourceMappingURL=webhook.routes.js.map