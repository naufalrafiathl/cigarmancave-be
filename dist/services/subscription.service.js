"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionService = void 0;
const client_1 = require("@prisma/client");
const stripe_1 = __importDefault(require("stripe"));
const subscription_1 = require("../types/subscription");
const errors_1 = require("../errors");
class SubscriptionService {
    constructor() {
        this.stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
            apiVersion: '2024-12-18.acacia'
        });
        this.prisma = new client_1.PrismaClient();
    }
    async createCustomer(userId, email) {
        const customer = await this.stripe.customers.create({
            email,
            metadata: {
                userId: userId.toString()
            }
        });
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                stripeCustomerId: customer.id
            }
        });
        return customer.id;
    }
    async createSubscription(userId, priceId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            throw new errors_1.NotFoundError('User not found');
        }
        let { stripeCustomerId } = user;
        if (!stripeCustomerId) {
            stripeCustomerId = await this.createCustomer(userId, user.email);
        }
        const session = await this.stripe.checkout.sessions.create({
            mode: 'subscription',
            client_reference_id: userId.toString(),
            customer: stripeCustomerId,
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${process.env.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/subscription`,
            payment_method_collection: 'always',
            subscription_data: {
                metadata: {
                    userId: userId.toString()
                }
            }
        });
        return session;
    }
    async cancelSubscription(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId }
        });
        if (!(user === null || user === void 0 ? void 0 : user.subscriptionId)) {
            throw new errors_1.NotFoundError('No active subscription found');
        }
        await this.stripe.subscriptions.update(user.subscriptionId, {
            cancel_at_period_end: true
        });
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                subscriptionStatus: subscription_1.SubscriptionStatus.CANCELING
            }
        });
    }
    async handleWebhook(event) {
        console.log('Processing webhook event:', event.type);
        try {
            switch (event.type) {
                case 'checkout.session.completed':
                    const session = event.data.object;
                    await this.handleCheckoutSessionCompleted(session);
                    break;
                case 'customer.subscription.updated':
                case 'customer.subscription.created':
                    const subscription = event.data.object;
                    await this.handleSubscriptionUpdate(subscription);
                    break;
                case 'customer.subscription.deleted':
                    const deletedSubscription = event.data.object;
                    await this.handleSubscriptionCanceled(deletedSubscription);
                    break;
                case 'invoice.payment_succeeded':
                    const invoice = event.data.object;
                    await this.handlePaymentSucceeded(invoice);
                    break;
                case 'invoice.payment_failed':
                    const failedInvoice = event.data.object;
                    await this.handlePaymentFailed(failedInvoice);
                    break;
            }
        }
        catch (error) {
            console.error('Error processing webhook:', error);
            throw error;
        }
    }
    async handleCheckoutSessionCompleted(session) {
        try {
            if (!session.subscription)
                return;
            const subscription = await this.stripe.subscriptions.retrieve(session.subscription);
            const userId = parseInt(session.client_reference_id || '0');
            await this.prisma.user.update({
                where: { id: userId },
                data: {
                    subscriptionId: subscription.id,
                    subscriptionStatus: subscription.status,
                    isPremium: true,
                    subscriptionCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
                    subscriptionPriceId: subscription.items.data[0].price.id
                }
            });
            console.log(`Subscription activated for user ${userId}`);
        }
        catch (error) {
            console.error('Error handling checkout session completion:', error);
            throw error;
        }
    }
    async handleSubscriptionUpdate(subscription) {
        try {
            console.log('ini datasubs', subscription);
            const userId = parseInt(subscription.metadata.userId);
            const isEnding = subscription.cancel_at_period_end;
            await this.prisma.user.update({
                where: { id: userId },
                data: {
                    subscriptionStatus: isEnding ? subscription_1.SubscriptionStatus.CANCELING : subscription.status,
                    subscriptionPriceId: subscription.items.data[0].price.id,
                    subscriptionCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
                    isPremium: subscription.status === 'active'
                }
            });
            console.log(`Subscription updated for user ${userId}, status: ${subscription.status}`);
        }
        catch (error) {
            console.error('Error handling subscription update:', error);
            throw error;
        }
    }
    async handleSubscriptionCanceled(subscription) {
        try {
            console.log('ini datasubs', subscription);
            const userId = parseInt(subscription.metadata.userId);
            await this.prisma.user.update({
                where: { id: userId },
                data: {
                    isPremium: false,
                    subscriptionId: null,
                    subscriptionStatus: subscription_1.SubscriptionStatus.CANCELED,
                    subscriptionPriceId: null,
                    subscriptionCurrentPeriodEnd: null
                }
            });
            console.log(`Subscription canceled for user ${userId}`);
        }
        catch (error) {
            console.error('Error handling subscription cancellation:', error);
            throw error;
        }
    }
    async handlePaymentSucceeded(invoice) {
        if (invoice.subscription) {
            const subscription = await this.stripe.subscriptions.retrieve(invoice.subscription);
            const userId = parseInt(subscription.metadata.userId);
            await this.prisma.user.update({
                where: { id: userId },
                data: {
                    isPremium: true,
                    subscriptionStatus: subscription_1.SubscriptionStatus.ACTIVE
                }
            });
        }
    }
    async handlePaymentFailed(invoice) {
        if (invoice.subscription) {
            const subscription = await this.stripe.subscriptions.retrieve(invoice.subscription);
            const userId = parseInt(subscription.metadata.userId);
            await this.prisma.user.update({
                where: { id: userId },
                data: {
                    isPremium: false,
                    subscriptionStatus: subscription_1.SubscriptionStatus.PAST_DUE
                }
            });
        }
    }
    async getSubscriptionPlans() {
        const prices = await this.stripe.prices.list({
            active: true,
            expand: ['data.product']
        });
        return prices.data.map(price => {
            var _a, _b;
            return ({
                id: price.id,
                name: price.product.name,
                description: price.product.description || '',
                price: price.unit_amount / 100,
                interval: ((_a = price.recurring) === null || _a === void 0 ? void 0 : _a.interval) || 'month',
                features: ((_b = price.product.metadata.features) === null || _b === void 0 ? void 0 : _b.split(',')) || []
            });
        });
    }
    async verifyCheckoutSession(sessionId, userId) {
        try {
            const session = await this.stripe.checkout.sessions.retrieve(sessionId);
            if (session.client_reference_id !== userId.toString()) {
                console.error('Session user mismatch', {
                    sessionUserId: session.client_reference_id,
                    requestUserId: userId
                });
                return false;
            }
            if (session.payment_status !== 'paid') {
                console.error('Session not fully paid', {
                    paymentStatus: session.payment_status
                });
                return false;
            }
            const subscription = await this.stripe.subscriptions.retrieve(session.subscription);
            await this.prisma.user.update({
                where: { id: userId },
                data: {
                    subscriptionId: subscription.id,
                    subscriptionStatus: subscription.status,
                    isPremium: true,
                    subscriptionCurrentPeriodEnd: new Date(subscription.current_period_end * 1000)
                }
            });
            console.log(`Subscription verified for user ${userId}`, {
                subscriptionId: subscription.id,
                status: subscription.status
            });
            return true;
        }
        catch (error) {
            console.error('Checkout session verification error:', error);
            if (error instanceof Error) {
                console.error('Error details:', {
                    message: error.message,
                    stack: error.stack
                });
            }
            return false;
        }
    }
    async getSubscriptionStatus(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                subscriptionId: true,
                subscriptionStatus: true,
                isPremium: true,
                subscriptionCurrentPeriodEnd: true
            }
        });
        if (!user) {
            throw new errors_1.NotFoundError('User not found');
        }
        if (!user.subscriptionId) {
            return {
                hasSubscription: false,
                isPremium: false,
                status: null,
                currentPeriodEnd: null
            };
        }
        let stripeSubscription = null;
        try {
            if (user.subscriptionId) {
                stripeSubscription = await this.stripe.subscriptions.retrieve(user.subscriptionId);
            }
        }
        catch (error) {
            console.error('Error retrieving Stripe subscription:', error);
        }
        return {
            hasSubscription: !!user.subscriptionId,
            isPremium: user.isPremium,
            status: user.subscriptionStatus,
            currentPeriodEnd: user.subscriptionCurrentPeriodEnd,
            stripeStatus: stripeSubscription === null || stripeSubscription === void 0 ? void 0 : stripeSubscription.status
        };
    }
}
exports.SubscriptionService = SubscriptionService;
//# sourceMappingURL=subscription.service.js.map