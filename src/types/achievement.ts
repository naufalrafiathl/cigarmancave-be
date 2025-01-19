export enum AchievementEventType {
    PROFILE_UPDATED = 'profile_updated',
    REVIEW_CREATED = 'review_created',
    HUMIDOR_CREATED = 'humidor_created',
    USER_REGISTERED = 'user_registered'
  }
  
  export interface AchievementEvent {
    userId: number;
    type: AchievementEventType;
    data?: any;
  }
  
  export interface RuleContext {
    user: any;
    event?: AchievementEvent;
  }
  
  export interface AchievementRule {
    id: number;
    name: string;
    description: string;
    category: 'onboarding' | 'social' | 'review' | 'collection' | 'special';
    iconName: string;
    badgeDescription: string;
    triggerEvents: AchievementEventType[];
    check: (context: RuleContext) => Promise<boolean>;
    isPremium?: boolean;
  }