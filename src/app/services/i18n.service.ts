import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type AppLanguage = 'pt-BR' | 'en' | 'fr';

type TranslationParams = Record<string, string | number>;

const STORAGE_KEY = 'saasNutri_language_v1';

const TRANSLATIONS: Record<AppLanguage, Record<string, string>> = {
  'pt-BR': {
    'header.title': 'Plano Alimentar Personalizado',
    'header.subtitle':
      'Fluxo nutricional com foco no acompanhamento do paciente e na prescrição alimentar.',
    'header.autosave': 'Salvamento automático',
    'header.progress.inProgress': 'Acompanhamento em curso',
    'header.progress.new': 'Nova avaliação',
    'header.actions': 'Ações do plano',
    'header.themeToggle': 'Alternar tema',
    'header.exportJson': 'Exportar JSON',
    'header.exportJsonTooltip': 'Exportar plano como JSON',
    'header.importJson': 'Importar JSON',
    'header.importJsonTooltip': 'Importar plano de arquivo JSON',
    'header.languageAria': 'Selecionar idioma',
    'board.patient': 'Paciente',
    'board.unnamedPatient': 'Paciente sem nome',
    'board.addingTo': 'Adicionando em',
    'board.energy': 'Energia',
    'board.protShort': 'Prot',
    'board.carbShort': 'Carb',
    'board.fatShort': 'Gord',
    'board.fiberShort': 'Fibra',
    'builder.colFood': 'Alimento',
    'builder.colKcal': 'kcal',
    'builder.mealPosition': 'Refeição {current} de {total}',

    'language.pt-BR': 'Português (Brasil)',
    'language.en': 'English',
    'language.fr': 'Francês',

    'meal.section.title': 'Refeições',
    'meal.default.breakfast': 'Café da manhã',
    'meal.default.lunch': 'Almoço',
    'meal.default.dinner': 'Jantar',
    'meal.new.placeholder': 'Nova refeição',
    'meal.add': 'Adicionar',
    'meal.addAria': 'Adicionar refeição',
    'meal.search.title': 'Adicionar alimento',
    'meal.search.placeholder': 'Ex: arroz, feijão, maçã...',
    'meal.search.target': 'adiciona em {mealName}',
    'meal.search.noTarget': 'crie uma refeição para começar',

    'patient.title': 'Dados do paciente',
    'patient.name': 'Nome',
    'patient.weight': 'Peso (kg)',
    'patient.height': 'Altura (cm)',
    'patient.dob': 'Data de nascimento',
    'patient.goals': 'Objetivos',
    'patient.observations': 'Observações',
    'patient.toggleAria': 'Mostrar ou ocultar dados do paciente',
    'patient.ageSuffix': 'anos',

    'summary.currentPlan': 'Plano alimentar atual',
    'summary.totals': 'Totais do plano',
    'summary.calories': 'Calorias',
    'summary.protein': 'Proteínas',
    'summary.carbs': 'Carboidratos',
    'summary.fat': 'Gorduras',
    'summary.fiber': 'Fibras',
    'summary.totalMeals': 'Total de refeições',
    'summary.empty':
      'Adicione alimentos às refeições para ver os totais nutricionais.',
    'summary.exportPdf': 'Exportar PDF',
    'summary.exportPdfTooltip': 'Exportar plano completo como PDF',

    'builder.editMeal': 'Editar nome da refeição',
    'builder.deleteMeal': 'Excluir refeição',
    'builder.edit': 'Editar',
    'builder.delete': 'Excluir',
    'builder.newName': 'Novo nome',
    'builder.save': 'Salvar',
    'builder.saveNewName': 'Salvar novo nome',
    'builder.cancel': 'Cancelar',
    'builder.cancelEdit': 'Cancelar edição',
    'builder.measure': 'Medida',
    'builder.quantity': 'Quantidade',
    'builder.removeItem': 'Remover item',
    'builder.emptyMeal': 'Refeição vazia.',
    'builder.noMeals': 'Nenhuma refeição adicionada ainda.',
    'builder.useAsTarget': 'Usar como alvo',
    'builder.useAsTargetAria': 'Definir {mealName} como refeição de destino da busca',
    'builder.currentTarget': 'Alvo da busca',
    'builder.addMeal': 'Adicionar refeição',

    'confirm.deleteMeal.message':
      'Tem certeza de que deseja excluir a refeição "{mealName}" e todos os seus itens?',
    'confirm.deleteMeal.header': 'Confirmar exclusão',
    'confirm.yes': 'Sim',
    'confirm.no': 'Não',

    'confirm.restore.message':
      'Encontramos um trabalho não salvo de {date} {time}. Deseja restaurá-lo?',
    'confirm.restore.header': 'Restaurar trabalho?',

    'toast.warning': 'Atenção',
    'toast.success': 'Sucesso',
    'toast.error': 'Erro',
    'toast.info': 'Informação',

    'toast.searchErrorSummary': 'Erro de busca',
    'toast.noResultsSummary': 'Nenhum resultado',
    'toast.noResultsDetail': 'Nenhum alimento encontrado.',

    'toast.mealExists': 'Refeição "{mealName}" já existe.',
    'toast.mealAdded': 'Refeição "{mealName}" adicionada!',
    'toast.targetMealNotFound': 'Refeição de destino não encontrada.',
    'toast.foodAdded': '{foodName} adicionado a {mealName}.',

    'toast.measureErrorSummary': 'Erro ao carregar medidas',
    'toast.measureErrorDetail':
      'Não foi possível carregar as medidas caseiras.',

    'toast.importLegacy': 'Formato antigo importado (apenas refeições).',
    'toast.importSuccess': 'Plano importado!',
    'toast.importErrorSummary': 'Falha na importação',
    'toast.importReadErrorSummary': 'Erro de leitura',
    'toast.importReadErrorDetail': 'Não foi possível ler o arquivo.',

    'toast.exportNothing': 'Nada para exportar.',
    'toast.exportSuccess': 'Plano exportado para {fileName}!',

    'toast.pdfNoItems': 'Não há itens para gerar PDF.',
    'toast.pdfSuccess': 'PDF gerado!',
    'builder.option': 'Opção {n}',
    'builder.addOption': 'Adicionar opção',
    'builder.removeOption': 'Remover opção',
    'builder.optionCounts': 'conta nos totais',
    'confirm.deleteOption.header': 'Remover opção',
    'confirm.deleteOption.message': 'Remover a {option} de {mealName} e os alimentos dela?',
    'pdf.optionLabel': 'Opção {n}:',
    'pdf.optionNote': 'Os totais consideram a Opção 1 de cada refeição.',

    'pdf.planTitle': 'Planejamento alimentar',
    'pdf.guidance': 'Orientações nutricionais',
    'pdf.summary': 'Resumo nutricional',
    'pdf.factsTitle': 'Informação nutricional',
    'pdf.factsSubtitle': 'Plano diário · {count} refeições',
    'pdf.perDay': 'por dia',
    'pdf.energyShare': '% energia',
    'pdf.energy': 'Valor energético',
    'pdf.protein': 'Proteínas',
    'pdf.carbs': 'Carboidratos',
    'pdf.fat': 'Gorduras',
    'pdf.fiber': 'Fibras',
    'pdf.byMeal': 'Por refeição',
    'pdf.fileName': 'plano-alimentar',
    'pdf.defaultTitle': 'Nutricionista',
    'professional.title': 'Profissional',
    'professional.toggleAria': 'Mostrar ou ocultar dados do profissional',
    'professional.empty': 'Preencha para assinar o PDF',
    'professional.name': 'Nome',
    'professional.jobTitle': 'Título',
    'professional.crn': 'CRN',
    'professional.crnPlaceholder': 'Ex.: CRN-4 12345',
    'professional.phone': 'Telefone',
    'professional.email': 'E-mail',
    'professional.logo': 'Logo',
    'professional.logoUpload': 'Enviar logo',
    'professional.logoReplace': 'Trocar logo',
    'professional.logoRemove': 'Remover',
    'professional.logoHint': 'Sem logo, o PDF usa um monograma com as suas iniciais.',
    'professional.palette': 'Cores do PDF',
    'professional.palette.salvia': 'Sálvia',
    'professional.palette.oceano': 'Oceano',
    'professional.palette.terracota': 'Terracota',
    'professional.palette.grafite': 'Grafite',
    'professional.includeSummary': 'Incluir página de resumo nutricional no PDF',
    'toast.pdfError': 'Não foi possível gerar o PDF. Verifique a conexão e tente de novo.',
    'toast.logoError': 'Não foi possível ler a imagem. Use um PNG ou JPG.',

    'toast.restoreDoneSummary': 'Restaurado',
    'toast.restoreDoneDetail': 'Trabalho anterior restaurado.',
  },
  en: {
    'header.title': 'Plano Alimentar Personalizado',
    'header.subtitle':
      'Nutrition workflow focused on patient follow-up and meal prescription.',
    'header.autosave': 'Record autosaved',
    'header.progress.inProgress': 'Follow-up in progress',
    'header.progress.new': 'New assessment',
    'header.actions': 'Plan actions',
    'header.themeToggle': 'Toggle theme',
    'header.exportJson': 'Export JSON',
    'header.exportJsonTooltip': 'Export plan as JSON',
    'header.importJson': 'Import JSON',
    'header.importJsonTooltip': 'Import plan from JSON file',
    'header.languageAria': 'Select language',
    'board.patient': 'Patient',
    'board.unnamedPatient': 'Unnamed patient',
    'board.addingTo': 'Adding to',
    'board.energy': 'Energy',
    'board.protShort': 'Prot',
    'board.carbShort': 'Carb',
    'board.fatShort': 'Fat',
    'board.fiberShort': 'Fiber',
    'builder.colFood': 'Food',
    'builder.colKcal': 'kcal',
    'builder.mealPosition': 'Meal {current} of {total}',

    'language.pt-BR': 'Portuguese (Brazil)',
    'language.en': 'English',
    'language.fr': 'French',

    'meal.section.title': 'Meals',
    'meal.default.breakfast': 'Breakfast',
    'meal.default.lunch': 'Lunch',
    'meal.default.dinner': 'Dinner',
    'meal.new.placeholder': 'New meal',
    'meal.add': 'Add',
    'meal.addAria': 'Add meal',
    'meal.search.title': 'Add food',
    'meal.search.placeholder': 'Eg: rice, beans, apple...',
    'meal.search.target': 'adds to {mealName}',
    'meal.search.noTarget': 'create a meal to start',

    'patient.title': 'Patient data',
    'patient.name': 'Name',
    'patient.weight': 'Weight (kg)',
    'patient.height': 'Height (cm)',
    'patient.dob': 'Date of birth',
    'patient.goals': 'Goals',
    'patient.observations': 'Observations',
    'patient.toggleAria': 'Show or hide patient data',
    'patient.ageSuffix': 'yrs',

    'summary.currentPlan': 'Current meal plan',
    'summary.totals': 'Plan totals',
    'summary.calories': 'Calories',
    'summary.protein': 'Protein',
    'summary.carbs': 'Carbohydrates',
    'summary.fat': 'Fat',
    'summary.fiber': 'Fiber',
    'summary.totalMeals': 'Total meals',
    'summary.empty': 'Add foods to meals to view nutrition totals.',
    'summary.exportPdf': 'Export PDF',
    'summary.exportPdfTooltip': 'Export full plan as PDF',

    'builder.editMeal': 'Edit meal name',
    'builder.deleteMeal': 'Delete meal',
    'builder.edit': 'Edit',
    'builder.delete': 'Delete',
    'builder.newName': 'New name',
    'builder.save': 'Save',
    'builder.saveNewName': 'Save new name',
    'builder.cancel': 'Cancel',
    'builder.cancelEdit': 'Cancel editing',
    'builder.measure': 'Measure',
    'builder.quantity': 'Quantity',
    'builder.removeItem': 'Remove item',
    'builder.emptyMeal': 'Empty meal.',
    'builder.noMeals': 'No meals added yet.',
    'builder.useAsTarget': 'Use as target',
    'builder.useAsTargetAria': 'Set {mealName} as the search target meal',
    'builder.currentTarget': 'Search target',
    'builder.addMeal': 'Add meal',

    'confirm.deleteMeal.message':
      'Are you sure you want to delete meal "{mealName}" and all its items?',
    'confirm.deleteMeal.header': 'Confirm deletion',
    'confirm.yes': 'Yes',
    'confirm.no': 'No',

    'confirm.restore.message':
      'We found unsaved work from {date} {time}. Do you want to restore it?',
    'confirm.restore.header': 'Restore work?',

    'toast.warning': 'Warning',
    'toast.success': 'Success',
    'toast.error': 'Error',
    'toast.info': 'Info',

    'toast.searchErrorSummary': 'Search error',
    'toast.noResultsSummary': 'No results',
    'toast.noResultsDetail': 'No food found.',

    'toast.mealExists': 'Meal "{mealName}" already exists.',
    'toast.mealAdded': 'Meal "{mealName}" added!',
    'toast.targetMealNotFound': 'Target meal not found.',
    'toast.foodAdded': '{foodName} added to {mealName}.',

    'toast.measureErrorSummary': 'Measure load error',
    'toast.measureErrorDetail': 'Could not load household measures.',

    'toast.importLegacy': 'Legacy format imported (meals only).',
    'toast.importSuccess': 'Plan imported!',
    'toast.importErrorSummary': 'Import failed',
    'toast.importReadErrorSummary': 'Read error',
    'toast.importReadErrorDetail': 'Could not read the file.',

    'toast.exportNothing': 'Nothing to export.',
    'toast.exportSuccess': 'Plan exported to {fileName}!',

    'toast.pdfNoItems': 'There are no items to generate a PDF.',
    'toast.pdfSuccess': 'PDF generated!',
    'builder.option': 'Option {n}',
    'builder.addOption': 'Add option',
    'builder.removeOption': 'Remove option',
    'builder.optionCounts': 'counts in totals',
    'confirm.deleteOption.header': 'Remove option',
    'confirm.deleteOption.message': 'Remove {option} from {mealName} and its foods?',
    'pdf.optionLabel': 'Option {n}:',
    'pdf.optionNote': 'Totals use option 1 of each meal.',

    'pdf.planTitle': 'Meal plan',
    'pdf.guidance': 'Nutrition guidance',
    'pdf.summary': 'Nutrition summary',
    'pdf.factsTitle': 'Nutrition facts',
    'pdf.factsSubtitle': 'Daily plan · {count} meals',
    'pdf.perDay': 'per day',
    'pdf.energyShare': '% energy',
    'pdf.energy': 'Energy',
    'pdf.protein': 'Protein',
    'pdf.carbs': 'Carbohydrates',
    'pdf.fat': 'Fat',
    'pdf.fiber': 'Fibre',
    'pdf.byMeal': 'By meal',
    'pdf.fileName': 'meal-plan',
    'pdf.defaultTitle': 'Nutritionist',
    'professional.title': 'Professional',
    'professional.toggleAria': 'Show or hide professional details',
    'professional.empty': 'Fill in to sign the PDF',
    'professional.name': 'Name',
    'professional.jobTitle': 'Title',
    'professional.crn': 'Professional registration',
    'professional.crnPlaceholder': 'E.g. HCPC DT012345',
    'professional.phone': 'Phone',
    'professional.email': 'Email',
    'professional.logo': 'Logo',
    'professional.logoUpload': 'Upload logo',
    'professional.logoReplace': 'Replace logo',
    'professional.logoRemove': 'Remove',
    'professional.logoHint': 'Without a logo, the PDF shows a monogram of your initials.',
    'professional.palette': 'PDF colours',
    'professional.palette.salvia': 'Sage',
    'professional.palette.oceano': 'Ocean',
    'professional.palette.terracota': 'Terracotta',
    'professional.palette.grafite': 'Graphite',
    'professional.includeSummary': 'Add a nutrition summary page to the PDF',
    'toast.pdfError': 'Could not generate the PDF. Check your connection and try again.',
    'toast.logoError': 'Could not read the image. Use a PNG or JPG.',

    'toast.restoreDoneSummary': 'Restored',
    'toast.restoreDoneDetail': 'Previous work restored.',
  },
  fr: {
    'header.title': 'Plano Alimentar Personalizado',
    'header.subtitle':
      'Flux nutritionnel axe sur le suivi du patient et la prescription alimentaire.',
    'header.autosave': 'Dossier enregistre automatiquement',
    'header.progress.inProgress': 'Suivi en cours',
    'header.progress.new': 'Nouvelle evaluation',
    'header.actions': 'Actions du plan',
    'header.themeToggle': 'Changer de theme',
    'header.exportJson': 'Exporter JSON',
    'header.exportJsonTooltip': 'Exporter le plan en JSON',
    'header.importJson': 'Importer JSON',
    'header.importJsonTooltip': 'Importer un plan depuis un fichier JSON',
    'header.languageAria': 'Selectionner la langue',
    'board.patient': 'Patient',
    'board.unnamedPatient': 'Patient sans nom',
    'board.addingTo': 'Ajout dans',
    'board.energy': 'Energie',
    'board.protShort': 'Prot',
    'board.carbShort': 'Gluc',
    'board.fatShort': 'Lip',
    'board.fiberShort': 'Fibres',
    'builder.colFood': 'Aliment',
    'builder.colKcal': 'kcal',
    'builder.mealPosition': 'Repas {current} sur {total}',

    'language.pt-BR': 'Portugais (Bresil)',
    'language.en': 'Anglais',
    'language.fr': 'Francais',

    'meal.section.title': 'Repas',
    'meal.default.breakfast': 'Petit-dejeuner',
    'meal.default.lunch': 'Dejeuner',
    'meal.default.dinner': 'Diner',
    'meal.new.placeholder': 'Nouveau repas',
    'meal.add': 'Ajouter',
    'meal.addAria': 'Ajouter un repas',
    'meal.search.title': 'Ajouter un aliment',
    'meal.search.placeholder': 'Ex: riz, haricots, pomme...',
    'meal.search.target': 'ajoute a {mealName}',
    'meal.search.noTarget': 'creez un repas pour commencer',

    'patient.title': 'Donnees du patient',
    'patient.name': 'Nom',
    'patient.weight': 'Poids (kg)',
    'patient.height': 'Taille (cm)',
    'patient.dob': 'Date de naissance',
    'patient.goals': 'Objectifs',
    'patient.observations': 'Observations',
    'patient.toggleAria': 'Afficher ou masquer les donnees du patient',
    'patient.ageSuffix': 'ans',

    'summary.currentPlan': 'Plan alimentaire actuel',
    'summary.totals': 'Totaux du plan',
    'summary.calories': 'Calories',
    'summary.protein': 'Proteines',
    'summary.carbs': 'Glucides',
    'summary.fat': 'Lipides',
    'summary.fiber': 'Fibres',
    'summary.totalMeals': 'Total des repas',
    'summary.empty':
      'Ajoutez des aliments aux repas pour voir les totaux nutritionnels.',
    'summary.exportPdf': 'Exporter PDF',
    'summary.exportPdfTooltip': 'Exporter le plan complet en PDF',

    'builder.editMeal': 'Modifier le nom du repas',
    'builder.deleteMeal': 'Supprimer le repas',
    'builder.edit': 'Modifier',
    'builder.delete': 'Supprimer',
    'builder.newName': 'Nouveau nom',
    'builder.save': 'Enregistrer',
    'builder.saveNewName': 'Enregistrer le nouveau nom',
    'builder.cancel': 'Annuler',
    'builder.cancelEdit': 'Annuler la modification',
    'builder.measure': 'Mesure',
    'builder.quantity': 'Quantite',
    'builder.removeItem': 'Retirer l item',
    'builder.emptyMeal': 'Repas vide.',
    'builder.noMeals': 'Aucun repas ajoute pour le moment.',
    'builder.useAsTarget': 'Definir comme cible',
    'builder.useAsTargetAria': 'Definir {mealName} comme repas cible de la recherche',
    'builder.currentTarget': 'Cible de la recherche',
    'builder.addMeal': 'Ajouter un repas',

    'confirm.deleteMeal.message':
      'Voulez-vous vraiment supprimer le repas "{mealName}" et tous ses elements?',
    'confirm.deleteMeal.header': 'Confirmer la suppression',
    'confirm.yes': 'Oui',
    'confirm.no': 'Non',

    'confirm.restore.message':
      'Nous avons trouve un travail non enregistre du {date} {time}. Voulez-vous le restaurer?',
    'confirm.restore.header': 'Restaurer le travail ?',

    'toast.warning': 'Attention',
    'toast.success': 'Succes',
    'toast.error': 'Erreur',
    'toast.info': 'Info',

    'toast.searchErrorSummary': 'Erreur de recherche',
    'toast.noResultsSummary': 'Aucun resultat',
    'toast.noResultsDetail': 'Aucun aliment trouve.',

    'toast.mealExists': 'Le repas "{mealName}" existe deja.',
    'toast.mealAdded': 'Repas "{mealName}" ajoute !',
    'toast.targetMealNotFound': 'Repas cible introuvable.',
    'toast.foodAdded': '{foodName} ajoute a {mealName}.',

    'toast.measureErrorSummary': 'Erreur de chargement des mesures',
    'toast.measureErrorDetail': 'Impossible de charger les mesures menageres.',

    'toast.importLegacy': 'Format ancien importe (repas uniquement).',
    'toast.importSuccess': 'Plan importe !',
    'toast.importErrorSummary': 'Echec de l importation',
    'toast.importReadErrorSummary': 'Erreur de lecture',
    'toast.importReadErrorDetail': 'Impossible de lire le fichier.',

    'toast.exportNothing': 'Rien a exporter.',
    'toast.exportSuccess': 'Plan exporte vers {fileName} !',

    'toast.pdfNoItems': 'Aucun element pour generer le PDF.',
    'toast.pdfSuccess': 'PDF genere !',
    'builder.option': 'Option {n}',
    'builder.addOption': 'Ajouter une option',
    'builder.removeOption': 'Retirer l’option',
    'builder.optionCounts': 'compte dans les totaux',
    'confirm.deleteOption.header': 'Retirer l’option',
    'confirm.deleteOption.message': 'Retirer l’{option} de {mealName} et ses aliments ?',
    'pdf.optionLabel': 'Option {n} :',
    'pdf.optionNote': 'Les totaux utilisent l’option 1 de chaque repas.',

    'pdf.planTitle': 'Plan alimentaire',
    'pdf.guidance': 'Conseils nutritionnels',
    'pdf.summary': 'Résumé nutritionnel',
    'pdf.factsTitle': 'Valeurs nutritionnelles',
    'pdf.factsSubtitle': 'Plan journalier · {count} repas',
    'pdf.perDay': 'par jour',
    'pdf.energyShare': '% énergie',
    'pdf.energy': 'Énergie',
    'pdf.protein': 'Protéines',
    'pdf.carbs': 'Glucides',
    'pdf.fat': 'Lipides',
    'pdf.fiber': 'Fibres',
    'pdf.byMeal': 'Par repas',
    'pdf.fileName': 'plan-alimentaire',
    'pdf.defaultTitle': 'Nutritionniste',
    'professional.title': 'Professionnel',
    'professional.toggleAria': 'Afficher ou masquer les données du professionnel',
    'professional.empty': 'À remplir pour signer le PDF',
    'professional.name': 'Nom',
    'professional.jobTitle': 'Titre',
    'professional.crn': 'Numéro d’enregistrement professionnel',
    'professional.crnPlaceholder': 'Ex. : RPPS 10101010101',
    'professional.phone': 'Téléphone',
    'professional.email': 'E-mail',
    'professional.logo': 'Logo',
    'professional.logoUpload': 'Importer un logo',
    'professional.logoReplace': 'Remplacer le logo',
    'professional.logoRemove': 'Retirer',
    'professional.logoHint': 'Sans logo, le PDF affiche un monogramme de vos initiales.',
    'professional.palette': 'Couleurs du PDF',
    'professional.palette.salvia': 'Sauge',
    'professional.palette.oceano': 'Océan',
    'professional.palette.terracota': 'Terre cuite',
    'professional.palette.grafite': 'Graphite',
    'professional.includeSummary': 'Ajouter une page de résumé nutritionnel au PDF',
    'toast.pdfError': 'Impossible de générer le PDF. Vérifiez la connexion et réessayez.',
    'toast.logoError': 'Impossible de lire l’image. Utilisez un PNG ou un JPG.',

    'toast.restoreDoneSummary': 'Restaure',
    'toast.restoreDoneDetail': 'Travail precedent restaure.',
  },
};

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly languageSubject = new BehaviorSubject<AppLanguage>('en');
  readonly language$ = this.languageSubject.asObservable();

  constructor() {
    const initialLanguage = this.resolveInitialLanguage();
    this.setLanguage(initialLanguage);
  }

  get currentLanguage(): AppLanguage {
    return this.languageSubject.value;
  }

  setLanguage(language: AppLanguage): void {
    this.languageSubject.next(language);
    localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
  }

  t(key: string, params?: TranslationParams): string {
    const language = this.currentLanguage;
    const languageMap = TRANSLATIONS[language] || TRANSLATIONS.en;
    const fallbackMap = TRANSLATIONS.en;
    let text = languageMap[key] ?? fallbackMap[key] ?? key;

    if (!params) return text;

    Object.entries(params).forEach(([param, value]) => {
      text = text.replaceAll(`{${param}}`, String(value));
    });

    return text;
  }

  private resolveInitialLanguage(): AppLanguage {
    const fromStorage = localStorage.getItem(STORAGE_KEY);
    if (this.isSupportedLanguage(fromStorage)) {
      return fromStorage;
    }

    const browser = navigator.language || 'en';
    if (browser.toLowerCase().startsWith('pt')) return 'pt-BR';
    if (browser.toLowerCase().startsWith('fr')) return 'fr';
    return 'en';
  }

  private isSupportedLanguage(value: string | null): value is AppLanguage {
    return value === 'pt-BR' || value === 'en' || value === 'fr';
  }
}
