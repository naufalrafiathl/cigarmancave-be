import express, {
  Request,
  Response,
  NextFunction,
  RequestHandler,
} from "express";
import { SubscriptionController } from "../controllers/subscription.controller";
import { authenticate } from "../middleware/auth.middleware";
import { AuthenticatedRequest } from "../types/auth";

type AuthenticatedRequestHandler = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => Promise<Response | void>;

const router = express.Router();
const subscriptionController = new SubscriptionController();

const getPlans: RequestHandler = subscriptionController.getPlans;
const createSubscription: AuthenticatedRequestHandler =
  subscriptionController.createSubscription;
const cancelSubscription: AuthenticatedRequestHandler =
  subscriptionController.cancelSubscription;
const verifyCheckout: AuthenticatedRequestHandler =
  subscriptionController.verifyCheckoutSession;
const subscriptionStatus: AuthenticatedRequestHandler =
  subscriptionController.getSubscriptionStatus;

router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  (req: Request, res: Response, next: NextFunction) => {
    subscriptionController.handleWebhook(req, res, next);
  }
);

router.get("/plans", getPlans);

router.use(authenticate);
router.post("/create", createSubscription as RequestHandler);
router.post("/cancel", cancelSubscription as RequestHandler);
router.post("/verify-session", verifyCheckout as RequestHandler);
router.get("/status", subscriptionStatus as RequestHandler);

// Webhook route with raw body parsing

export default router;
