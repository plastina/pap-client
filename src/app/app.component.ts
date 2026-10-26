import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DividerModule } from 'primeng/divider';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { Textarea } from 'primeng/inputtextarea';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { EMPTY, Subject, Subscription } from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  switchMap,
} from 'rxjs/operators';
import { DietBuilderComponent } from './components/diet-builder/diet-builder.component';
import { MealManagementComponent } from './components/meal-management/meal-management.component';
import { PatientSectionComponent } from './components/patient-section/patient-section.component';
import { PlanSummaryComponent } from './components/plan-summary/plan-summary.component';
import { DietItem } from './models/diet-item.model';
import { Food } from './models/food.model';
import { Meal } from './models/meal.model';
import { Measure } from './models/measure.model';
import { PatientData } from './models/patient-data.model';
import {
  PlanCalculateRequest,
  PlanCalculateResponse,
} from './models/plan-calc.model';
import { PlanTotals } from './models/plan-totals.model';
import { TranslatePipe } from './pipes/t.pipe';
import { FoodApiService } from './services/food-api.service';
import { AppLanguage, I18nService } from './services/i18n.service';
import { PdfExportService } from './services/pdf-export.service';
import { Theme, ThemeService } from './services/theme.service';

/** Patient data as it comes back from JSON (dob is serialised as a string). */
type PersistedPatientData = Omit<PatientData, 'dob'> & {
  dob?: string | Date | null;
};

interface AutoSaveState {
  meals: Meal[];
  patientSessionData: PersistedPatientData;
  timestamp: string;
}

