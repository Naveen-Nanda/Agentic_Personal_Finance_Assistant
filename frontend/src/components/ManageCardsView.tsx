import { useState } from 'react';
import { CreditCard } from '../types';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { AddEditCardDialog } from './AddEditCardDialog';
import { Plus, Pencil, Trash2, CreditCard as CreditCardIcon } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';

interface ManageCardsViewProps {
  cards: CreditCard[];
  onAddCard: (card: CreditCard) => void;
  onUpdateCard: (card: CreditCard) => void;
  onDeleteCard: (id: string) => void;
}

export function ManageCardsView({ cards, onAddCard, onUpdateCard, onDeleteCard }: ManageCardsViewProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
  const [deletingCardId, setDeletingCardId] = useState<string | null>(null);

  const maskPAN = (pan: string) => {
    if (pan.length < 4) return pan;
    return `•••• •••• •••• ${pan.slice(-4)}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2>Manage Cards</h2>
          <p className="text-muted-foreground">
            Add, edit, or remove your credit cards
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Card
        </Button>
      </div>

      {cards.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CreditCardIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle className="mb-2">No cards added yet</CardTitle>
            <CardDescription className="mb-4">
              Add your first credit card to get started
            </CardDescription>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Card
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <Card key={card.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle>
                      {card.cardName}
                      {card.customName && (
                        <span className="text-sm text-muted-foreground ml-2">({card.customName})</span>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {card.cardholderName}
                    </CardDescription>
                    <p className="text-sm mt-1 flex items-center gap-2">
                      <span>{maskPAN(card.panNumber)}</span>
                      <img
                        src={`/card-networks/${card.network}.svg`}
                        alt={card.network}
                        className="h-5 w-auto inline-block"
                      />
                    </p>
                  </div>
                  {card.creditLimit && (
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Credit Limit</p>
                      <p className="font-medium">${card.creditLimit.toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-muted-foreground text-sm">Expiry Date</p>
                    <p>{card.expiryDate}</p>
                  </div>
                  {card.annualFee !== undefined && (
                    <div>
                      <p className="text-muted-foreground text-sm">Annual Fee</p>
                      <p>${card.annualFee}</p>
                    </div>
                  )}
                  {card.foreignTransactionFee !== undefined && (
                    <div>
                      <p className="text-muted-foreground text-sm">Foreign Transaction Fee</p>
                      <p>{card.foreignTransactionFee}%</p>
                    </div>
                  )}
                </div>
                
                <div>
                  <p className="text-muted-foreground text-sm mb-2">Rewards</p>
                  <div className="space-y-2">
                    <div className="bg-muted/50 p-2 rounded-sm">
                      <p className="text-sm font-medium">Base Rate</p>
                      <p className="text-sm">
                        {card.baseRewardRate}% {card.rewardType}
                      </p>
                    </div>
                    {card.rewardCategories.map((reward, index) => (
                      <div key={index} className="bg-muted/50 p-2 rounded-sm">
                        <p className="text-sm font-medium">{reward.category}</p>
                        <p className="text-sm">{reward.rewardRate}</p>
                        {reward.details && (
                          <p className="text-xs text-muted-foreground mt-1">{reward.details}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                {card.signupBonus && (
                  <div>
                    <p className="text-muted-foreground text-sm">Sign-up Bonus</p>
                    <p className="text-sm">{card.signupBonus}</p>
                  </div>
                )}
                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setEditingCard(card)}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setDeletingCardId(card.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AddEditCardDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSave={onAddCard}
      />

      {editingCard && (
        <AddEditCardDialog
          open={!!editingCard}
          onOpenChange={(open) => !open && setEditingCard(null)}
          card={editingCard}
          onSave={(card) => {
            onUpdateCard(card);
            setEditingCard(null);
          }}
        />
      )}

      <AlertDialog open={!!deletingCardId} onOpenChange={(open) => !open && setDeletingCardId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your credit card information.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingCardId) {
                  onDeleteCard(deletingCardId);
                  setDeletingCardId(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
