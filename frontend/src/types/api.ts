import { CreditCard, FinancialGoal, PurchaseItem } from './index';

export interface RecommendationRequest {
  purchasePlan: {
    items: PurchaseItem[];
    totalAmount: number;
  };
  availableCards: CreditCard[];
  goals: FinancialGoal[];
}

export interface CardRecommendation {
  card: CreditCard;
  reason: string;
  potentialRewards: {
    type: string;
    amount: number;
  };
  matchedCategories: string[];
  itemId?: string;  // Optional ID to link recommendation to specific item
}

export interface RecommendationResponse {
  itemRecommendations: { [itemId: string]: CardRecommendation[] };  // Per-item recommendations only
  totalRewardsValue: number;  // Sum of the best recommendations for each item
  message: string;
}