export enum SubscriptionStatus {
    INCOMPLETE = 'incomplete',
    INCOMPLETE_EXPIRED = 'incomplete_expired',
    TRIALING = 'trialing',
    ACTIVE = 'active',
    PAST_DUE = 'past_due',
    CANCELED = 'canceled',
    UNPAID = 'unpaid'
  }
  
  export interface SubscriptionPlan {
    id: string;
    name: string;
    description: string;
    price: number;
    interval: string;
    features: string[];
  }