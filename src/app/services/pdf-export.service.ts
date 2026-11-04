import { Injectable, inject } from '@angular/core';
import jsPDF from 'jspdf';
import { DietItem } from '../models/diet-item.model';
import { Meal } from '../models/meal.model';
import { PatientData } from '../models/patient-data.model';
import { PDF_INK, PdfPalette, pdfPalette } from '../models/pdf-palette';
import { PlanTotals } from '../models/plan-totals.model';
import { ProfessionalProfile } from '../models/professional-profile.model';
import { AppLanguage, I18nService } from './i18n.service';

type Rgb = [number, number, number];

/** A piece of inline text; consecutive runs wrap together as one paragraph. */
interface Run {
  text: string;
  bold?: boolean;
}

/** Self-hosted under public/fonts (all SIL OFL). Registered as [family, style]. */
const FONT_FILES: [file: string, family: string, style: string][] = [
  ['Montserrat-Regular.ttf', 'Montserrat', 'normal'],
  ['Montserrat-Bold.ttf', 'Montserrat', 'bold'],
  ['Montserrat-Italic.ttf', 'Montserrat', 'italic'],
  ['Poppins-Regular.ttf', 'Poppins', 'normal'],
  ['Poppins-Medium.ttf', 'PoppinsMedium', 'normal'],
  ['Marcellus-Regular.ttf', 'Marcellus', 'normal'],
];

const LOCALES: Record<AppLanguage, string> = {
  'pt-BR': 'pt-BR',
  en: 'en-US',
  fr: 'fr-FR',
};

// A4 in millimetres (297 tall; the bottom limits below derive from it).
const PAGE_W = 210;
const MARGIN = 16;
const CONTENT_TOP = 40;
const CONTENT_BOTTOM = 274;
const FOOTER_Y = 285;

const BODY_SIZE = 11;
const BODY_LINE = 5.6;
const ROW_PAD = 2.5;
const BAND_H = 10;
const BLACK: Rgb = [17, 17, 17];
const WHITE: Rgb = [255, 255, 255];

const BASE_MEASURES = ['grama', 'mililitro'];
const FRACTIONS: Record<string, string> = { '0.25': '¼', '0.5': '½', '0.75': '¾' };
/** Adjectives inside pt-BR household measures that agree in number. */
const PT_ADJECTIVES = new Set([
  'média', 'médio', 'pequena', 'pequeno', 'grande', 'cheia', 'cheio',
  'rasa', 'raso', 'fina', 'fino', 'grossa', 'grosso',
]);

@Injectable({
  providedIn: 'root',
})
export class PdfExportService {
  private readonly i18n = inject(I18nService);
  private fontCache: Promise<Map<string, string>> | null = null;

  async generateDietPlanPdf(
    meals: Meal[],
    totals: PlanTotals,
    profile: ProfessionalProfile,
    patientData?: PatientData,
  ): Promise<void> {
    const fonts = await this.loadFonts();
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    for (const [file, family, style] of FONT_FILES) {
      doc.addFileToVFS(file, fonts.get(file)!);
      doc.addFont(file, family, style);
    }

    const writer = new PlanWriter(
      doc,
      pdfPalette(profile.palette),
      profile,
      this.i18n,
      LOCALES[this.i18n.currentLanguage],
    );
    writer.write(meals, totals, patientData);

    const slug = this.slugify(patientData?.name ?? '');
    const base = this.i18n.t('pdf.fileName');
    doc.save(slug ? `${base}-${slug}.pdf` : `${base}.pdf`);
  }

  private loadFonts(): Promise<Map<string, string>> {
    this.fontCache ??= Promise.all(
      FONT_FILES.map(async ([file]) => {
        const res = await fetch(new URL(`fonts/${file}`, document.baseURI));
        if (!res.ok) throw new Error(`Font ${file}: HTTP ${res.status}`);
        return [file, toBase64(await res.arrayBuffer())] as const;
      }),
    )
      .then((entries) => new Map(entries))
      .catch((err) => {
        this.fontCache = null;
        throw err;
      });
    return this.fontCache;
  }

