import { RecommendationRequest, RecommendationResponse, CardRecommendation } from '../types/api';
export type { CardRecommendation };
import { config, getApiUrl } from '../config';

// Helper function to create mock recommendations
const createMockRecommendations = (request: RecommendationRequest): RecommendationResponse => {
  const { availableCards, purchasePlan } = request;
  
  const itemRecommendations: { [itemId: string]: CardRecommendation[] } = {};
  
  // Generate recommendations for each item
  purchasePlan.items.forEach(item => {
    // First, find cards with matching categories for this item
    const cardsWithCategoryMatch = availableCards.filter(card =>
      card.rewardCategories.some(rc => 
        rc.category.toLowerCase() === item.merchantCategory.toLowerCase()
      )
    );
    
    // If we have matching cards, prioritize them, otherwise use all cards
    const candidateCards = cardsWithCategoryMatch.length > 0 ? cardsWithCategoryMatch : availableCards;
    
    // Sort cards by potential reward value for this specific item
    const sortedCards = candidateCards.sort((a, b) => {
      const aMatch = a.rewardCategories.find(rc => 
        rc.category.toLowerCase() === item.merchantCategory.toLowerCase()
      );
      const bMatch = b.rewardCategories.find(rc => 
        rc.category.toLowerCase() === item.merchantCategory.toLowerCase()
      );
      
      const aRate = aMatch ? parseFloat(aMatch.rewardRate) : (a.baseRewardRate || 1);
      const bRate = bMatch ? parseFloat(bMatch.rewardRate) : (b.baseRewardRate || 1);
      
      // Add some randomness while still favoring better rewards
      return (bRate + Math.random()) - (aRate + Math.random());
    });
    
    // Take top 3 cards for recommendations
    const recommendedCards = sortedCards.slice(0, 3);
    
    itemRecommendations[item.id] = recommendedCards.map(card => {
      const matchingCategory = card.rewardCategories.find(rc => 
        rc.category.toLowerCase() === item.merchantCategory.toLowerCase()
      );
      
      const rewardRate = matchingCategory 
        ? parseFloat(matchingCategory.rewardRate)
        : (card.baseRewardRate || 1);
        
      const rewardAmount = (item.transactionAmount * rewardRate) / 100;
      
      return {
        card,
        reason: matchingCategory 
          ? `This card offers ${rewardRate}% rewards for ${item.merchantCategory} purchases`
          : `This card offers ${card.baseRewardRate}% base rewards`,
        potentialRewards: {
          type: card.rewardType,
          amount: rewardAmount
        },
        matchedCategories: matchingCategory ? [matchingCategory.category] : [],
        itemId: item.id
      };
    });
  });

  // Calculate total rewards value from the best recommendation for each item
  const totalRewardsValue = Object.values(itemRecommendations)
    .reduce((total, recommendations) => {
      // Get the best recommendation for this item
      const bestRecommendation = recommendations[0]; // Already sorted by reward value
      return total + (bestRecommendation?.potentialRewards.amount || 0);
    }, 0);

  return {
    itemRecommendations,
    totalRewardsValue,
    message: 'Recommendations generated for each purchase item'
  };
};

export const recommendationService = {
  getRecommendations: async (request: RecommendationRequest): Promise<RecommendationResponse> => {
    // Validate request data
    if (!request.purchasePlan?.items?.length) {
      throw new Error('Purchase plan items are required');
    }
    if (!request.availableCards?.length) {
      throw new Error('Available cards are required');
    }

    // console.log('Making recommendation request:', {
    //   itemsCount: request.purchasePlan.items,
    //   totalAmount: request.purchasePlan.totalAmount,
    //   cardsCount: request.availableCards,
    //   goalsCount: request.goals
    // });

    console.log("GET CARD RECOMMENDATIONS REQUEST : ", JSON.stringify(request));

    try {
      // In production, this would be a real API call
      const response = await fetch(getApiUrl('recommendations'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error('Failed to get recommendations');
      }

      let result = await response.json();
      console.log('Received recommendation response:', result);
      return result;
    } catch (error) {
      console.log('Using mock data due to API error:', error);
      console.log("MOCK INFERENCE RESPONSE :" , JSON.stringify(createMockRecommendations(request)))
      // Return mock data if the API call fails
      return createMockRecommendations(request);
    }
  }
};