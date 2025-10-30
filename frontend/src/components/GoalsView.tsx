import { useState, useEffect } from 'react';
import { FinancialGoal } from '../types';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Plus, Pencil, Trash } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

export function GoalsView() {
  const [goals, setGoals] = useState<FinancialGoal[]>(() => {
    const savedGoals = localStorage.getItem('financialGoals');
    return savedGoals ? JSON.parse(savedGoals) : [];
  });

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);
  const [newGoal, setNewGoal] = useState<Omit<FinancialGoal, 'id' | 'createdAt' | 'updatedAt'>>({
    title: '',
    description: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });

  const handleAddGoal = () => {
    const goal: FinancialGoal = {
      id: Date.now().toString(),
      ...newGoal,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedGoals = [...goals, goal];
    setGoals(updatedGoals);
    localStorage.setItem('financialGoals', JSON.stringify(updatedGoals));
    setIsAddDialogOpen(false);
    setNewGoal({
      title: '',
      description: '',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd'),
    });
  };

  const handleUpdateGoal = (updatedGoal: FinancialGoal) => {
    const updatedGoals = goals.map((goal) =>
      goal.id === updatedGoal.id
        ? { ...updatedGoal, updatedAt: new Date().toISOString() }
        : goal
    );
    setGoals(updatedGoals);
    localStorage.setItem('financialGoals', JSON.stringify(updatedGoals));
    setEditingGoal(null);
  };

  const handleDeleteGoal = (id: string) => {
    const updatedGoals = goals.filter((goal) => goal.id !== id);
    setGoals(updatedGoals);
    localStorage.setItem('financialGoals', JSON.stringify(updatedGoals));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Financial Goals</h2>
          <p className="text-muted-foreground">Track and manage your financial goals</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Goal
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-220px)]">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => (
            <Card key={goal.id}>
              <CardHeader>
                <CardTitle>{goal.title}</CardTitle>
                <CardDescription>
                  {format(new Date(goal.startDate), 'MMM d, yyyy')} -{' '}
                  {format(new Date(goal.endDate), 'MMM d, yyyy')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{goal.description}</p>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingGoal(goal)}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteGoal(goal.id)}
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Goal</DialogTitle>
            <DialogDescription>Create a new financial goal with a timeline</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Goal Title</Label>
              <Input
                id="title"
                value={newGoal.title}
                onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                placeholder="e.g., Save for Down Payment"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newGoal.description}
                onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                placeholder="Describe your financial goal..."
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  placeholder="DD-MM-YYYY"
                  value={format(new Date(newGoal.startDate), 'dd-MM-yyyy')}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.match(/^\d{2}-\d{2}-\d{4}$/)) {
                      const [day, month, year] = value.split('-');
                      const date = new Date(`${year}-${month}-${day}`);
                      if (!isNaN(date.getTime())) {
                        setNewGoal({
                          ...newGoal,
                          startDate: format(date, 'yyyy-MM-dd')
                        });
                      }
                    }
                  }}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  placeholder="DD-MM-YYYY"
                  value={format(new Date(newGoal.endDate), 'dd-MM-yyyy')}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.match(/^\d{2}-\d{2}-\d{4}$/)) {
                      const [day, month, year] = value.split('-');
                      const date = new Date(`${year}-${month}-${day}`);
                      if (!isNaN(date.getTime())) {
                        setNewGoal({
                          ...newGoal,
                          endDate: format(date, 'yyyy-MM-dd')
                        });
                      }
                    }
                  }}
                  required
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddGoal}
              disabled={!newGoal.title || !newGoal.description}
            >
              Add Goal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {editingGoal && (
        <Dialog open={!!editingGoal} onOpenChange={() => setEditingGoal(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Goal</DialogTitle>
              <DialogDescription>Update your financial goal details</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Goal Title</Label>
                <Input
                  id="edit-title"
                  value={editingGoal.title}
                  onChange={(e) =>
                    setEditingGoal({ ...editingGoal, title: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingGoal.description}
                  onChange={(e) =>
                    setEditingGoal({ ...editingGoal, description: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-startDate">Start Date</Label>
                  <Input
                    id="edit-startDate"
                    placeholder="DD-MM-YYYY"
                    value={format(new Date(editingGoal.startDate), 'dd-MM-yyyy')}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.match(/^\d{2}-\d{2}-\d{4}$/)) {
                        const [day, month, year] = value.split('-');
                        const date = new Date(`${year}-${month}-${day}`);
                        if (!isNaN(date.getTime())) {
                          setEditingGoal({
                            ...editingGoal,
                            startDate: format(date, 'yyyy-MM-dd')
                          });
                        }
                      }
                    }}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-endDate">End Date</Label>
                  <Input
                    id="edit-endDate"
                    placeholder="DD-MM-YYYY"
                    value={format(new Date(editingGoal.endDate), 'dd-MM-yyyy')}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.match(/^\d{2}-\d{2}-\d{4}$/)) {
                        const [day, month, year] = value.split('-');
                        const date = new Date(`${year}-${month}-${day}`);
                        if (!isNaN(date.getTime())) {
                          setEditingGoal({
                            ...editingGoal,
                            endDate: format(date, 'yyyy-MM-dd')
                          });
                        }
                      }
                    }}
                    required
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditingGoal(null)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleUpdateGoal(editingGoal)}
                disabled={!editingGoal.title || !editingGoal.description}
              >
                Update Goal
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}