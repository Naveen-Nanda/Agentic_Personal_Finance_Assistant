import { useState, useEffect } from 'react';
import { CreditCard, PlannedPurchase, PurchaseItem, FinancialGoal } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { recommendationService } from '../services/recommendationService';
import { CardRecommendation, RecommendationResponse } from '../types/api';

interface PurchasePlanningViewProps {
  cards: CreditCard[];
  selectedPlan?: PlannedPurchase | null;
  onPlanSaved?: () => void;
}

export function PurchasePlanningView({ cards, selectedPlan, onPlanSaved }: PurchasePlanningViewProps) {
  const [planTitle, setPlanTitle] = useState(selectedPlan?.title || '');
  const [planDescription, setPlanDescription] = useState(selectedPlan?.description || '');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [totalBudget, setTotalBudget] = useState(selectedPlan?.totalBudget?.toString() || '');
  const [items, setItems] = useState<PurchaseItem[]>(selectedPlan?.items || []);
  const [currentItem, setCurrentItem] = useState({
    purchaseItem: '',
    merchantName: '',
    merchantCode: '',
    merchantCategory: '',
    transactionAmount: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<PlannedPurchase | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [recommendations, setRecommendations] = useState<RecommendationResponse | null>(null);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [hasRecommendations, setHasRecommendations] = useState(false);

  // Load saved goals and plans from localStorage
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  
  const savePurchasePlan = () => {
    const newPlan: PlannedPurchase = {
      id: Date.now().toString(),
      title: planTitle || 'Untitled Plan',
      description: planDescription,
      totalBudget: parseFloat(totalBudget),
      items: items,
      recommendations: recommendations ? Object.values(recommendations.itemRecommendations).flat() : undefined,
      createdAt: Date.now().toString()
    };

    // Get existing saved plans
    const existingSavedPlans = JSON.parse(localStorage.getItem('savedPlans') || '[]');
    const updatedPlans = [...existingSavedPlans, newPlan];
    localStorage.setItem('savedPlans', JSON.stringify(updatedPlans));
    setIsSaved(true);
    
    if (onPlanSaved) {
      onPlanSaved();
    }
  };

  // Load goals when component mounts
  useEffect(() => {
    const loadGoals = () => {
      const savedGoals = localStorage.getItem('financialGoals');
      if (savedGoals) {
        try {
          const parsedGoals = JSON.parse(savedGoals);
          setGoals(parsedGoals);
          console.log('Loaded goals:', parsedGoals);
        } catch (error) {
          console.error('Error loading goals:', error);
          setGoals([]);
        }
      }
    };

    loadGoals();
  }, []);

  const addItem = () => {
    if (!currentItem.purchaseItem || !currentItem.merchantName || !currentItem.transactionAmount || isNaN(parseFloat(currentItem.transactionAmount))) {
      return;
    }

    const newItem: PurchaseItem = {
      id: Date.now().toString(),
      purchaseItem: currentItem.purchaseItem,
      merchantName: currentItem.merchantName,
      merchantCode: currentItem.merchantCode,
      merchantCategory: currentItem.merchantCategory,
      transactionAmount: parseFloat(currentItem.transactionAmount),
    };

    setItems([...items, newItem]);
    setCurrentItem({
      purchaseItem: '',
      merchantName: '',
      merchantCode: '',
      merchantCategory: '',
      transactionAmount: '',
    });
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

    const getRecommendations = async () => {
    if (items.length === 0) {
      console.error('No items in purchase plan');
      return;
    }

    if (!cards || cards.length === 0) {
      console.error('No saved cards available');
      return;
    }

    setIsLoadingRecommendations(true);
    try {
      const totalAmount = items.reduce((sum, item) => sum + item.transactionAmount, 0);
      
      const requestPayload = {
        purchasePlan: {
          items,
          totalAmount,
          title: planTitle,
          description: planDescription
        },
        availableCards: cards,
        goals: goals || []
      };

      console.log('Sending recommendation request with payload:', requestPayload);
      
      const response = await recommendationService.getRecommendations(requestPayload);

      // response now contains per-item recommendations
      setRecommendations(response);
      
      // Update items with recommended cards per item
      setItems(items.map(item => ({
        ...item,
        recommendedCard: response.itemRecommendations[item.id]?.[0]?.card || item.recommendedCard
      })));
    } catch (error) {
      console.error('Error getting recommendations:', error);
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  const handleSubmit = async () => {
    if (!planTitle || items.length === 0) {
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Process each item and find the best card for its category (fallback to first card)
    const itemsWithRecommendations = items.map(item => {
      const matchingCard = cards.find((card) => 
        card.rewardCategories.some(rc => rc.category.toLowerCase().includes(item.merchantCategory.toLowerCase()))
      ) || cards[0];

      return {
        ...item,
        recommendedCard: matchingCard
      };
    });

    const plannedPurchase: PlannedPurchase = {
      id: Date.now().toString(),
      title: planTitle,
      description: planDescription,
  totalBudget: totalBudget ? parseFloat(totalBudget) : 0,
      items: itemsWithRecommendations,
      createdAt: Date.now().toString()
    };

    setResult(plannedPurchase);
    setIsSubmitting(false);
  };

  const resetForm = () => {
    setItems([]);
    setResult(null);
    setTotalBudget('');
    setPlanTitle('');
    setPlanDescription('');
    setIsSaved(false);
  };

  const totalPlanned = items.reduce((sum, item) => sum + item.transactionAmount, 0);
  const budgetNumber = totalBudget ? parseFloat(totalBudget) : null;
  const isOverBudget = budgetNumber !== null && totalPlanned > budgetNumber;
  const remainingBudget = budgetNumber !== null ? budgetNumber - totalPlanned : null;

  return (
    <div className="space-y-6">
      {!result && (
        <>
          <Card>
            <CardHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="planTitle">Plan Title</Label>
                  {isEditingTitle ? (
                    <Input
                      id="planTitle"
                      value={planTitle}
                      onChange={(e) => setPlanTitle(e.target.value)}
                      onBlur={() => setIsEditingTitle(false)}
                      onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                      autoFocus
                      placeholder="Enter plan title (e.g., 22nd Anniversary Planning)"
                      className="mt-2"
                    />
                  ) : (
                    <h2 
                      onClick={() => setIsEditingTitle(true)} 
                      className="text-xl font-semibold mt-2 cursor-pointer hover:text-muted-foreground"
                    >
                      {planTitle || "Click to add plan title"}
                    </h2>
                  )}
                </div>
                <div>
                  <Label htmlFor="planDescription">Description</Label>
                  {isEditingDescription ? (
                    <Input
                      id="planDescription"
                      value={planDescription}
                      onChange={(e) => setPlanDescription(e.target.value)}
                      onBlur={() => setIsEditingDescription(false)}
                      onKeyDown={(e) => e.key === 'Enter' && setIsEditingDescription(false)}
                      autoFocus
                      placeholder="Enter plan description (e.g., My marriage anniversary)"
                      className="mt-2"
                    />
                  ) : (
                    <p 
                      onClick={() => setIsEditingDescription(true)} 
                      className="mt-2 cursor-pointer hover:text-muted-foreground"
                    >
                      {planDescription || "Click to add plan description"}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Label htmlFor="totalBudget" className="whitespace-nowrap">Total Budget (Optional):</Label>
                  <Input
                    id="totalBudget"
                    type="number"
                    step="0.01"
                    value={totalBudget}
                    onChange={(e) => setTotalBudget(e.target.value)}
                    placeholder="0.00"
                    className="w-32"
                  />
                </div>
              </div>
            </CardHeader>
          </Card>

          {budgetNumber !== null && items.length > 0 && (
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground">Budget Status</p>
                    <p className={isOverBudget ? 'text-destructive' : ''}>
                      ${totalPlanned.toFixed(2)} of ${budgetNumber.toFixed(2)} planned
                      {remainingBudget !== null && (
                        <span className="ml-2">
                          ({remainingBudget >= 0 ? `$${remainingBudget.toFixed(2)} remaining` : `$${Math.abs(remainingBudget).toFixed(2)} over budget`})
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-muted-foreground">Progress</p>
                    <p className={isOverBudget ? 'text-destructive' : ''}>
                      {((totalPlanned / budgetNumber) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {cards.length === 0 && (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">
                  Please add at least one credit card in the Manage Cards section to use this feature.
                </p>
              </CardContent>
            </Card>
          )}

          {cards.length > 0 && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Add Purchase Item</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    <div className="space-y-2">
                      <Label htmlFor="purchaseItem">Purchase Item</Label>
                      <Input
                        id="purchaseItem"
                        value={currentItem.purchaseItem}
                        onChange={(e) => setCurrentItem({ ...currentItem, purchaseItem: e.target.value })}
                        placeholder="Enter item"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="merchantName">Merchant Name</Label>
                      <Input
                        id="merchantName"
                        value={currentItem.merchantName}
                        onChange={(e) => setCurrentItem({ ...currentItem, merchantName: e.target.value })}
                        placeholder="Enter merchant name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="merchantCode">Merchant Code</Label>
                      <Input
                        id="merchantCode"
                        value={currentItem.merchantCode}
                        onChange={(e) => setCurrentItem({ ...currentItem, merchantCode: e.target.value })}
                        placeholder="Enter merchant code"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="merchantCategory">Merchant Category</Label>
                      <Input
                        id="merchantCategory"
                        value={currentItem.merchantCategory}
                        onChange={(e) => setCurrentItem({ ...currentItem, merchantCategory: e.target.value })}
                        placeholder="Enter merchant category"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="transactionAmount">Amount ($)</Label>
                      <Input
                        id="transactionAmount"
                        type="number"
                        step="0.01"
                        value={currentItem.transactionAmount}
                        onChange={(e) => setCurrentItem({ ...currentItem, transactionAmount: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={addItem}
                    className="mt-4"
                    disabled={!currentItem.purchaseItem || !currentItem.merchantName || !currentItem.transactionAmount || isNaN(parseFloat(currentItem.transactionAmount))}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                  </Button>
                </CardContent>
              </Card>

              {items.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Purchase Items ({items.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Purchase Item</TableHead>
                            <TableHead>Merchant Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Recommended Card</TableHead>
                            <TableHead className="w-[100px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.purchaseItem}</TableCell>
                              <TableCell>{item.merchantName}</TableCell>
                              <TableCell>{item.merchantCategory}</TableCell>
                              <TableCell>${item.transactionAmount.toFixed(2)}</TableCell>
                              <TableCell>
                                {item.recommendedCard && (
                                  <div className="text-sm">
                                    <div className="font-medium">
                                      {item.recommendedCard.cardName} ****{item.recommendedCard.panNumber.slice(-4)}
                                    </div>
                                    <div className="text-muted-foreground text-xs">
                                      {item.recommendedCard.rewardType} - {item.recommendedCard.baseRewardRate}%
                                    </div>
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeItem(item.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="flex justify-between items-center mt-4">
                      <div>
                        <p className="text-muted-foreground">
                          Total: ${totalPlanned.toFixed(2)}
                        </p>
                      </div>
                      <Button 
                        onClick={getRecommendations}
                        disabled={
                          isLoadingRecommendations || 
                          items.length === 0 || 
                          !cards || 
                          cards.length === 0
                        }
                        title={
                          items.length === 0 
                            ? 'Add items to get recommendations' 
                            : !cards || cards.length === 0 
                              ? 'Add cards to get recommendations'
                              : recommendations ? 'Refresh recommendations' : 'Get card recommendations for your purchase plan'
                        }
                      >
                        {isLoadingRecommendations ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {recommendations ? 'Refreshing...' : 'Getting Recommendations...'}
                          </>
                        ) : (
                          <>
                            {recommendations && (
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="mr-2 h-4 w-4"
                              >
                                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                                <path d="M21 3v5h-5" />
                                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                                <path d="M3 21v-5h5" />
                              </svg>
                            )}
                            {recommendations ? 'Refresh recommendations' : 'Submit for Card Recommendation'}
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

                      {recommendations && (
                <Card className="mt-6">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div>
                      <CardTitle>Card Recommendations</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">Best cards for your planned purchases</p>
                    </div>
                    <div className="space-x-2">
                      <Button
                        variant="secondary"
                        disabled={isSaved}
                        onClick={() => {
                          const planToSave = {
                            id: Date.now().toString(),
                            title: planTitle || 'Untitled Plan',
                            description: planDescription,
                            totalBudget: totalBudget ? parseFloat(totalBudget) : undefined,
                            items: items.map(item => ({
                              ...item,
                              recommendedCard: recommendations?.itemRecommendations?.[item.id]?.[0]?.card || item.recommendedCard
                            })),
                            recommendations: Object.values(recommendations?.itemRecommendations || {}).flat(),
                            createdAt: Date.now().toString()
                          };
                          
                          const savedPlans = JSON.parse(localStorage.getItem('savedPlans') || '[]');
                          savedPlans.push(planToSave);
                          localStorage.setItem('savedPlans', JSON.stringify(savedPlans));
                          setIsSaved(true);
                          if (onPlanSaved) onPlanSaved();
                        }}
                      >
              {isSaved ? 'Plan Saved!' : 'Save Plan'}
                      </Button>
                      <Button variant="outline" onClick={() => {
                        setItems([]);
                        setRecommendations(null);
                        setPlanTitle('');
                        setPlanDescription('');
                        setTotalBudget('');
                        setIsSaved(false);
                      }}>
                        Start New Plan
                      </Button>
                    </div>
                  </CardHeader>
                  {/* Removed detailed recommendations list - only show actions (Save / Start New) */}
                </Card>
              )}
            </>
          )}
        </>
      )}

      {result && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Card Recommendations for: {result.title}</CardTitle>
                <p className="text-muted-foreground mt-1">{result.description}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  disabled={isSaved}
                  onClick={() => {
                    if (!result) return;
                    
                    const savedPlans: PlannedPurchase[] = JSON.parse(localStorage.getItem('savedPlans') || '[]');
                    const existingPlanIndex = savedPlans.findIndex((plan: PlannedPurchase) => plan.id === result.id);
                    
                    if (existingPlanIndex >= 0) {
                      savedPlans[existingPlanIndex] = result;
                    } else {
                      savedPlans.push(result);
                    }
                    
                    localStorage.setItem('savedPlans', JSON.stringify(savedPlans));
                    setIsSaved(true);
                    onPlanSaved?.();
                  }}
                >
                  {isSaved ? 'Plan Saved' : 'Save Plan'}
                </Button>
                <Button variant="outline" onClick={resetForm}>
                  Start New Plan
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="mb-4">Purchase Summary</h3>
              <div className="space-y-4">
                {result.items.map((item) => (
                  <div key={item.id} className="flex items-start justify-between border-b pb-4 last:border-0">
                    <div>
                      <p className="font-medium">{item.purchaseItem}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.merchantName} • {item.merchantCategory}
                      </p>
                      <p className="text-sm">${item.transactionAmount.toFixed(2)}</p>
                    </div>
                    {item.recommendedCard && (
                      <div className="text-right">
                        <p className="font-medium">Recommended Card:</p>
                        <p className="text-sm">{item.recommendedCard.cardName} ****{item.recommendedCard.panNumber.slice(-4)}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.recommendedCard.rewardsProgram}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="mb-2">Summary</h3>
              <div className="space-y-1">
                <p className="text-muted-foreground">
                  Total Items: {result.items.length}
                </p>
                <p className="text-muted-foreground">
                  Total Amount: ${result.items.reduce((sum, item) => sum + item.transactionAmount, 0).toFixed(2)}
                </p>
                {result.totalBudget !== undefined && (
                  <>
                    <p className="text-muted-foreground">
                      Budget: ${result.totalBudget.toFixed(2)}
                    </p>
                    <p className={
                      result.items.reduce((sum, item) => sum + item.transactionAmount, 0) > result.totalBudget
                        ? 'text-destructive'
                        : 'text-muted-foreground'
                    }>
                      {result.items.reduce((sum, item) => sum + item.transactionAmount, 0) <= result.totalBudget
                        ? `Remaining: $${(result.totalBudget - result.items.reduce((sum, item) => sum + item.transactionAmount, 0)).toFixed(2)}`
                        : `Over Budget: $${(result.items.reduce((sum, item) => sum + item.transactionAmount, 0) - result.totalBudget).toFixed(2)}`}
                    </p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}