  private slugify(text: string): string {
    return text
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}

function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

/** Lays out one plan. Holds the cursor so section helpers stay short. */
class PlanWriter {
  private y = CONTENT_TOP;
  private readonly number1: Intl.NumberFormat;
  private readonly number0: Intl.NumberFormat;

  constructor(
    private readonly doc: jsPDF,
    private readonly palette: PdfPalette,
    private readonly profile: ProfessionalProfile,
    private readonly i18n: I18nService,
    private readonly locale: string,
  ) {
    this.number1 = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
    this.number0 = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  }

  write(meals: Meal[], totals: PlanTotals, patient?: PatientData): void {
    const t = (key: string, p?: Record<string, string | number>) =>
      this.i18n.t(key, p);

    this.drawCover(patient?.name?.trim() ?? '');

    this.newPage();
    this.pill(t('pdf.planTitle'));
    if (patient?.name?.trim()) {
      this.setFont('Montserrat', 'normal', 11, BLACK);
      this.spacedText(patient.name.trim(), PAGE_W / 2, this.y + 4, 0.35);
      this.y += 6;
    }
    this.setFont('Montserrat', 'normal', 10.5, BLACK);
    this.doc.text(
      new Date().toLocaleDateString(this.locale),
      PAGE_W / 2,
      this.y + 4,
      { align: 'center' },
    );
    this.y += 11;

    meals
      .filter((meal) => filledOptions(meal).length > 0)
      .forEach((meal) => this.drawMeal(meal));

    const notes: [string, string][] = [];
    if (patient?.goals?.trim()) notes.push([t('patient.goals'), patient.goals]);
    if (patient?.observations?.trim())
      notes.push([t('patient.observations'), patient.observations]);
    if (notes.length) {
      this.ensureSpace(30);
      this.y += 4;
      this.pill(t('pdf.guidance'));
      notes.forEach(([heading, text]) => this.drawNote(heading, text));
    }

    if (this.profile.includeSummary) {
      this.newPage();
      this.pill(t('pdf.summary'));
      this.drawFactsLabel(meals, totals);
    }

    const pages = this.doc.getNumberOfPages();
    for (let page = 1; page <= pages; page++) {
      this.doc.setPage(page);
      this.drawFooter();
    }
  }

  // ── Page furniture ────────────────────────────────────────────────

  private newPage(): void {
    this.doc.addPage();
    this.drawHeader();
    this.y = CONTENT_TOP;
  }

  private ensureSpace(height: number): void {
    if (this.y + height > CONTENT_BOTTOM) this.newPage();
  }

  private drawCover(patientName: string): void {
    this.drawHeader();
    const { doc, palette } = this;

    const bandY = 140;
    doc.setFillColor(...palette.tint);
    doc.rect(0, bandY, PAGE_W, 13, 'F');
    this.setFont('Montserrat', 'bold', 17, BLACK);
    doc.text(this.upper(this.i18n.t('pdf.planTitle')), PAGE_W / 2, bandY + 6.5, {
      align: 'center',
      baseline: 'middle',
    });

    if (patientName) {
      this.setFont('Poppins', 'normal', 11, WHITE);
      const label = this.upper(patientName);
      const w = this.spacedWidth(label, 0.6) + 18;
      doc.setFillColor(...palette.primary);
      doc.roundedRect((PAGE_W - w) / 2, bandY + 17, w, 8.5, 4.25, 4.25, 'F');
      this.spacedText(label, PAGE_W / 2, bandY + 21.25, 0.6, 'middle');
    }
  }

