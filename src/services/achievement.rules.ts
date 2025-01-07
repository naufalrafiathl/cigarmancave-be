// src/services/achievement.rules.ts
import { AchievementRule, AchievementEventType } from "../types/achievement";

const achievementRules: AchievementRule[] = [
  {
    id: 1,
    name: "Beta Pioneer",
    description: "One of the first to join Mancave during beta",
    category: "onboarding",
    iconName: "beta-star",
    badgeDescription: "Gold star with 'β' symbol",
    triggerEvents: [AchievementEventType.USER_REGISTERED],
    check: async ({ user }) => {
      console.log("Checking Beta Pioneer eligibility for user:", user.id);
      console.log("User created at:", user.createdAt);
      const betaEndDate = new Date("2025-03-31");
      console.log("Beta end date:", betaEndDate);
      const isEligible = new Date(user.createdAt) <= betaEndDate;
      console.log("Is eligible:", isEligible);
      return isEligible;
    },
  },
  {
    id: 2,
    name: "First Steps",
    description: "Complete your profile with picture and bio",
    category: "onboarding",
    iconName: "checkmark-sparkles",
    badgeDescription: "A simple checkmark with sparkles",
    triggerEvents: [AchievementEventType.PROFILE_UPDATED],
    check: async ({ user }) => {
      return Boolean(user.fullName && user.profileImageUrl && user.location);
    },
  },
  {
    id: 3,
    name: "Getting Started",
    description: "Created your first humidor",
    category: "onboarding",
    iconName: "wooden-box",
    badgeDescription: "Small wooden box",
    triggerEvents: [AchievementEventType.HUMIDOR_CREATED],
    check: async ({ user }) => {
      return (user._count?.humidors || 0) > 0;
    },
  },
  {
    id: 4,
    name: "First Light",
    description: "Posted your first cigar review",
    category: "onboarding",
    iconName: "match-flame",
    badgeDescription: "Single match with flame",
    triggerEvents: [AchievementEventType.REVIEW_CREATED],
    check: async ({ user }) => {
      return (user._count?.reviews || 0) === 0;
    },
  },
];

export { achievementRules };
