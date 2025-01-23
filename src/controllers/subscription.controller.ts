import { Request, Response, NextFunction } from 'express';
import { SubscriptionService } from '../services/subscription.service';
import { AuthenticatedRequest } from '../types/auth';
import Stripe from 'stripe';

export class SubscriptionController {
  private subscriptionService: SubscriptionService;
  private stripe: Stripe;

  constructor() {
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
        return;
      }
  
      const checkoutSession = await this.subscriptionService.createSubscription(
        userId, 
        priceId
      );
  
      res.json({
        status: 'success',
        data: {
          checkoutUrl: checkoutSession.url
        }
      });
    } catch (error) {
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

  handleWebhook = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const sig = req.headers['stripe-signature'];
  
    try {
      if (!sig) {
        res.status(400).send('No Stripe signature found');
        return;
      }
  
      const event = this.stripe.webhooks.constructEvent(
        req.body,
        sig as string,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
  
      await this.subscriptionService.handleWebhook(event);
  
      res.json({ received: true });
    } catch (error) {
      console.error('Webhook Error:', error);
      res.status(400).send(`Webhook Error: ${error.message}`);
    }
  };

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