  /** Mark (uploaded logo or monogram) beside the name and title line. */
  private drawHeader(): void {
    const { doc, palette, profile } = this;
    const name = profile.name.trim();
    const title = this.upper(
      profile.title.trim() || (name ? this.i18n.t('pdf.defaultTitle') : ''),
    );
    if (!name && !title && !profile.logo) return;

    const markH = 16;
    const markW = profile.logo
      ? Math.min(markH * (profile.logo.width / profile.logo.height), 44)
      : name
        ? markH
        : 0;
    const gap = markW ? 4.5 : 0;

    this.setFont('Marcellus', 'normal', 23, palette.primary);
    const nameW = name ? doc.getTextWidth(name) : 0;
    this.setFont('PoppinsMedium', 'normal', 9.5, palette.accent);
    const titleW = title ? this.spacedWidth(title, 1.15) : 0;
    const textW = Math.max(nameW, titleW);

    const x0 = (PAGE_W - (markW + gap + textW)) / 2;
    const cy = 20;

    if (profile.logo) {
      const h = (markW / profile.logo.width) * profile.logo.height;
      const format = profile.logo.dataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
      doc.addImage(profile.logo.dataUrl, format, x0, cy - h / 2, markW, h);
    } else if (markW) {
      doc.setDrawColor(...palette.accent);
      doc.setLineWidth(0.45);
      doc.circle(x0 + markW / 2, cy, markH / 2, 'S');
      this.setFont('Marcellus', 'normal', 15, palette.accent);
      doc.text(this.initials(name), x0 + markW / 2, cy + 0.3, {
        align: 'center',
        baseline: 'middle',
      });
    }

    const tx = x0 + markW + gap;
    if (name) {
      this.setFont('Marcellus', 'normal', 23, palette.primary);
      doc.text(name, tx, title ? cy + 1 : cy + 3);
    }
    if (title) {
      this.setFont('PoppinsMedium', 'normal', 9.5, palette.accent);
      doc.text(title, tx, name ? cy + 7 : cy + 2, { charSpace: 1.15 });
    }
  }

  private drawFooter(): void {
    const { doc, palette, profile } = this;
    const crn = profile.crn.trim();
    const items: { icon?: 'phone' | 'mail'; text: string }[] = [];
    if (profile.phone.trim()) items.push({ icon: 'phone', text: profile.phone.trim() });
    if (profile.email.trim()) items.push({ icon: 'mail', text: profile.email.trim() });
    // Printed as typed; only a bare number in pt-BR gets the Brazilian prefix.
    const bareNumber = /^[\d\s./-]+$/.test(crn);
    if (crn)
      items.push({
        text: bareNumber && this.i18n.currentLanguage === 'pt-BR' ? `CRN ${crn}` : crn,
      });
    if (!items.length) return;

    this.setFont('Montserrat', 'normal', 8.5, PDF_INK);
    const iconR = 2.7;
    const iconGap = 2;
    const itemGap = 7;
    const widths = items.map(
      (it) => doc.getTextWidth(it.text) + (it.icon ? iconR * 2 + iconGap : 0),
    );
    let x = (PAGE_W - widths.reduce((a, b) => a + b, 0) - itemGap * (items.length - 1)) / 2;

    items.forEach((it) => {
      if (it.icon) {
        const cx = x + iconR;
        doc.setDrawColor(...palette.accent);
        doc.setLineWidth(0.3);
        doc.circle(cx, FOOTER_Y, iconR, 'S');
        doc.setLineWidth(0.25);
        if (it.icon === 'phone') {
          doc.roundedRect(cx - 0.85, FOOTER_Y - 1.45, 1.7, 2.9, 0.35, 0.35, 'S');
          doc.line(cx - 0.3, FOOTER_Y + 0.95, cx + 0.3, FOOTER_Y + 0.95);
        } else {
          doc.rect(cx - 1.4, FOOTER_Y - 1, 2.8, 2, 'S');
          doc.line(cx - 1.4, FOOTER_Y - 1, cx, FOOTER_Y + 0.15);
          doc.line(cx, FOOTER_Y + 0.15, cx + 1.4, FOOTER_Y - 1);
        }
        x += iconR * 2 + iconGap;
      }
      this.setFont('Montserrat', 'normal', 8.5, PDF_INK);
      doc.text(it.text, x, FOOTER_Y, { baseline: 'middle' });
      x += doc.getTextWidth(it.text) + itemGap;
    });
  }

  // ── Sections ──────────────────────────────────────────────────────

  private pill(label: string): void {
    const { doc, palette } = this;
    this.setFont('Poppins', 'normal', 11, WHITE);
    const text = this.upper(label);
    const w = Math.max(this.spacedWidth(text, 0.8) + 24, 96);
    doc.setFillColor(...palette.primary);
    doc.roundedRect((PAGE_W - w) / 2, this.y, w, 8.5, 4.25, 4.25, 'F');
    this.spacedText(text, PAGE_W / 2, this.y + 4.25, 0.8, 'middle');
    this.y += 13;
  }

