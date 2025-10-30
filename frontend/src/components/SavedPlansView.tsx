import { useState } from 'react';
import { PlannedPurchase } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { Trash2, Pencil, RotateCw, Check, X } from 'lucide-react';
import { recommendationService } from '../services/recommendationService';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { RecommendationResponse } from '../types/api';

interface SavedPlansViewProps {
  onSelectPlan: (plan: PlannedPurchase) => void;
}

export function SavedPlansView({ onSelectPlan }: SavedPlansViewProps) {
  const [savedPlans, setSavedPlans] = useState<PlannedPurchase[]>(() => {
    const saved = localStorage.getItem('savedPlans');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentPlan, setCurrentPlan] = useState<PlannedPurchase | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewRecommendations, setShowNewRecommendations] = useState(false);
  const [newRecommendations, setNewRecommendations] = useState<RecommendationResponse | null>(null);

  const deletePlan = (planId: string) => {
    const updatedPlans = savedPlans.filter(plan => plan.id !== planId);
    setSavedPlans(updatedPlans);
    localStorage.setItem('savedPlans', JSON.stringify(updatedPlans));
  };

  const tryNewRecommendations = async (plan: PlannedPurchase) => {
    setCurrentPlan(plan);
    setIsLoading(true);
    try {
      const totalAmount = plan.items.reduce((sum, item) => sum + item.transactionAmount, 0);
      // Load the current saved credit cards and goals from localStorage so retry uses up-to-date data
      const savedCardsRaw = localStorage.getItem('creditCards');
      const savedCards = savedCardsRaw ? JSON.parse(savedCardsRaw) : [];
      const savedGoalsRaw = localStorage.getItem('financialGoals');
      const savedGoals = savedGoalsRaw ? JSON.parse(savedGoalsRaw) : [];

      const response = await recommendationService.getRecommendations({
        purchasePlan: {
          items: plan.items,
          totalAmount
        },
        availableCards: savedCards,
        goals: savedGoals || []
      });

      setNewRecommendations(response);
      setShowNewRecommendations(true);
    } catch (error) {
      console.error('Error getting new recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const acceptNewRecommendations = () => {
    if (!currentPlan || !newRecommendations?.itemRecommendations) return;

    const updatedPlan = {
      ...currentPlan,
      items: currentPlan.items.map(item => {
        const itemRecommendation = newRecommendations.itemRecommendations[item.id]?.[0];
        return {
          ...item,
          recommendedCard: itemRecommendation?.card || item.recommendedCard // Use the best recommendation for each item
        };
      })
    };

    const updatedPlans = savedPlans.map(plan => 
      plan.id === currentPlan.id ? updatedPlan : plan
    );

    setSavedPlans(updatedPlans);
    localStorage.setItem('savedPlans', JSON.stringify(updatedPlans));
    setShowNewRecommendations(false);
    setCurrentPlan(null);
    setNewRecommendations(null);
  };

  const formatDate = (timestamp: string) => {
    return new Date(parseInt(timestamp)).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Saved Plans</CardTitle>
        </CardHeader>
        <CardContent>
          {savedPlans.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No saved plans yet. Create a purchase plan and save it to see it here.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Plan Title</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead className="w-[180px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {savedPlans.map((plan) => [
                    <TableRow key={`${plan.id}-header`}>
                      <TableCell>{formatDate(plan.id)}</TableCell>
                      <TableCell className="font-medium">{plan.title}</TableCell>
                      <TableCell>{plan.description}</TableCell>
                      <TableCell>
                        ${plan.items.reduce((sum, item) => sum + item.transactionAmount, 0).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => tryNewRecommendations(plan)}
                            disabled={isLoading && currentPlan?.id === plan.id}
                            title="Try new recommendations"
                          >
                            <RotateCw className={`h-4 w-4 ${isLoading && currentPlan?.id === plan.id ? 'animate-spin' : ''}`} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => onSelectPlan(plan)}
                            title="Edit plan"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => deletePlan(plan.id)}
                            title="Delete plan"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>,
                    <TableRow key={`${plan.id}-details`}>
                      <TableCell colSpan={5} className="bg-muted/20">
                        <div className="py-2">
                          <h4 className="font-semibold mb-2">Purchase Items:</h4>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Item</TableHead>
                                <TableHead>Merchant</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Recommended Card</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {plan.items.map((item) => (
                                <TableRow key={item.id}>
                                  <TableCell>{item.purchaseItem}</TableCell>
                                  <TableCell>{item.merchantName}</TableCell>
                                  <TableCell>${item.transactionAmount.toFixed(2)}</TableCell>
                                  <TableCell>
                                    {item.recommendedCard ? (
                                      <div className="flex flex-col">
                                        <span className="font-medium">{item.recommendedCard.cardName} ****{item.recommendedCard.panNumber.slice(-4)}</span>
                                        <span className="text-sm text-muted-foreground">{item.recommendedCard.rewardsProgram}</span>
                                      </div>
                                    ) : (
                                      <span className="text-muted-foreground">No recommendation</span>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </TableCell>
                    </TableRow>
                  ])}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showNewRecommendations} onOpenChange={(open) => {
        if (!open) {
            setShowNewRecommendations(false);
            setCurrentPlan(null);
            setNewRecommendations(null);
          }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Compare Recommendations</DialogTitle>
            <DialogDescription>
              Review and compare your current and new card recommendations
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {/* Heading: current plan title */}
            <h4 className="text-lg font-semibold">{currentPlan?.title || 'Current Plan'}</h4>

            {/* Comparison table: Item | Current Card | New Card */}
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="pb-2">Item</th>
                    <th className="pb-2">Current Card</th>
                    <th className="pb-2">New Card</th>
                  </tr>
                </thead>
                <tbody>
                  {currentPlan?.items.map((item) => {
                    const newRec = newRecommendations?.itemRecommendations?.[item.id]?.[0];
                    return (
                      <tr key={item.id} className="border-t">
                        <td className="py-3 align-top">
                          <div className="font-medium">{item.purchaseItem}</div>
                          <div className="text-xs text-muted-foreground">{item.merchantName} • ${item.transactionAmount.toFixed(2)}</div>
                        </td>
                        <td className="py-3 align-top">
                          {item.recommendedCard ? (
                            <div>
                              <div className="font-medium">{item.recommendedCard.cardName} ****{item.recommendedCard.panNumber.slice(-4)}</div>
                              <div className="text-xs text-muted-foreground">{item.recommendedCard.rewardsProgram || `${item.recommendedCard.baseRewardRate}% base rewards`}</div>
                            </div>
                          ) : (
                            <div className="text-muted-foreground">No current card</div>
                          )}
                        </td>
                        <td className="py-3 align-top">
                          {newRec ? (
                            <div className="p-2 rounded border border-primary bg-primary/10">
                              <div className="font-medium">{newRec.card.cardName} ****{newRec.card.panNumber.slice(-4)}</div>
                              <div className="text-xs text-muted-foreground">{newRec.reason}</div>
                              <div className="text-sm text-primary mt-1">${newRec.potentialRewards.amount.toFixed(2)}</div>
                            </div>
                          ) : (
                            <div className="text-muted-foreground">No new recommendation</div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => {
              setShowNewRecommendations(false);
              setCurrentPlan(null);
              setNewRecommendations(null);
            }}>
              <X className="mr-2 h-4 w-4" />
              Discard
            </Button>
            <Button onClick={acceptNewRecommendations}>
              <Check className="mr-2 h-4 w-4" />
              Accept New Recommendation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}