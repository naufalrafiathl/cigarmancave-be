import express from 'express';
import { SubscriptionController } from '../controllers/subscription.controller';

const router = express.Router();
const subscriptionController = new SubscriptionController();

router.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  subscriptionController.handleWebhook
);

export default router;