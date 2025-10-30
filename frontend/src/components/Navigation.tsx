import { Wallet, CreditCard, ScrollText, Target } from 'lucide-react';
import { cn } from './ui/utils';

interface NavigationProps {
  activeView: 'cards' | 'plan' | 'saved' | 'goals';
  onViewChange: (view: 'cards' | 'plan' | 'saved' | 'goals') => void;
}

const navigationItems = [
  {
    id: 'cards',
    label: 'Manage Cards',
    icon: CreditCard
  },
  {
    id: 'plan',
    label: 'Plan Purchase',
    icon: Wallet
  },
  {
    id: 'saved',
    label: 'Saved Plans',
    icon: ScrollText
  },
  {
    id: 'goals',
    label: 'Goals',
    icon: Target
  }
] as const;

export function Navigation({ activeView, onViewChange }: NavigationProps) {
  return (
    <div className="flex border rounded-lg p-1 mb-6">
      {navigationItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onViewChange(item.id)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded flex-1 transition-colors",
            activeView === item.id
              ? "bg-secondary text-secondary-foreground"
              : "hover:bg-secondary/50"
          )}
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </button>
      ))}
    </div>
  );
}