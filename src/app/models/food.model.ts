export interface Food {
  id: string;
  name: string;
  source: string;
  /** Unidade-base do alimento: 'ml' para liquidos, 'g' para os demais. */
  unit?: 'g' | 'ml';
  energy_kcal: number;
  protein_g: number;
  carbohydrate_g: number;
  fat_g: number;
  fiber_g: number;
  household_measures: HouseholdMeasure[];
}

export interface HouseholdMeasure {
  name: string;
}
