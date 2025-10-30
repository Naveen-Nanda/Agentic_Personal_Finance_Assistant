import { useState } from 'react';
import { CreditCard, PlannedPurchase, PurchaseItem } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Plus, Trash2, Loader2 } from 'lucide-react';

interface PurchasePlanningViewProps {
  cards: CreditCard[];
}

export function PurchasePlanningView({ cards }: PurchasePlanningViewProps) {
  const [planTitle, setPlanTitle] = useState('');
  const [planDescription, setPlanDescription] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [totalBudget, setTotalBudget] = useState('');
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [currentItem, setCurrentItem] = useState({
    purchaseItem: '',
    merchantName: '',
    merchantCode: '',
    merchantCategory: '',
    transactionAmount: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<PlannedPurchase | null>(null);

  const addItem = () => {
    // Add validation to ensure the transaction amount is a valid number
    if (!currentItem.purchaseItem || !currentItem.merchantName || !currentItem.transactionAmount || isNaN(parseFloat(currentItem.transactionAmount))) {
      console.log('Validation failed:', {
        purchaseItem: currentItem.purchaseItem,
        merchantName: currentItem.merchantName,
        transactionAmount: currentItem.transactionAmount
      });
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

  const handleSubmit = async () => {
    if (items.length === 0 || cards.length === 0) return;

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Process each item and find the best card for its category
    const itemsWithRecommendations = items.map(item => {
      // Find a card that matches the item's category
      const matchingCard = cards.find((card) => 
        card.rewardsDetails.toLowerCase().includes(item.merchantCategory.toLowerCase())
      ) || cards[0]; // Default to first card if no match found

      return {
        ...item,
        recommendedCard: matchingCard
      };
    });

    const plannedPurchase: PlannedPurchase = {
      id: Date.now().toString(),
      title: planTitle,
      description: planDescription,
      totalBudget: totalBudget ? parseFloat(totalBudget) : undefined,
      items: itemsWithRecommendations,
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
          </div>

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
                                {result && (
                                  <div className="text-sm">
                                    <div className="font-medium">
                                      {item.recommendedCard?.cardholderName || 'Processing...'}
                                    </div>
                                    <div className="text-muted-foreground text-xs">
                                      {item.recommendedCard?.rewardsProgram || ''}
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
                      <Button onClick={handleSubmit} disabled={isSubmitting || items.length === 0}>
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          'Submit for Card Recommendation'
                        )}
                      </Button>
                    </div>
                  </CardContent>
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
              <Button variant="outline" onClick={resetForm}>
                Start New Plan
              </Button>
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
                        <p className="text-sm">{item.recommendedCard.cardholderName}</p>
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