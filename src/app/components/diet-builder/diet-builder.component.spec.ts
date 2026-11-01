import { DietBuilderComponent } from './diet-builder.component';
import { Meal } from '../../models/meal.model';
import { Food } from '../../models/food.model';
import { ConfirmationService } from 'primeng/api';
import { I18nService } from '../../services/i18n.service';

function makeFood(overrides: Partial<Food> = {}): Food {
  return {
    id: '1',
    name: 'Arroz',
    source: 'TACO',
    energy_kcal: 130,
    protein_g: 2.7,
    carbohydrate_g: 28.2,
    fat_g: 0.3,
    fiber_g: 1.6,
    household_measures: [],
    ...overrides,
  };
}

function makeComponent(): DietBuilderComponent {
  return new DietBuilderComponent(
    {} as ConfirmationService,
    {} as I18nService,
  );
}

describe('DietBuilderComponent', () => {
  describe('getMealMacros', () => {
    it('returns zeros for a meal with no items', () => {
      const component = makeComponent();
      const meal: Meal = { name: 'Café da manhã', items: [] };

      expect(component.getMealMacros(meal)).toEqual({
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
      });
    });

    it('sums macros across items, scaled by quantity', () => {
      const component = makeComponent();
      const meal: Meal = {
        name: 'Almoço',
        items: [
          {
            food: makeFood(),
            displayQuantity: 200,
            selectedMeasure: '',
            quantityInGrams: 200,
            measures: [],
          },
          {
            food: makeFood({
              protein_g: 20,
              carbohydrate_g: 0,
              fat_g: 15,
              fiber_g: 0,
            }),
            displayQuantity: 100,
            selectedMeasure: '',
            quantityInGrams: 100,
            measures: [],
          },
        ],
      };

      expect(component.getMealMacros(meal)).toEqual({
        protein: 25.4,
        carbs: 56.4,
        fat: 15.6,
        fiber: 3.2,
      });
    });

    it('ignores items without a resolved food or quantity', () => {
      const component = makeComponent();
      const meal: Meal = {
        name: 'Lanche',
        items: [
          {
            food: makeFood(),
            displayQuantity: 100,
            selectedMeasure: '',
            quantityInGrams: 100,
            measures: [],
          },
          {
            food: null as unknown as Food,
            displayQuantity: 0,
            selectedMeasure: '',
            quantityInGrams: NaN,
            measures: [],
          },
        ],
      };

      expect(component.getMealMacros(meal)).toEqual({
        protein: 2.7,
        carbs: 28.2,
        fat: 0.3,
        fiber: 1.6,
      });
    });
  });

  describe('measureLabel', () => {
    const measures = [
      { measure_name: 'grama', display_name: 'Grama', gram_equivalent: 1 },
      { measure_name: 'fatia média', display_name: 'fatia média', gram_equivalent: 15 },
      { measure_name: 'fatia pequena (30g)', display_name: '', gram_equivalent: 30 },
    ];
    const item = (selectedMeasure: string, unit?: Food['unit']) => ({
      food: makeFood({ unit }),
      displayQuantity: 1,
      selectedMeasure,
      quantityInGrams: 15,
      measures,
    });

    it('appends the gram weight to household measures', () => {
      expect(makeComponent().measureLabel(item('fatia média'))).toBe(
        'fatia média (15 g)',
      );
    });

    it('uses mL for liquids', () => {
      expect(makeComponent().measureLabel(item('fatia média', 'ml'))).toBe(
        'fatia média (15 mL)',
      );
    });

    it('keeps base measures and names that already carry the weight', () => {
      const component = makeComponent();
      expect(component.measureLabel(item('grama'))).toBe('grama');
      expect(component.measureLabel(item('fatia pequena (30g)'))).toBe(
        'fatia pequena (30g)',
      );
    });
  });
});
