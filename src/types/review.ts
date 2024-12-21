export interface CreateReviewDTO {
    cigarId: number;
    constructionScore?: number;
    drawScore?: number;
    flavorScore?: number;
    burnScore?: number;
    impressionScore?: number;
  
    flavorPepperScore?: number;
    flavorChocolateScore?: number;
    flavorCreamyScore?: number;
    flavorLeatherScore?: number;
    flavorWoodyScore?: number;
    flavorEarthyScore?: number;
    flavorNuttyScore?: number;
    flavorSweetScore?: number;
    flavorFruityScore?: number;
    flavorGrassyScore?: number;
    flavorBerryScore?: number;
    flavorCoffeeScore?: number;
    flavorBittersScore?: number;
  
    notes?: string;
    buyAgain?: boolean;
    pairings?: Array<{
      name: string;
      type: string;
      notes?: string;
    }>;
    images?: string[];
  }

  export interface ReviewResponse {
    id: number;
    cigarId: number;
    userId: number;
    date: Date;
    constructionScore?: number;
    drawScore?: number;
    flavorScore?: number;
    burnScore?: number;
    impressionScore?: number;
    overallScore: number;
    flavorPepperScore?: number
    flavorChocolateScore?: number
    flavorCreamyScore?: number
    flavorLeatherScore?: number
    flavorWoodyScore?: number
    flavorEarthyScore?: number
    flavorNuttyScore?: number
    flavorSweetScore?: number
    flavorFruityScore?: number
    flavorGrassyScore?: number
    flavorBerryScore?: number
    flavorCoffeeScore?: number
    flavorBittersScore?: number
    notes?: string;
    buyAgain?: boolean;
    images: Array<{ id: number; url: string }>;
    pairings: Array<{
      id: number;
      name: string;
      type: string;
      notes?: string;
    }>;
    createdAt: Date;
    updatedAt: Date;
  }