  /**
   * One option: a bullet per food, like the reference's lunch.
   * Several options: one row per option joined with "+", like its pre-workout.
   */
  private drawMeal(meal: Meal): void {
    const { doc, palette } = this;
    const options = filledOptions(meal);
    const runs =
      options.length > 1
        ? options.map((items, i) => this.optionRuns(items, i))
        : options[0].map((item) => this.itemRuns(item));
    const rows = runs.map((r) => this.layout(r));
    const rowH = (lines: number) => lines * BODY_LINE + ROW_PAD * 2;

    // Never strand a band at the foot of a page: keep it with two rows.
    const lead = rows.slice(0, 2).reduce((sum, lines) => sum + rowH(lines.length), 0);
    this.ensureSpace(BAND_H + 3 + lead);
    doc.setFillColor(...palette.primary);
    doc.rect(0, this.y, PAGE_W, BAND_H, 'F');
    this.setFont('Poppins', 'normal', 13, WHITE);
    this.spacedText(this.upper(meal.name), PAGE_W / 2, this.y + BAND_H / 2 + 0.2, 1, 'middle');
    this.y += BAND_H + 3;

    rows.forEach((lines, index) => {
      const h = rowH(lines.length);
      this.ensureSpace(h);
      if (index % 2 === 1) {
        doc.setFillColor(...palette.tint);
        doc.rect(0, this.y, PAGE_W, h, 'F');
      }
      const baseline = this.y + ROW_PAD + 3.9;
      doc.setFillColor(...BLACK);
      doc.circle(MARGIN + 1.6, baseline - 1.2, 0.65, 'F');
      this.drawLines(lines, MARGIN + 5, baseline);
      this.y += h;
    });
    this.y += 7;
  }

  private drawNote(heading: string, text: string): void {
    this.ensureSpace(BODY_LINE * 3);
    this.setFont('Montserrat', 'bold', BODY_SIZE, BLACK);
    this.doc.text(heading, MARGIN, this.y + 3.7);
    this.y += BODY_LINE + 1;

    this.setFont('Montserrat', 'normal', BODY_SIZE, BLACK);
    for (const paragraph of text.trim().split(/\n+/)) {
      const lines: string[] = this.doc.splitTextToSize(paragraph, PAGE_W - MARGIN * 2);
      for (const line of lines) {
        this.ensureSpace(BODY_LINE);
        this.setFont('Montserrat', 'normal', BODY_SIZE, BLACK);
        this.doc.text(line, MARGIN, this.y + 3.7);
        this.y += BODY_LINE;
      }
      this.y += 1.5;
    }
    this.y += 4;
  }

