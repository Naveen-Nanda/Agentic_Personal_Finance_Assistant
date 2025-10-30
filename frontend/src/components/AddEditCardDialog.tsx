import { useState, useEffect } from 'react';
import { CreditCard, RewardCategory, RewardType } from '../types';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import '../styles/dialog.css';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Plus, X } from 'lucide-react';
import { detectCardNetwork } from '../utils/card-utils';
import { formatCardNumber, isValidCardNumber } from '../utils/card-formatting';

interface AddEditCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card?: CreditCard;
  onSave: (card: CreditCard) => void;
}

export function AddEditCardDialog({ open, onOpenChange, card, onSave }: AddEditCardDialogProps) {
  const [formData, setFormData] = useState<Omit<CreditCard, 'id'>>({
    cardName: '',
    customName: '',
    panNumber: '',
    cardholderName: '',
    expiryDate: '',
    billingAddress: '',
    network: 'unknown',
    creditLimit: undefined,
    annualFee: undefined,
    rewardType: 'cashback',
    rewardCategories: [],
    baseRewardRate: undefined,
    signupBonus: '',
    foreignTransactionFee: undefined,
    additionalBenefits: [],
  });

  const [newCategory, setNewCategory] = useState<RewardCategory>({
    category: '',
    rewardRate: '',
    details: '',
  });
  
  const [isValidCard, setIsValidCard] = useState(true);
  
  const handleCardNumberChange = (value: string) => {
    const cleanNumber = value.replace(/\s/g, '');
    const network = detectCardNetwork(cleanNumber);
    const formatted = formatCardNumber(cleanNumber);
    const isValid = isValidCardNumber(cleanNumber);
    
    setIsValidCard(cleanNumber.length === 0 || isValid);
    setFormData(prev => ({
      ...prev,
      panNumber: formatted,
      network
    }));
  };

  useEffect(() => {
    if (card) {
      setFormData({
        cardName: card.cardName,
        customName: card.customName || '',
        panNumber: card.panNumber,
        cardholderName: card.cardholderName,
        expiryDate: card.expiryDate,
        billingAddress: card.billingAddress,
        network: card.network,
        creditLimit: card.creditLimit,
        annualFee: card.annualFee,
        rewardType: card.rewardType,
        rewardCategories: card.rewardCategories,
        baseRewardRate: card.baseRewardRate,
        signupBonus: card.signupBonus || '',
        foreignTransactionFee: card.foreignTransactionFee,
        additionalBenefits: card.additionalBenefits || [],
      });
    } else {
      setFormData({
        cardName: '',
        customName: '',
        panNumber: '',
        cardholderName: '',
        expiryDate: '',
        billingAddress: '',
        network: 'unknown',
        creditLimit: undefined,
        annualFee: undefined,
        rewardType: 'cashback',
        rewardCategories: [],
        baseRewardRate: undefined,
        signupBonus: '',
        foreignTransactionFee: undefined,
        additionalBenefits: [],
      });
    }
  }, [card, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newCard: CreditCard = {
      id: card?.id || Date.now().toString(),
      ...formData,
    };
    onSave(newCard);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="" style={{maxHeight: "95%", overflow: "auto"}}>
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle>{card ? 'Edit Card' : 'Add New Card'}</DialogTitle>
            <DialogDescription>
              {card ? 'Update your credit card information' : 'Add a new credit card to your account'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 custom-scrollbar">
            <div className="grid gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-sm">Basic Information</h3>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cardName">Card Name</Label>
                    <Input
                      id="cardName"
                      value={formData.cardName}
                      onChange={(e) => setFormData({ ...formData, cardName: e.target.value })}
                      placeholder="e.g., Chase Sapphire Preferred"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customName">Card Nickname (optional)</Label>
                    <Input
                      id="customName"
                      value={formData.customName}
                      onChange={(e) => setFormData({ ...formData, customName: e.target.value })}
                      placeholder="e.g., My Travel Card"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-sm">Card Details</h3>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cardholderName">Cardholder Name</Label>
                    <Input
                      id="cardholderName"
                      value={formData.cardholderName}
                      onChange={(e) => setFormData({ ...formData, cardholderName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="panNumber">Card Number (PAN)</Label>
                    <div className="relative">
                      <Input
                        id="panNumber"
                        value={formData.panNumber}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\s/g, '');
                          handleCardNumberChange(value);
                        }}
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        pattern="\d{4}\s\d{4}\s\d{4}\s\d{4}"
                        required
                        className="font-mono"
                      />
                      {formData.network !== 'unknown' && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <img
                            src={`/card-networks/${formData.network}.svg`}
                            alt={formData.network}
                            className="h-6 w-auto"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expiryDate">Expiry Date</Label>
                      <Input
                        id="expiryDate"
                        value={formData.expiryDate}
                        onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                        placeholder="MM/YY"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="creditLimit">Credit Limit</Label>
                      <Input
                        id="creditLimit"
                        type="number"
                        value={formData.creditLimit}
                        onChange={(e) => setFormData({ ...formData, creditLimit: parseFloat(e.target.value) })}
                        placeholder="10000"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billingAddress">Billing Address</Label>
                    <Textarea
                      id="billingAddress"
                      value={formData.billingAddress}
                      onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-sm">Fees & Charges</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="annualFee">Annual Fee</Label>
                    <Input
                      id="annualFee"
                      type="number"
                      value={formData.annualFee}
                      onChange={(e) => setFormData({ ...formData, annualFee: parseFloat(e.target.value) })}
                      placeholder="95"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="foreignTransactionFee">Foreign Transaction Fee (%)</Label>
                    <Input
                      id="foreignTransactionFee"
                      type="number"
                      step="0.1"
                      value={formData.foreignTransactionFee}
                      onChange={(e) => setFormData({ ...formData, foreignTransactionFee: parseFloat(e.target.value) })}
                      placeholder="3.0"
                    />
                  </div>
                </div>
              </div>
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Rewards & Benefits</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rewardType">Reward Type</Label>
                    <select
                      id="rewardType"
                      value={formData.rewardType}
                      onChange={(e) => setFormData({ ...formData, rewardType: e.target.value as RewardType })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      required
                    >
                      <option value="">Select Type</option>
                      <option value="cashback">Cashback</option>
                      <option value="points">Points</option>
                      <option value="miles">Miles</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="baseRewardRate">Base Reward Rate</Label>
                    <Input
                      id="baseRewardRate"
                      type="number"
                      step="0.1"
                      value={formData.baseRewardRate}
                      onChange={(e) => setFormData({ ...formData, baseRewardRate: parseFloat(e.target.value) })}
                      placeholder="1.0"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signupBonus">Sign-up Bonus</Label>
                  <Input
                    id="signupBonus"
                    value={formData.signupBonus}
                    onChange={(e) => setFormData({ ...formData, signupBonus: e.target.value })}
                    placeholder="e.g., 60,000 points after spending $4,000 in 3 months"
                  />
                </div>
              </div>
            </div>            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">Reward Categories</h3>
                <p className="text-sm text-muted-foreground">
                  {formData.rewardCategories.length} categories added
                </p>
              </div>
              
              <div className="space-y-4 max-h-[200px] overflow-y-auto rounded-md border p-4">
                {formData.rewardCategories.map((reward, index) => (
                  <div 
                    key={index} 
                    className="flex items-start gap-2 p-3 rounded-md bg-muted/50 relative group"
                  >
                    <div className="flex-1 space-y-1">
                      <p className="font-medium">{reward.category}</p>
                      <p className="text-sm text-muted-foreground">{reward.rewardRate}</p>
                      {reward.details && (
                        <p className="text-sm text-muted-foreground">{reward.details}</p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity absolute -right-2 -top-2"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          rewardCategories: formData.rewardCategories.filter((_, i) => i !== index)
                        });
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                {formData.rewardCategories.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No reward categories added yet. Add your first category below.
                  </p>
                )}
              </div>
              
              <div className="space-y-3 bg-muted/50 p-4 rounded-md">
                <h4 className="text-sm font-medium">Add New Category</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Category (e.g., Dining)"
                    value={newCategory.category}
                    onChange={(e) => setNewCategory({ ...newCategory, category: e.target.value })}
                  />
                  <Input
                    placeholder="Rate (e.g., 5% cashback)"
                    value={newCategory.rewardRate}
                    onChange={(e) => setNewCategory({ ...newCategory, rewardRate: e.target.value })}
                  />
                </div>
                <Textarea
                  placeholder="Additional details (optional)"
                  value={newCategory.details}
                  onChange={(e) => setNewCategory({ ...newCategory, details: e.target.value })}
                  className="text-sm"
                  rows={2}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    if (newCategory.category && newCategory.rewardRate) {
                      setFormData({
                        ...formData,
                        rewardCategories: [...formData.rewardCategories, newCategory]
                      });
                      setNewCategory({ category: '', rewardRate: '', details: '' });
                    }
                  }}
                  disabled={!newCategory.category || !newCategory.rewardRate}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              </div>
            </div>
              </div>
            </div>
          <DialogFooter className="px-6 py-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{card ? 'Update' : 'Add'} Card</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
