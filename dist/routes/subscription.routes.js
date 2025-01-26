"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const subscription_controller_1 = require("../controllers/subscription.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
const subscriptionController = new subscription_controller_1.SubscriptionController();
const getPlans = subscriptionController.getPlans;
const createSubscription = subscriptionController.createSubscription;
const cancelSubscription = subscriptionController.cancelSubscription;
const verifyCheckout = subscriptionController.verifyCheckoutSession;
const subscriptionStatus = subscriptionController.getSubscriptionStatus;
router.post("/webhook", express_1.default.raw({ type: "application/json" }), (req, res, next) => {
    subscriptionController.handleWebhook(req, res, next);
});
router.get("/plans", getPlans);
router.use(auth_middleware_1.authenticate);
router.post("/create", createSubscription);
router.post("/cancel", cancelSubscription);
router.post("/verify-session", verifyCheckout);
router.get("/status", subscriptionStatus);
exports.default = router;
//# sourceMappingURL=subscription.routes.js.map