  /** Nutrition-facts label: the same treatment as the app's totals panel. */
  private drawFactsLabel(meals: Meal[], totals: PlanTotals): void {
    const { doc } = this;
    const t = (key: string, p?: Record<string, string | number>) =>
      this.i18n.t(key, p);
    const w = 100;
    const x = (PAGE_W - w) / 2;
    const pad = 3.5;
    const left = x + pad;
    const right = x + w - pad;
    const shareX = right;
    const gramsX = right - 24;
    const top = this.y + 4;
    let y = top + pad;

    const rule = (weight: number) => {
      doc.setFillColor(...BLACK);
      doc.rect(left, y, w - pad * 2, weight, 'F');
      y += weight;
    };
    const row = (
      label: string,
      value: string,
      share = '',
      opts: { bold?: boolean; size?: number } = {},
    ) => {
      const size = opts.size ?? 10;
      const lh = size * 0.53;
      this.setFont('Montserrat', opts.bold ? 'bold' : 'normal', size, BLACK);
      doc.text(label, left, y + lh);
      this.setFont('Montserrat', 'bold', size, BLACK);
      doc.text(value, share ? gramsX : right, y + lh, { align: 'right' });
      if (share) {
        this.setFont('Montserrat', 'normal', size, PDF_INK);
        doc.text(share, shareX, y + lh, { align: 'right' });
      }
      y += lh + 1.6;
    };

    this.setFont('Montserrat', 'bold', 17, BLACK);
    doc.text(t('pdf.factsTitle'), left, y + 6);
    y += 8.5;
    this.setFont('Montserrat', 'normal', 9, PDF_INK);
    const mealCount = meals.filter((m) => m.items.length).length;
    doc.text(t('pdf.factsSubtitle', { count: mealCount }), left, y + 3);
    y += 5;
    if (meals.some((m) => filledOptions(m).length > 1)) {
      doc.text(t('pdf.optionNote'), left, y + 2);
      y += 4.5;
    }
    rule(2.4);
    y += 1.5;

    this.setFont('Montserrat', 'bold', 8, BLACK);
    doc.text(t('pdf.perDay'), gramsX, y + 3, { align: 'right' });
    doc.text(t('pdf.energyShare'), shareX, y + 3, { align: 'right' });
    y += 4.5;
    rule(0.3);
    y += 1.5;

    row(t('pdf.energy'), `${this.number0.format(totals.totalKcal)} kcal`, '', {
      bold: true,
      size: 12,
    });
    rule(1.1);
    y += 1.5;

    const macroKcal =
      totals.totalProtein * 4 + totals.totalCarbs * 4 + totals.totalFat * 9;
    const share = (kcal: number) =>
      macroKcal > 0 ? `${this.number0.format((kcal / macroKcal) * 100)}%` : '–';
    const macros: [string, number, string][] = [
      [t('pdf.protein'), totals.totalProtein, share(totals.totalProtein * 4)],
      [t('pdf.carbs'), totals.totalCarbs, share(totals.totalCarbs * 4)],
      [t('pdf.fat'), totals.totalFat, share(totals.totalFat * 9)],
      [t('pdf.fiber'), totals.totalFiber, ''],
    ];
    macros.forEach(([label, grams, pct], i) => {
      row(label, `${this.number1.format(grams)} g`, pct || ' ');
      if (i < macros.length - 1) {
        rule(0.2);
        y += 1.6;
      }
    });

    y += 0.6;
    rule(2.4);
    y += 1.5;
    this.setFont('Montserrat', 'bold', 9, BLACK);
    doc.text(t('pdf.byMeal'), left, y + 3.2);
    y += 5.5;
    meals
      .filter((m) => m.items.length)
      .forEach((meal) => {
        const kcal = meal.items.reduce(
          (sum, it) => sum + ((it.food?.energy_kcal || 0) * (it.quantityInGrams || 0)) / 100,
          0,
        );
        row(meal.name, `${this.number0.format(kcal)} kcal`, '', { size: 9.5 });
      });

    y += pad - 1.6;
    doc.setDrawColor(...BLACK);
    doc.setLineWidth(0.7);
    doc.rect(x, top, w, y - top, 'S');
    this.y = y + 6;
  }

  // ── Item text ─────────────────────────────────────────────────────

  /** "Aveia, flocos, crua: 2 colheres de sopa (30 g)" */
  private itemRuns(item: DietItem): Run[] {
    const { measure, grams } = this.describeQuantity(item);
    return [
      { text: `${item.food?.name || '—'}:`, bold: true },
      { text: measure ? ` ${measure} (${grams})` : ` ${grams}` },
    ];
  }

  /** "Opção 1: Banana (1 unidade média, 70 g) + Aveia (2 colheres de sopa, 30 g)" */
  private optionRuns(items: DietItem[], index: number): Run[] {
    const runs: Run[] = [
      { text: this.i18n.t('pdf.optionLabel', { n: index + 1 }), bold: true },
    ];
    items.forEach((item, i) => {
      const { measure, grams } = this.describeQuantity(item);
      const amount = measure ? `${measure}, ${grams}` : grams;
      if (i > 0) runs.push({ text: ' +', bold: true });
      runs.push({ text: ` ${item.food?.name || '—'} (${amount})` });
    });
    return runs;
  }

  /** Household measure ("2 colheres de sopa") when one is picked, plus grams. */
  private describeQuantity(item: DietItem): { measure: string; grams: string } {
    const unit = item.food?.unit === 'ml' ? 'mL' : 'g';
    const grams = `${this.number0.format(item.quantityInGrams || 0)} ${unit}`;
    const measure = item.selectedMeasure;
    if (!measure || BASE_MEASURES.includes(measure)) return { measure: '', grams };

    const qty = item.displayQuantity || 0;
    const name =
      qty > 1 && this.i18n.currentLanguage === 'pt-BR'
        ? pluralizePt(measure)
        : measure;
    return { measure: `${this.formatQty(qty)} ${name}`, grams };
  }

