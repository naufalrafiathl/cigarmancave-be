"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionController = void 0;
const subscription_service_1 = require("../services/subscription.service");
const stripe_1 = __importDefault(require("stripe"));
class SubscriptionController {
    constructor() {
        this.getPlans = async (_req, res, next) => {
            try {
                const plans = await this.subscriptionService.getSubscriptionPlans();
                res.json({
                    status: 'success',
                    data: plans
                });
            }
            catch (error) {
                next(error);
            }
        };
        this.createSubscription = async (req, res, next) => {
            var _a;
            try {
                const { priceId } = req.body;
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!userId) {
                    res.status(401).json({
                        status: 'error',
                        message: 'Unauthorized'
                    });
                    return;
                }
                const checkoutSession = await this.subscriptionService.createSubscription(userId, priceId);
                res.json({
                    status: 'success',
                    data: {
                        checkoutUrl: checkoutSession.url
                    }
                });
            }
            catch (error) {
                next(error);
            }
        };
        this.cancelSubscription = async (req, res, next) => {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!userId) {
                    res.status(401).json({
                        status: 'error',
                        message: 'Unauthorized'
                    });
                    return;
                }
                await this.subscriptionService.cancelSubscription(userId);
                res.json({
                    status: 'success',
                    message: 'Subscription cancelled successfully'
                });
            }
            catch (error) {
                next(error);
            }
        };
        this.handleWebhook = async (req, res, _next) => {
            const sig = req.headers['stripe-signature'];
            try {
                if (!sig) {
                    res.status(400).send('No Stripe signature found');
                    return;
                }
                const event = this.stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
                await this.subscriptionService.handleWebhook(event);
                res.json({ received: true });
            }
            catch (error) {
                console.error('Webhook Error:', error);
                res.status(400).send(`Webhook Error: ${error.message}`);
            }
        };
        this.verifyCheckoutSession = async (req, res, next) => {
            var _a;
            try {
                const { sessionId } = req.body;
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!userId) {
                    res.status(401).json({
                        status: 'error',
                        message: 'Unauthorized'
                    });
                    return;
                }
                const verificationResult = await this.subscriptionService.verifyCheckoutSession(sessionId, userId);
                res.json({
                    status: 'success',
                    data: {
                        verified: verificationResult
                    }
                });
            }
            catch (error) {
                next(error);
            }
        };
        this.getSubscriptionStatus = async (req, res, next) => {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!userId) {
                    res.status(401).json({
                        status: 'error',
                        message: 'Unauthorized'
                    });
                    return;
                }
                const subscriptionStatus = await this.subscriptionService.getSubscriptionStatus(userId);
                res.json({
                    status: 'success',
                    data: subscriptionStatus
                });
            }
            catch (error) {
                next(error);
            }
        };
        this.subscriptionService = new subscription_service_1.SubscriptionService();
        this.stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
            apiVersion: '2024-12-18.acacia'
        });
    }
}
exports.SubscriptionController = SubscriptionController;
//# sourceMappingURL=subscription.controller.js.map