const IMPORTS = [
  FormsModule,
  CommonModule,
  ButtonModule,
  InputTextModule,
  Textarea,
  SelectModule,
  DividerModule,
  ToolbarModule,
  ToastModule,
  ProgressSpinnerModule,
  ConfirmDialogModule,
  InputNumberModule,
  AutoCompleteModule,
  TooltipModule,
  TranslatePipe,
  PatientSectionComponent,
  MealManagementComponent,
  DietBuilderComponent,
  PlanSummaryComponent,
];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [...IMPORTS],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [MessageService, ConfirmationService],
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  title = 'saas-nutri-frontend';
  meals: Meal[] = [];
  selectedMealName = '';
  patientSessionData: PatientData = {
    name: null,
    dob: null,
    goals: null,
    weight: null,
    height: null,
    observations: null,
  };

  foodSearchSuggestions: Food[] = [];
  selectedFoodAutoComplete: Food | string | null = null;
  isLoadingResults = false;
  patientPanelExpanded = true;

  totalKcal = 0;
  totalProtein = 0;
  totalCarbs = 0;
  totalFat = 0;
  totalFiber = 0;

  currentTheme: Theme = 'light';
  currentLanguage: AppLanguage = 'en';
  languageOptions: { label: string; value: AppLanguage; flag: string }[] = [];

  private readonly AUTOSAVE_STORAGE_KEY = 'saasNutri_autoSaveData_v1';
  private stateChanged = new Subject<void>();
  private autoSaveSubscription?: Subscription;
  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;
  private planCalcSubject = new Subject<void>();
  private planCalcSubscription?: Subscription;
  private planCalcItemIndexMap: number[][] = [];

  constructor(
    private foodApiService: FoodApiService,
    private messageService: MessageService,
    private pdfExportService: PdfExportService,
    private cdr: ChangeDetectorRef,
    private confirmationService: ConfirmationService,
    private themeService: ThemeService,
    private i18nService: I18nService,
  ) {}

  get hasItemsInAnyMeal(): boolean {
    return (
      this.meals.length > 0 && this.meals.some((meal) => meal.items.length > 0)
    );
  }

  ngOnInit(): void {
    this.currentLanguage = this.i18nService.currentLanguage;
    this.updateLanguageOptions();
    this.loadStateWithConfirmation();
    this.setupAutoSave();
    this.setupSearchDebounce();
    this.setupPlanCalcDebounce();
    if (this.meals.length === 0) {
      this.initializeDefaultMeals();
    }
    if (this.meals.length > 0 && !this.selectedMealName) {
      this.selectedMealName = this.meals[0].name;
    }
    this.syncPatientPanelState();
    // Initialize theme
    this.currentTheme = this.themeService.currentThemeValue;
  }

  ngAfterViewInit(): void {
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.autoSaveSubscription?.unsubscribe();
    this.searchSubscription?.unsubscribe();
    this.planCalcSubscription?.unsubscribe();
  }

  private initializeDefaultMeals(): void {
    this.meals = [
      { name: this.i18nService.t('meal.default.breakfast'), items: [] },
      { name: this.i18nService.t('meal.default.lunch'), items: [] },
      { name: this.i18nService.t('meal.default.dinner'), items: [] },
    ];
  }

  private setupAutoSave(): void {
    this.autoSaveSubscription = this.stateChanged
      .pipe(debounceTime(1500))
      .subscribe(() => this.saveStateToLocalStorage());
  }

  private setupSearchDebounce(): void {
    this.searchSubscription = this.searchSubject
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        switchMap((term) => {
          if (term.length < 3) {
            this.foodSearchSuggestions = [];
            return EMPTY;
          }
          this.isLoadingResults = true;
          return this.foodApiService.searchFoods(term).pipe(
            catchError((err) => {
              this.messageService.add({
                severity: 'error',
                summary: this.i18nService.t('toast.searchErrorSummary'),
                detail: err.message,
              });
              this.foodSearchSuggestions = [];
              this.isLoadingResults = false;
              return EMPTY;
            }),
          );
        }),
      )
      .subscribe((results) => {
        const suggestions = Array.isArray(results) ? results : [];
        this.foodSearchSuggestions = suggestions;
        this.isLoadingResults = false;
        if (suggestions.length === 0) {
          this.messageService.add({
            severity: 'info',
            summary: this.i18nService.t('toast.noResultsSummary'),
            detail: this.i18nService.t('toast.noResultsDetail'),
          });
        }
      });
  }

  private setupPlanCalcDebounce(): void {
    this.planCalcSubscription = this.planCalcSubject
      .pipe(
        debounceTime(300),
        switchMap(() => {
          const payload = this.buildPlanCalculatePayload();
          if (!payload) return EMPTY;
          return this.foodApiService.calculatePlanCalories(payload).pipe(
            catchError((err) => {
              console.error('Error calculating calories:', err);
              return EMPTY;
            }),
          );
        }),
      )
      .subscribe((response) => {
        this.applyPlanCalories(response);
      });
  }

  private saveStateToLocalStorage(): void {
    try {
      const stateToSave = {
        meals: this.meals,
        patientSessionData: this.patientSessionData,
        timestamp: new Date().toISOString(),
      };
      const stateString = JSON.stringify(stateToSave);
      localStorage.setItem(this.AUTOSAVE_STORAGE_KEY, stateString);
    } catch (error) {
      console.error('Error saving state:', error);
    }
  }

  private loadStateFromLocalStorage(): AutoSaveState | null {
    try {
      const savedStateString = localStorage.getItem(this.AUTOSAVE_STORAGE_KEY);
      if (savedStateString) {
        const savedState = JSON.parse(savedStateString) as Partial<AutoSaveState>;
        if (savedState && savedState.meals && savedState.patientSessionData) {
          return savedState as AutoSaveState;
        }
      }
    } catch (error) {
      console.error('Error reading state:', error);
    }
    return null;
  }

  private loadStateWithConfirmation(): void {
    const savedState = this.loadStateFromLocalStorage();
    if (savedState) {
      const savedTimestamp = new Date(savedState.timestamp);
      this.confirmationService.confirm({
        acceptButtonStyleClass: 'restore-work-accept-btn',
        rejectButtonStyleClass: 'restore-work-reject-btn',
        message: this.i18nService.t('confirm.restore.message', {
          date: savedTimestamp.toLocaleDateString(),
          time: savedTimestamp.toLocaleTimeString(),
        }),
        header: this.i18nService.t('confirm.restore.header'),
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: this.i18nService.t('confirm.yes'),
        rejectLabel: this.i18nService.t('confirm.no'),
        accept: () => {
          this.meals = savedState.meals;
          this.patientSessionData = this.parsePatientDataOnLoad(
            savedState.patientSessionData,
          );
          this.selectedMealName =
            this.meals.length > 0 ? this.meals[0].name : '';
          this.syncPatientPanelState();
          this.calculateTotals();
          this.messageService.add({
            severity: 'info',
            summary: this.i18nService.t('toast.restoreDoneSummary'),
            detail: this.i18nService.t('toast.restoreDoneDetail'),
          });
          this.triggerStateChange();
          this.triggerPlanCalc();
        },
        reject: () => {
          this.clearAutoSavedState();
          if (this.meals.length === 0) {
            this.initializeDefaultMeals();
          }
        },
      });
    }
  }

  private parsePatientDataOnLoad(
    data: PersistedPatientData | null | undefined,
  ): PatientData {
    const fallback: PatientData = {
      name: null,
      dob: null,
      goals: null,
      weight: null,
      height: null,
      observations: null,
    };
    if (!data) return fallback;

    let dob: Date | null = null;
    if (typeof data.dob === 'string') {
      const parsed = new Date(data.dob);
      dob = Number.isNaN(parsed.getTime()) ? null : parsed;
    } else if (data.dob instanceof Date) {
      dob = data.dob;
    }
    return { ...fallback, ...data, dob };
  }

  /** Collapse the patient panel once a patient name exists; keep it open otherwise. */
  private syncPatientPanelState(): void {
    this.patientPanelExpanded = !this.patientSessionData?.name?.trim();
  }

  triggerStateChange(): void {
    this.stateChanged.next();
  }
  clearAutoSavedState(): void {
    localStorage.removeItem(this.AUTOSAVE_STORAGE_KEY);
  }

  addMeal(name: string): void {
    const mealName = name.trim();
    if (!mealName) return;
    const exists = this.meals.some(
      (m) => m.name.toLowerCase() === mealName.toLowerCase(),
    );
    if (exists) {
      this.messageService.add({
        severity: 'warn',
        summary: this.i18nService.t('toast.warning'),
        detail: this.i18nService.t('toast.mealExists', { mealName }),
      });
      return;
    }
    this.meals = [...this.meals, { name: mealName, items: [] }];
    this.selectedMealName = mealName;
    this.messageService.add({
      severity: 'success',
      summary: this.i18nService.t('toast.success'),
      detail: this.i18nService.t('toast.mealAdded', { mealName }),
    });
    this.triggerStateChange();
    this.triggerPlanCalc();
  }

  handleMealNameChange(event: { index: number; newName: string }): void {
    const currentName = this.meals[event.index]?.name;
    const updatedMeals = this.meals.map((meal, index) =>
      index === event.index ? { ...meal, name: event.newName } : meal,
    );
    this.meals = updatedMeals;
    if (this.selectedMealName === currentName) {
      this.selectedMealName = event.newName;
    }
    this.triggerStateChange();
    this.triggerPlanCalc();
  }

  handleMealDelete(indexToRemove: number): void {
    const mealNameToDelete = this.meals[indexToRemove]?.name;
    this.meals = this.meals.filter((_, index) => index !== indexToRemove);
    if (this.selectedMealName === mealNameToDelete) {
      this.selectedMealName = this.meals.length > 0 ? this.meals[0].name : '';
    }
    this.calculateTotals();
    this.triggerStateChange();
    this.triggerPlanCalc();
  }

  onPatientDataChange(): void {
    this.triggerStateChange();
  }

  searchFoodsByTerm(query: string): void {
    this.searchSubject.next(query);
  }

  addFoodToActiveMeal(food: Food): void {
    if (!food || typeof food !== 'object' || !food.id) return;

    const targetMeal = this.meals.find((m) => m.name === this.selectedMealName);
    this.selectedFoodAutoComplete = '';
    this.foodSearchSuggestions = [];

    if (!targetMeal) {
      this.messageService.add({
        severity: 'warn',
        summary: this.i18nService.t('toast.warning'),
        detail: this.i18nService.t('toast.targetMealNotFound'),
      });
      return;
    }
    if (!Array.isArray(targetMeal.items)) {
      targetMeal.items = [];
    }

    const pushItem = (measures: Measure[]): void => {
      const newItem: DietItem = {
        food,
        displayQuantity: 100,
        selectedMeasure: this.baseMeasureName(food),
        quantityInGrams: 100,
        measures,
      };
      targetMeal.items.push(newItem);
      this.calculateTotals();
      this.triggerStateChange();
      this.triggerPlanCalc();
      this.messageService.add({
        severity: 'success',
        summary: this.i18nService.t('toast.success'),
        detail: this.i18nService.t('toast.foodAdded', {
          foodName: food.name,
          mealName: targetMeal.name,
        }),
      });
    };

    this.foodApiService.getFoodMeasures(food.id).subscribe({
      next: (measures) => pushItem(this.normalizeMeasures(measures, food)),
      error: (err) => {
        this.messageService.add({
          severity: 'warn',
          summary: this.i18nService.t('toast.measureErrorSummary'),
          detail:
            err.message || this.i18nService.t('toast.measureErrorDetail'),
        });
        pushItem([this.baseMeasure(food)]);
      },
    });
  }

  private baseMeasureName(food: Food): string {
    return food.unit === 'ml' ? 'mililitro' : 'grama';
  }

  private baseMeasure(food: Food): Measure {
    return food.unit === 'ml'
      ? { measure_name: 'mililitro', display_name: 'Mililitro', gram_equivalent: 1 }
      : { measure_name: 'grama', display_name: 'Gram', gram_equivalent: 1 };
  }

  private isBaseMeasure(name: string): boolean {
    return name === 'grama' || name === 'mililitro';
  }

  private normalizeMeasures(measures: Measure[], food: Food): Measure[] {
    const base = this.baseMeasure(food);
    const hasBase = measures.some((m) => m.measure_name === base.measure_name);
    const allMeasures = hasBase ? measures : [base, ...measures];
    return allMeasures.filter(
      (m, index, arr) =>
        arr.findIndex((x) => x.measure_name === m.measure_name) === index,
    );
  }

  updateGrams(item: DietItem): void {
    const selectedMeasureData = item.measures.find(
      (m) => m.measure_name === item.selectedMeasure,
    );
    if (this.isBaseMeasure(item.selectedMeasure) || !selectedMeasureData) {
      item.quantityInGrams = item.displayQuantity;
    } else {
      item.quantityInGrams =
        item.displayQuantity * selectedMeasureData.gram_equivalent;
    }
    item.quantityInGrams = Math.round(item.quantityInGrams * 10) / 10;
  }

  handleItemChange(indices: { mealIndex: number; itemIndex: number }): void {
    console.log('handleItemChange chamado', indices);
    const item = this.meals[indices.mealIndex]?.items[indices.itemIndex];
    if (item) {
      this.updateGrams(item);
      this.calculateTotals();
      this.triggerStateChange();
      this.triggerPlanCalc();
    }
  }

  handleRemoveFood(indices: { mealIndex: number; itemIndex: number }): void {
    if (this.meals[indices.mealIndex]?.items) {
      this.meals[indices.mealIndex].items.splice(indices.itemIndex, 1);
      this.calculateTotals();
      this.triggerStateChange();
      this.triggerPlanCalc();
    }
  }

  private calculateTotals(): void {
    this.totalKcal = 0;
    this.totalProtein = 0;
    this.totalCarbs = 0;
    this.totalFat = 0;
    this.totalFiber = 0;
    if (!this.meals) return;
    for (const meal of this.meals) {
      if (!meal || !Array.isArray(meal.items)) continue;
      for (const item of meal.items) {
        if (!item || !item.food || typeof item.quantityInGrams !== 'number')
          continue;
        const quantityFactor = item.quantityInGrams / 100;
        this.totalKcal += (item.food.energy_kcal || 0) * quantityFactor;
        this.totalProtein += (item.food.protein_g || 0) * quantityFactor;
        this.totalCarbs += (item.food.carbohydrate_g || 0) * quantityFactor;
        this.totalFat += (item.food.fat_g || 0) * quantityFactor;
        this.totalFiber += (item.food.fiber_g || 0) * quantityFactor;
      }
    }
    this.totalKcal = Math.round(this.totalKcal);
    this.totalProtein = Math.round(this.totalProtein * 10) / 10;
    this.totalCarbs = Math.round(this.totalCarbs * 10) / 10;
    this.totalFat = Math.round(this.totalFat * 10) / 10;
    this.totalFiber = Math.round(this.totalFiber * 10) / 10;
  }

  private triggerPlanCalc(): void {
    this.planCalcSubject.next();
  }

  private buildPlanCalculatePayload(): PlanCalculateRequest | null {
    if (!this.meals || this.meals.length === 0) return null;

    this.planCalcItemIndexMap = [];
    const mealsPayload = this.meals.map((meal, mealIndex) => {
      const itemIndexMap: number[] = [];
      const itemsPayload = (meal.items || [])
        .map((item, itemIndex) => {
          if (!item?.food?.id) {
            item.kcal = 0;
            return null;
          }
          itemIndexMap.push(itemIndex);
          return {
            food_id: item.food.id,
            quantity_in_grams: item.quantityInGrams || 0,
          };
        })
        .filter((item) => item !== null);

      this.planCalcItemIndexMap[mealIndex] = itemIndexMap;
      return {
        name: meal.name,
        items: itemsPayload as { food_id: string; quantity_in_grams: number }[],
      };
    });

    const hasItems = mealsPayload.some((meal) => meal.items.length > 0);
    if (!hasItems) {
      this.meals.forEach((meal) => {
        meal.totalKcal = 0;
        meal.items.forEach((item) => {
          item.kcal = 0;
        });
      });
      return null;
    }

    return { meals: mealsPayload };
  }

  private applyPlanCalories(response: PlanCalculateResponse): void {
    if (
      !response ||
      !response.meals ||
      !Array.isArray(response.meals) ||
      response.meals.length === 0
    )
      return;

    response.meals.forEach((mealResponse, mealIndex) => {
      const targetMeal = this.meals[mealIndex];
      if (!targetMeal) return;

      targetMeal.totalKcal = mealResponse.total_kcal;
      const itemIndexMap = this.planCalcItemIndexMap[mealIndex] || [];
      if (!mealResponse.items) mealResponse.items = [];
      mealResponse.items.forEach((itemResponse, itemIndex) => {
        const targetItemIndex = itemIndexMap[itemIndex];
        const targetItem = targetMeal.items[targetItemIndex];
        if (!targetItem) return;
        targetItem.kcal = itemResponse.kcal;
      });
    });

    if (typeof response.total_kcal === 'number') {
      this.totalKcal = Math.round(response.total_kcal);
    }
  }

  handleFileInput(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    if (!input?.files?.length) {
      if (input) input.value = '';
      return;
    }
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const content = reader.result as string;
        const importedData = JSON.parse(content);
        let importedMeals: Meal[] = [];
        let importedPatientData: PatientData | null = null;
        if (
          importedData &&
          typeof importedData === 'object' &&
          !Array.isArray(importedData) &&
          importedData.meals &&
          importedData.patientSessionData
        ) {
          if (!Array.isArray(importedData.meals))
            throw new Error('Invalid: "meals" is not an array.');
          if (
            typeof importedData.patientSessionData !== 'object' ||
            importedData.patientSessionData === null
          )
            throw new Error('Invalid: "patientSessionData" is not an object.');
          importedMeals = importedData.meals as Meal[];
          importedPatientData = importedData.patientSessionData as PatientData;
        } else if (Array.isArray(importedData)) {
          importedMeals = importedData as Meal[];
          importedPatientData = null;
          this.messageService.add({
            severity: 'info',
            summary: this.i18nService.t('toast.warning'),
            detail: this.i18nService.t('toast.importLegacy'),
            life: 4000,
          });
        } else {
          throw new Error('Invalid JSON file: unknown format.');
        }
        this.meals = importedMeals;
        this.patientSessionData =
          this.parsePatientDataOnLoad(importedPatientData);
        this.selectedMealName = this.meals.length > 0 ? this.meals[0].name : '';
        this.syncPatientPanelState();
        this.calculateTotals();
        this.triggerStateChange();
        this.triggerPlanCalc();
        this.messageService.add({
          severity: 'success',
          summary: this.i18nService.t('toast.success'),
          detail: this.i18nService.t('toast.importSuccess'),
          life: 3000,
        });
      } catch (error: unknown) {
        let errorMessage = 'Unknown error while processing file.';
        if (error instanceof Error) errorMessage = error.message;
        this.messageService.add({
          severity: 'error',
          summary: this.i18nService.t('toast.importErrorSummary'),
          detail: errorMessage,
          life: 5000,
        });
      } finally {
        if (input) input.value = '';
      }
    };
    reader.onerror = () => {
      this.messageService.add({
        severity: 'error',
        summary: this.i18nService.t('toast.importReadErrorSummary'),
        detail: this.i18nService.t('toast.importReadErrorDetail'),
        life: 5000,
      });
      if (input) input.value = '';
    };
    reader.readAsText(file);
  }

  exportToJson(): void {
    const hasPatientName = !!this.patientSessionData?.name?.trim();
    const hasItems = this.hasItemsInAnyMeal;
    if (!hasPatientName && !hasItems) {
      this.messageService.add({
        severity: 'warn',
        summary: this.i18nService.t('toast.warning'),
        detail: this.i18nService.t('toast.exportNothing'),
      });
      return;
    }
    const stateToExport = {
      patientSessionData: this.patientSessionData,
      meals: this.meals,
    };
    const jsonString = JSON.stringify(stateToExport, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    let fileName = 'meal-plan.json';
    if (hasPatientName && this.patientSessionData.name) {
      const safeName = this.patientSessionData.name
        .trim()
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9_.-]/g, '');
      fileName = `meal-plan-${safeName || 'patient'}.json`;
    }
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.messageService.add({
      severity: 'success',
      summary: this.i18nService.t('toast.success'),
      detail: this.i18nService.t('toast.exportSuccess', { fileName }),
    });
  }

  exportPlanToPdf(): void {
    if (!this.hasItemsInAnyMeal) {
      this.messageService.add({
        severity: 'warn',
        summary: this.i18nService.t('toast.warning'),
        detail: this.i18nService.t('toast.pdfNoItems'),
      });
      return;
    }
    this.calculateTotals();
    const currentTotals: PlanTotals = {
      totalKcal: this.totalKcal,
      totalProtein: this.totalProtein,
      totalCarbs: this.totalCarbs,
      totalFat: this.totalFat,
      totalFiber: this.totalFiber,
    };
    const currentPatientData: PatientData | undefined = this.patientSessionData
      ?.name
      ? this.patientSessionData
      : undefined;
    this.pdfExportService.generateDietPlanPdf(
      this.meals,
      currentTotals,
      currentPatientData,
    );
    this.messageService.add({
      severity: 'success',
      summary: this.i18nService.t('toast.success'),
      detail: this.i18nService.t('toast.pdfSuccess'),
    });
  }

  changeLanguage(language: AppLanguage): void {
    this.i18nService.setLanguage(language);
    this.currentLanguage = language;
    this.updateLanguageOptions();
  }

  private updateLanguageOptions(): void {
    this.languageOptions = [
      {
        label: this.i18nService.t('language.pt-BR'),
        value: 'pt-BR',
        flag: '🇧🇷',
      },
      {
        label: this.i18nService.t('language.en'),
        value: 'en',
        flag: '🇺🇸',
      },
      {
        label: this.i18nService.t('language.fr'),
        value: 'fr',
        flag: '🇫🇷',
      },
    ];
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
    this.currentTheme = this.themeService.currentThemeValue;
  }
}
