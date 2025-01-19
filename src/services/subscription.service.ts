// src/services/subscription.service.ts
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import { SubscriptionPlan,SubscriptionStatus } from '../types/subscription';
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
    // Create a Stripe customer
    const customer = await this.stripe.customers.create({
      email,
      metadata: {
        userId: userId.toString()
      }
    });

    // Update user with Stripe customer ID
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        stripeCustomerId: customer.id
      }
    });

    return customer.id;
  }

  async createSubscription(userId: number, priceId: string) {
    // Find user to ensure they exist
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });
  
    if (!user) {
      throw new NotFoundError('User not found');
    }
  
    let { stripeCustomerId } = user;
  
    // Create customer if not exists
    if (!stripeCustomerId) {
      stripeCustomerId = await this.createCustomer(userId, user.email);
    }
  
    // Create checkout session
    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      client_reference_id: userId.toString(),
      customer: stripeCustomerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        }
      ],
      success_url: `${process.env.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/subscription`,
      payment_method_collection: 'always',
      metadata: {
        userId: userId.toString()
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

    // Cancel the subscription in Stripe
    await this.stripe.subscriptions.update(user.subscriptionId, {
      cancel_at_period_end: true
    });

    // Update user subscription status
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: SubscriptionStatus.CANCELED
      }
    });
  }

  async handleWebhook(event: Stripe.Event): Promise<void> {
    switch (event.type) {
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
  }

  private async handleSubscriptionUpdate(subscription: Stripe.Subscription): Promise<void> {
    const userId = parseInt(subscription.metadata.userId);
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: subscription.status as SubscriptionStatus,
        subscriptionPriceId: subscription.items.data[0].price.id,
        subscriptionCurrentPeriodEnd: new Date(subscription.current_period_end * 1000)
      }
    });
  }

  private async handleSubscriptionCanceled(subscription: Stripe.Subscription): Promise<void> {
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
      // Retrieve the checkout session from Stripe
      const session = await this.stripe.checkout.sessions.retrieve(sessionId);
  
      // Verify the session belongs to the user
      if (session.client_reference_id !== userId.toString()) {
        console.error('Session user mismatch', {
          sessionUserId: session.client_reference_id,
          requestUserId: userId
        });
        return false;
      }
  
      // Check session status
      if (session.payment_status !== 'paid') {
        console.error('Session not fully paid', {
          paymentStatus: session.payment_status
        });
        return false;
      }
  
      // Retrieve the subscription details
      const subscription = await this.stripe.subscriptions.retrieve(
        session.subscription as string
      );
  
      // Update user subscription status
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
      
      // Log detailed error information
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
    // Find user with subscription details
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
  
    // If no subscription, return default status
    if (!user.subscriptionId) {
      return {
        hasSubscription: false,
        isPremium: false,
        status: null,
        currentPeriodEnd: null
      };
    }
  
    // Optionally, verify subscription status with Stripe
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