import { DietItem } from './diet-item.model';

/** An interchangeable alternative for a meal ("Opção 2", "Opção 3"...). */
export interface MealOption {
  items: DietItem[];
}

export interface Meal {
  name: string;
  /** Option 1. It is the one that counts in the plan totals. */
  items: DietItem[];
  /** Options 2+; absent on plans saved before options existed. */
  alternatives?: MealOption[];
  totalKcal?: number;
}

/** Items of option `index` (0 = option 1). */
export function optionItems(meal: Meal, index: number): DietItem[] {
  return index === 0 ? meal.items : (meal.alternatives?.[index - 1]?.items ?? []);
}

export function optionCount(meal: Meal): number {
  return 1 + (meal.alternatives?.length ?? 0);
}
