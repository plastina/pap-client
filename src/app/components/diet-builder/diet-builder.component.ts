import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { DietItem } from '../../models/diet-item.model';
import { Meal, optionItems } from '../../models/meal.model';
import { Measure } from '../../models/measure.model';
import { TranslatePipe } from '../../pipes/t.pipe';
import { I18nService } from '../../services/i18n.service';

const DIET_BUILDER_IMPORTS = [
  CommonModule,
  FormsModule,
  InputTextModule,
  InputNumberModule,
  ButtonModule,
  DividerModule,
  TooltipModule,
  SelectModule,
  TranslatePipe,
];

interface ItemIndices {
  mealIndex: number;
  optionIndex: number;
  itemIndex: number;
}

/** Below this width meals sit side by side in a snap track, one per screen. */
const SWIPE_MEDIA = '(max-width: 767px)';

@Component({
  selector: 'app-diet-builder',
  standalone: true,
  imports: [...DIET_BUILDER_IMPORTS],
  templateUrl: './diet-builder.component.html',
  styleUrls: ['./diet-builder.component.scss'],
})
export class DietBuilderComponent implements OnChanges, OnDestroy {
  @Input() meals: Meal[] = [];
  @Input() selectedMealName = '';
  @Input() selectedOptionIndex = 0;

  @Output() itemRemoved = new EventEmitter<ItemIndices>();
  @Output() itemChanged = new EventEmitter<ItemIndices>();
  @Output() optionTargeted = new EventEmitter<{
    mealName: string;
    optionIndex: number;
  }>();
  @Output() optionAdded = new EventEmitter<number>();
  @Output() optionRemoved = new EventEmitter<{
    mealIndex: number;
    optionIndex: number;
  }>();
  @Output() mealNameChanged = new EventEmitter<{
    index: number;
    newName: string;
  }>();
  @Output() mealDeleted = new EventEmitter<number>();
  @Output() mealTargeted = new EventEmitter<string>();
  @Output() mealAdded = new EventEmitter<string>();

  editingMealIndex: number | null = null;
  editedMealName = '';

  addingMeal = false;
  newMealName = '';

  @ViewChild('mealsTrack') private mealsTrack?: ElementRef<HTMLElement>;
  private scrollSettleTimer?: ReturnType<typeof setTimeout>;

