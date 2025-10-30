import { useState } from 'react';
import { CreditCard, PlannedPurchase } from './types';
import { ManageCardsView } from './components/ManageCardsView';
import { PurchasePlanningView } from './components/PurchasePlanningView';
import { SavedPlansView } from './components/SavedPlansView';
import { GoalsView } from './components/GoalsView';
import { Navigation } from './components/Navigation';

export default function App() {
  const [cards, setCards] = useState<CreditCard[]>(() => {
    const savedCards = localStorage.getItem('creditCards');
    return savedCards ? JSON.parse(savedCards) : [];
  });
  const [activeView, setActiveView] = useState<'cards' | 'plan' | 'saved' | 'goals'>('cards');
  const [selectedPlan, setSelectedPlan] = useState<PlannedPurchase | null>(null);

  const handleAddCard = (card: CreditCard) => {
    const updatedCards = [...cards, card];
    setCards(updatedCards);
    localStorage.setItem('creditCards', JSON.stringify(updatedCards));
  };

  const handleUpdateCard = (updatedCard: CreditCard) => {
    const updatedCards = cards.map((card) => (card.id === updatedCard.id ? updatedCard : card));
    setCards(updatedCards);
    localStorage.setItem('creditCards', JSON.stringify(updatedCards));
  };

  const handleDeleteCard = (id: string) => {
    const updatedCards = cards.filter((card) => card.id !== id);
    setCards(updatedCards);
    localStorage.setItem('creditCards', JSON.stringify(updatedCards));
  };

  const handleSelectPlan = (plan: PlannedPurchase) => {
    setSelectedPlan(plan);
    setActiveView('plan');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2">Credit Card Manager</h1>
          <p className="text-muted-foreground">
            Manage your credit cards and plan purchases with smart card recommendations
          </p>
        </div>

        <Navigation activeView={activeView} onViewChange={setActiveView} />

        <div className="mt-6 w-full">
          {activeView === 'cards' && (
            <ManageCardsView
              cards={cards}
              onAddCard={handleAddCard}
              onUpdateCard={handleUpdateCard}
              onDeleteCard={handleDeleteCard}
            />
          )}

          {activeView === 'plan' && (
            <PurchasePlanningView 
              cards={cards}
              selectedPlan={selectedPlan}
              onPlanSaved={() => {
                setSelectedPlan(null);
                setActiveView('saved');
              }}
            />
          )}

          {activeView === 'saved' && (
            <SavedPlansView onSelectPlan={handleSelectPlan} />
          )}

          {activeView === 'goals' && (
            <GoalsView />
          )}
        </div>
      </div>
    </div>
  );
}
