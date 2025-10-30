import { CardRecommendation } from '../services/recommendationService';

export type CardNetwork = 'visa' | 'mastercard' | 'amex' | 'discover' | 'unknown';

export interface RewardCategory {
  category: string;
  rewardRate: string;
  details: string;
}

export type RewardType = 'cashback' | 'points' | 'miles';

export interface CreditCard {
  id: string;
  cardName: string;
  customName?: string;
  panNumber: string;
  cardholderName: string;
  expiryDate: string;
  billingAddress: string;
  network: CardNetwork;
  creditLimit?: number;
  annualFee?: number;
  rewardType: RewardType;
  rewardCategories: RewardCategory[];
  baseRewardRate?: number;
  signupBonus?: string;
  foreignTransactionFee?: number;
  additionalBenefits?: string[];
  rewardsProgram?: string;
}

export interface Merchant {
  name: string;
  code: string;
  category: string;
}

export interface PurchaseItem {
  id: string;
  purchaseItem: string;
  merchantName: string;
  merchantCode: string;
  merchantCategory: string;
  transactionAmount: number;
  recommendedCard?: CreditCard;
}

export interface FinancialGoal {
  id: string;
  title: string;
  description: string;
  startDate: string;
}

export interface PlannedPurchase {
  id: string;
  title: string;
  description: string;
  totalBudget: number;
  items: PurchaseItem[];
  recommendations?: CardRecommendation[];
  createdAt: string;
}

export interface PurchasePlanningViewProps {
  cards: CreditCard[];
  selectedPlan?: PlannedPurchase | null;
  onPlanSaved?: () => void;
}

export interface SavedPlansViewProps {
  onSelectPlan: (plan: PlannedPurchase) => void;
}

export type NavigationProps = {
  activeView: 'cards' | 'plan' | 'saved';
  onViewChange: (view: 'cards' | 'plan' | 'saved') => void;
};
