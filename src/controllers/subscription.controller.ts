// src/controllers/subscription.controller.ts
import { Request, Response, NextFunction } from 'express';
import { SubscriptionService } from '../services/subscription.service';
import { AuthenticatedRequest } from '../types/auth';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';


export class SubscriptionController {
  private subscriptionService: SubscriptionService;
  private stripe: Stripe;
  private prisma: PrismaClient

  constructor() {
    this.prisma = this.prisma;
    this.subscriptionService = new SubscriptionService();
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2024-12-18.acacia'
    });
  }

  getPlans = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const plans = await this.subscriptionService.getSubscriptionPlans();
      res.json({
        status: 'success',
        data: plans
      });
    } catch (error) {
      next(error);
    }
  };

  createSubscription = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { priceId } = req.body;
      const userId = req.user?.id;
  
      if (!userId) {
        res.status(401).json({
          status: 'error',
          message: 'Unauthorized'
        });
        return; // Explicitly return to satisfy TypeScript
      }
  
      // Create checkout session
      const checkoutSession = await this.subscriptionService.createSubscription(
        userId, 
        priceId
      );
  
      // Respond with checkout URL
      res.json({
        status: 'success',
        data: {
          checkoutUrl: checkoutSession.url
        }
      });
    } catch (error) {
      // Pass to global error handler
      next(error);
    }
  };
  cancelSubscription = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;

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
    } catch (error) {
      next(error);
    }
  };

  handleWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const sig = req.headers['stripe-signature'];

    try {
      if (!sig) {
        res.status(400).send('No Stripe signature found');
        return;
      }

      let event: Stripe.Event;
      try {
        event = this.stripe.webhooks.constructEvent(
          req.body,
          sig as string,
          process.env.STRIPE_WEBHOOK_SECRET!
        );
      } catch (err) {
        console.error('Webhook signature verification failed', err);
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
      }

      // Process the webhook event
      await this.processWebhookEvent(event);

      // Respond to Stripe
      res.json({ received: true });
    } catch (error) {
      console.error('Webhook processing error', error);
      next(error);
    }
  };

  private async processWebhookEvent(event: Stripe.Event): Promise<void> {
    console.log(`Processing Stripe webhook event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutSessionCompleted(event);
        break;

      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event);
        break;

      case 'invoice.payment_succeeded':
        await this.handleInvoicePaymentSucceeded(event);
        break;

      case 'invoice.payment_failed':
        await this.handleInvoicePaymentFailed(event);
        break;

      default:
        console.log(`Unhandled Stripe webhook event: ${event.type}`);
    }
  }

  private async handleCheckoutSessionCompleted(event: Stripe.Event): Promise<void> {
    const session = event.data.object as Stripe.Checkout.Session;
    
    try {
      const userId = parseInt(session.client_reference_id || '0');
      
      if (!userId || isNaN(userId)) {
        console.error('Invalid or missing user ID in checkout session', session);
        return;
      }

      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionId: session.subscription as string,
          subscriptionStatus: 'active',
          isPremium: true
        }
      });

      console.log(`Subscription activated for user ${userId}`, {
        subscriptionId: session.subscription,
        userUpdated: !!updatedUser
      });
    } catch (error) {
      console.error('Error processing checkout.session.completed:', error);
      throw error;
    }
  }

  private async handleSubscriptionUpdated(event: Stripe.Event): Promise<void> {
    const subscription = event.data.object as Stripe.Subscription;
    
    try {
      const userId = parseInt(subscription.metadata.userId || '0');
      
      if (!userId || isNaN(userId)) {
        console.error('Invalid or missing user ID in subscription metadata', subscription);
        return;
      }

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionStatus: subscription.status,
          subscriptionCurrentPeriodEnd: new Date(subscription.current_period_end * 1000)
        }
      });

      console.log(`Subscription updated for user ${userId}`, {
        status: subscription.status
      });
    } catch (error) {
      console.error('Error processing customer.subscription.updated:', error);
      throw error;
    }
  }

  private async handleSubscriptionDeleted(event: Stripe.Event): Promise<void> {
    const deletedSubscription = event.data.object as Stripe.Subscription;
    
    try {
      const userId = parseInt(deletedSubscription.metadata.userId || '0');
      
      if (!userId || isNaN(userId)) {
        console.error('Invalid or missing user ID in deleted subscription', deletedSubscription);
        return;
      }

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionId: null,
          subscriptionStatus: 'canceled',
          isPremium: false
        }
      });

      console.log(`Subscription canceled for user ${userId}`);
    } catch (error) {
      console.error('Error processing customer.subscription.deleted:', error);
      throw error;
    }
  }

  private async handleInvoicePaymentSucceeded(event: Stripe.Event): Promise<void> {
    const invoice = event.data.object as Stripe.Invoice;
    
    try {
      const subscriptionId = invoice.subscription;
      
      console.log('Invoice payment succeeded', {
        invoiceId: invoice.id,
        subscriptionId
      });
    } catch (error) {
      console.error('Error processing invoice.payment_succeeded:', error);
      throw error;
    }
  }
  private async handleInvoicePaymentFailed(event: Stripe.Event): Promise<void> {
    const failedInvoice = event.data.object as Stripe.Invoice;
    
    try {
      const subscriptionId = failedInvoice.subscription;
      
      console.log('Invoice payment failed', {
        invoiceId: failedInvoice.id,
        subscriptionId
      });

      // If you want to handle payment failure for a specific user
      if (subscriptionId) {
        // Attempt to find the subscription and associated user
        const subscription = await this.stripe.subscriptions.retrieve(subscriptionId as string);
        const userId = parseInt(subscription.metadata.userId || '0');

        if (userId) {
          await this.prisma.user.update({
            where: { id: userId },
            data: {
              subscriptionStatus: 'past_due',
              isPremium: false
            }
          });

          console.log(`Updated subscription status for user ${userId} to past due`);
        }
      }
    } catch (error) {
      console.error('Error processing invoice.payment_failed:', error);
      throw error;
    }
  }

verifyCheckoutSession = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sessionId } = req.body;
      const userId = req.user?.id;
  
      if (!userId) {
        res.status(401).json({
          status: 'error',
          message: 'Unauthorized'
        });
        return;
      }
  
      // Verify checkout session
      const verificationResult = await this.subscriptionService.verifyCheckoutSession(
        sessionId, 
        userId
      );
  
      res.json({
        status: 'success',
        data: {
          verified: verificationResult
        }
      });
    } catch (error) {
      next(error);
    }
  };

  getSubscriptionStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
  
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
    } catch (error) {
      next(error);
    }
  };
}