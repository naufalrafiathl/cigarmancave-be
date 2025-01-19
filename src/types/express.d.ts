declare namespace Express {
    interface User {
      id: number;
      email: string;
      location?: string;
      auth0Id?: string;
      fullName?: string;
      picture?: string;
      isPremium?: boolean;
      profileImageUrl?: string
    }
  }