  constructor(
    private confirmationService: ConfirmationService,
    private i18nService: I18nService,
    private zone: NgZone,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedMealName'] || changes['meals']) {
      // Wait for the DOM to reflect new meals before scrolling.
      setTimeout(() => this.scrollTargetIntoView());
    }
  }

  ngOnDestroy(): void {
    clearTimeout(this.scrollSettleTimer);
  }

  private get isSwipeLayout(): boolean {
    return (
      typeof window !== 'undefined' && window.matchMedia(SWIPE_MEDIA).matches
    );
  }

  /** Phone: keep the target meal on screen when it changes elsewhere. */
  private scrollTargetIntoView(): void {
    const track = this.mealsTrack?.nativeElement;
    if (!track || !this.isSwipeLayout) return;
    const index = this.meals.findIndex((m) => m.name === this.selectedMealName);
    if (index < 0) return;
    const left = index * track.clientWidth;
    if (Math.abs(track.scrollLeft - left) < 4) return;
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    track.scrollTo({ left, behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  /** Phone: the meal a swipe settles on becomes the target. */
  onTrackScroll(): void {
    clearTimeout(this.scrollSettleTimer);
    this.scrollSettleTimer = setTimeout(() => {
      const track = this.mealsTrack?.nativeElement;
      if (!track || !this.isSwipeLayout || !track.clientWidth) return;
      // A scroll we started lands on the target itself, so it emits nothing.
      const index = Math.round(track.scrollLeft / track.clientWidth);
      const meal = this.meals[index];
      if (meal && meal.name !== this.selectedMealName) {
        this.zone.run(() => this.mealTargeted.emit(meal.name));
      }
    }, 120);
  }

  onItemInputChange(mealIndex: number, optionIndex: number, itemIndex: number): void {
    this.itemChanged.emit({ mealIndex, optionIndex, itemIndex });
  }

  removeFoodFromDiet(mealIndex: number, optionIndex: number, itemIndex: number): void {
    this.itemRemoved.emit({ mealIndex, optionIndex, itemIndex });
  }

  /** Option 1 lives in meal.items; options 2+ in meal.alternatives. */
  optionsOf(meal: Meal): DietItem[][] {
    return [meal.items, ...(meal.alternatives ?? []).map((o) => o.items)];
  }

  isTargetOption(meal: Meal, optionIndex: number): boolean {
    return meal.name === this.selectedMealName && optionIndex === this.selectedOptionIndex;
  }

  targetOption(meal: Meal, optionIndex: number): void {
    this.optionTargeted.emit({ mealName: meal.name, optionIndex });
  }

  removeOption(mealIndex: number, optionIndex: number): void {
    const meal = this.meals[mealIndex];
    const remove = () => this.optionRemoved.emit({ mealIndex, optionIndex });
    if (!optionItems(meal, optionIndex).length) {
      remove();
      return;
    }
    this.confirmationService.confirm({
      message: this.i18nService.t('confirm.deleteOption.message', {
        option: this.i18nService.t('builder.option', { n: optionIndex + 1 }),
        mealName: meal.name,
      }),
      header: this.i18nService.t('confirm.deleteOption.header'),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.i18nService.t('confirm.yes'),
      rejectLabel: this.i18nService.t('confirm.no'),
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: remove,
    });
  }

  getOptionKcal(items: DietItem[]): number {
    return items.reduce((total, item) => total + this.getItemKcal(item), 0);
  }

  startEditMeal(index: number, currentName: string): void {
    this.editingMealIndex = index;
    this.editedMealName = currentName;
  }

  cancelEditMeal(): void {
    this.editingMealIndex = null;
    this.editedMealName = '';
  }

  saveEditMeal(index: number): void {
    const newName = this.editedMealName.trim();
    if (newName && this.editingMealIndex === index) {
      this.mealNameChanged.emit({ index, newName });
      this.cancelEditMeal();
    } else {
      this.cancelEditMeal();
    }
  }

  startAddMeal(): void {
    this.addingMeal = true;
    this.newMealName = '';
  }

  confirmAddMeal(): void {
    const name = this.newMealName.trim();
    if (name) {
      this.mealAdded.emit(name);
    }
    this.cancelAddMeal();
  }

  cancelAddMeal(): void {
    this.addingMeal = false;
    this.newMealName = '';
  }

  deleteMeal(index: number): void {
    this.confirmationService.confirm({
      message: this.i18nService.t('confirm.deleteMeal.message', {
        mealName: this.meals[index]?.name || '',
      }),
      header: this.i18nService.t('confirm.deleteMeal.header'),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.i18nService.t('confirm.yes'),
      rejectLabel: this.i18nService.t('confirm.no'),
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this.mealDeleted.emit(index);
      },
    });
  }

  // Rotulo da medida com o peso equivalente, ex.: "fatia média (15 g)".
  // Calculado na exibicao para valer tambem em planos salvos/importados.
  measureLabel(item: DietItem, measure?: Measure): string {
    const m =
      measure ?? item.measures?.find((x) => x.measure_name === item.selectedMeasure);
    if (!m) return item.selectedMeasure;
    const name = m.measure_name;
    const isBase = name === 'grama' || name === 'mililitro';
    const hasAmount = /\d\s*(g|ml)\)/i.test(name);
    if (isBase || hasAmount || !m.gram_equivalent) return name;
    const unit = item.food?.unit === 'ml' ? 'mL' : 'g';
    const amount = Math.round(m.gram_equivalent * 10) / 10;
    return `${name} (${amount} ${unit})`;
  }

  getItemKcal(item: DietItem): number {
    if (typeof item?.kcal === 'number') return item.kcal;
    if (!item?.food || typeof item.quantityInGrams !== 'number') return 0;
    const quantityFactor = item.quantityInGrams / 100;
    return (item.food.energy_kcal || 0) * quantityFactor;
  }

  getMealKcal(meal: Meal): number {
    const hasApiItems =
      Array.isArray(meal?.items) &&
      meal.items.some((item) => typeof item?.kcal === 'number');
    if (typeof meal?.totalKcal === 'number' && (hasApiItems || !meal?.items)) {
      return meal.totalKcal;
    }
    if (!meal?.items?.length) return 0;
    return meal.items.reduce(
      (total, item) => total + this.getItemKcal(item),
      0,
    );
  }

  getMealMacros(meal: Meal): {
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  } {
    let protein = 0;
    let carbs = 0;
    let fat = 0;
    let fiber = 0;
    if (meal?.items?.length) {
      for (const item of meal.items) {
        if (!item?.food || typeof item.quantityInGrams !== 'number')
          continue;
        const quantityFactor = item.quantityInGrams / 100;
        protein += (item.food.protein_g || 0) * quantityFactor;
        carbs += (item.food.carbohydrate_g || 0) * quantityFactor;
        fat += (item.food.fat_g || 0) * quantityFactor;
        fiber += (item.food.fiber_g || 0) * quantityFactor;
      }
    }
    return {
      protein: Math.round(protein * 10) / 10,
      carbs: Math.round(carbs * 10) / 10,
      fat: Math.round(fat * 10) / 10,
      fiber: Math.round(fiber * 10) / 10,
    };
  }
}