  private formatQty(qty: number): string {
    const whole = Math.floor(qty);
    const frac = FRACTIONS[String(Math.round((qty - whole) * 100) / 100)];
    if (frac) return whole ? `${whole} ${frac}` : frac;
    return this.number1.format(qty).replace(/[.,]0$/, '');
  }

  // ── Text primitives ───────────────────────────────────────────────

  /** Greedy word wrap across mixed bold/regular runs. */
  private layout(runs: Run[]): Run[][] {
    const maxW = PAGE_W - MARGIN * 2 - 5;
    const lines: Run[][] = [[]];
    let lineW = 0;
    for (const run of runs) {
      this.setFont('Montserrat', run.bold ? 'bold' : 'normal', BODY_SIZE, BLACK);
      for (const piece of run.text.split(/(\s+)/)) {
        if (!piece) continue;
        const isSpace = /^\s+$/.test(piece);
        const w = this.doc.getTextWidth(piece);
        if (!isSpace && lineW + w > maxW && lineW > 0) {
          lines.push([]);
          lineW = 0;
        }
        if (isSpace && lineW === 0) continue;
        lines[lines.length - 1].push({ text: piece, bold: run.bold });
        lineW += w;
      }
    }
    return lines;
  }

  private drawLines(lines: Run[][], x: number, baseline: number): void {
    lines.forEach((line, i) => {
      let cx = x;
      for (const run of line) {
        this.setFont('Montserrat', run.bold ? 'bold' : 'normal', BODY_SIZE, BLACK);
        this.doc.text(run.text, cx, baseline + i * BODY_LINE);
        cx += this.doc.getTextWidth(run.text);
      }
    });
  }

  private setFont(family: string, style: string, size: number, color: Rgb): void {
    this.doc.setFont(family, style);
    this.doc.setFontSize(size);
    this.doc.setTextColor(...color);
  }

  private spacedWidth(text: string, charSpace: number): number {
    return this.doc.getTextWidth(text) + charSpace * (text.length - 1);
  }

  /** Letter-spaced text centred on cx (jsPDF's align ignores charSpace). */
  private spacedText(
    text: string,
    cx: number,
    y: number,
    charSpace: number,
    baseline: 'alphabetic' | 'middle' = 'alphabetic',
  ): void {
    const w = this.spacedWidth(text, charSpace);
    this.doc.text(text, cx - w / 2, y, { charSpace, baseline });
  }

  private upper(text: string): string {
    return text.toLocaleUpperCase(this.locale);
  }

  private initials(name: string): string {
    const words = name.split(/\s+/).filter((w) => /^\p{L}/u.test(w));
    const first = words[0]?.[0] ?? '';
    const last = words.length > 1 ? words[words.length - 1][0] : '';
    return this.upper(first + last);
  }
}

/** Options that have foods; empty ones are left out of the patient's PDF. */
function filledOptions(meal: Meal): DietItem[][] {
  return [meal.items ?? [], ...(meal.alternatives ?? []).map((o) => o.items)].filter(
    (items) => items.length > 0,
  );
}

/** "colher de sopa cheia" → "colheres de sopa cheias". Covers household measures only. */
function pluralizePt(phrase: string): string {
  return phrase
    .split(' ')
    .map((word, i) =>
      i === 0 || PT_ADJECTIVES.has(word.toLowerCase()) ? pluralizeWordPt(word) : word,
    )
    .join(' ');
}

function pluralizeWordPt(word: string): string {
  if (/[^\p{L}]/u.test(word) || word.endsWith('s')) return word;
  if (word.endsWith('ão')) return `${word.slice(0, -2)}ões`;
  if (/[rz]$/.test(word)) return `${word}es`;
  if (word.endsWith('m')) return `${word.slice(0, -1)}ns`;
  if (word.endsWith('l')) return `${word.slice(0, -1)}is`;
  return `${word}s`;
}
