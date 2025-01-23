import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import { SubscriptionPlan, SubscriptionStatus } from '../types/subscription';
import { NotFoundError } from '../errors';

export class SubscriptionService {
  private stripe: Stripe;
  private prisma: PrismaClient;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2024-12-18.acacia'
    });
    this.prisma = new PrismaClient();
  }

  async createCustomer(userId: number, email: string): Promise<string> {
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

  async createSubscription(userId: number, priceId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });
  
    if (!user) {
      throw new NotFoundError('User not found');
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

  async cancelSubscription(userId: number): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user?.subscriptionId) {
      throw new NotFoundError('No active subscription found');
    }

    await this.stripe.subscriptions.update(user.subscriptionId, {
      cancel_at_period_end: true
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: SubscriptionStatus.CANCELING
      }
    });
  }

  async handleWebhook(event: Stripe.Event): Promise<void> {
    console.log('Processing webhook event:', event.type);
    
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          const session = event.data.object as Stripe.Checkout.Session;
          await this.handleCheckoutSessionCompleted(session);
          break;

        case 'customer.subscription.updated':
        case 'customer.subscription.created':
          const subscription = event.data.object as Stripe.Subscription;
          await this.handleSubscriptionUpdate(subscription);
          break;

        case 'customer.subscription.deleted':
          const deletedSubscription = event.data.object as Stripe.Subscription;
          await this.handleSubscriptionCanceled(deletedSubscription);
          break;

        case 'invoice.payment_succeeded':
          const invoice = event.data.object as Stripe.Invoice;
          await this.handlePaymentSucceeded(invoice);
          break;

        case 'invoice.payment_failed':
          const failedInvoice = event.data.object as Stripe.Invoice;
          await this.handlePaymentFailed(failedInvoice);
          break;
      }
    } catch (error) {
      console.error('Error processing webhook:', error);
      throw error;
    }
  }

  private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
    try {
      if (!session.subscription) return;

      const subscription = await this.stripe.subscriptions.retrieve(session.subscription as string);
      const userId = parseInt(session.client_reference_id || '0');

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionId: subscription.id,
          subscriptionStatus: subscription.status as SubscriptionStatus,
          isPremium: true,
          subscriptionCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
          subscriptionPriceId: subscription.items.data[0].price.id
        }
      });

      console.log(`Subscription activated for user ${userId}`);
    } catch (error) {
      console.error('Error handling checkout session completion:', error);
      throw error;
    }
  }

  private async handleSubscriptionUpdate(subscription: Stripe.Subscription): Promise<void> {
    try {
      console.log('ini datasubs',subscription)
      const userId = parseInt(subscription.metadata.userId);
      const isEnding = subscription.cancel_at_period_end;

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionStatus: isEnding ? SubscriptionStatus.CANCELING : subscription.status as SubscriptionStatus,
          subscriptionPriceId: subscription.items.data[0].price.id,
          subscriptionCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
          isPremium: subscription.status === 'active'
        }
      });

      console.log(`Subscription updated for user ${userId}, status: ${subscription.status}`);
    } catch (error) {
      console.error('Error handling subscription update:', error);
      throw error;
    }
  }

  private async handleSubscriptionCanceled(subscription: Stripe.Subscription): Promise<void> {
    
    try {
      console.log('ini datasubs',subscription)

      const userId = parseInt(subscription.metadata.userId);
      
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          isPremium: false,
          subscriptionId: null,
          subscriptionStatus: SubscriptionStatus.CANCELED,
          subscriptionPriceId: null,
          subscriptionCurrentPeriodEnd: null
        }
      });

      console.log(`Subscription canceled for user ${userId}`);
    } catch (error) {
      console.error('Error handling subscription cancellation:', error);
      throw error;
    }
  }

  private async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    if (invoice.subscription) {
      const subscription = await this.stripe.subscriptions.retrieve(invoice.subscription as string);
      const userId = parseInt(subscription.metadata.userId);
      
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          isPremium: true,
          subscriptionStatus: SubscriptionStatus.ACTIVE
        }
      });
    }
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    if (invoice.subscription) {
      const subscription = await this.stripe.subscriptions.retrieve(invoice.subscription as string);
      const userId = parseInt(subscription.metadata.userId);
      
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          isPremium: false,
          subscriptionStatus: SubscriptionStatus.PAST_DUE
        }
      });
    }
  }

  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    const prices = await this.stripe.prices.list({
      active: true,
      expand: ['data.product']
    });

    return prices.data.map(price => ({
      id: price.id,
      name: (price.product as Stripe.Product).name,
      description: (price.product as Stripe.Product).description || '',
      price: price.unit_amount! / 100,
      interval: price.recurring?.interval || 'month',
      features: (price.product as Stripe.Product).metadata.features?.split(',') || []
    }));
  }

  async verifyCheckoutSession(sessionId: string, userId: number): Promise<boolean> {
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
  
      const subscription = await this.stripe.subscriptions.retrieve(
        session.subscription as string
      );
  
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
    } catch (error) {
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

  async getSubscriptionStatus(userId: number) {
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
      throw new NotFoundError('User not found');
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
    } catch (error) {
      console.error('Error retrieving Stripe subscription:', error);
    }
  
    return {
      hasSubscription: !!user.subscriptionId,
      isPremium: user.isPremium,
      status: user.subscriptionStatus,
      currentPeriodEnd: user.subscriptionCurrentPeriodEnd,
      stripeStatus: stripeSubscription?.status
    };
  }
}