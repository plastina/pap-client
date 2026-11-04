import { PdfPaletteId } from './professional-profile.model';

type Rgb = [number, number, number];

export interface PdfPalette {
  id: PdfPaletteId;
  /** Bands, pills and the professional's name. White text sits on it. */
  primary: Rgb;
  /** Title line, monogram and footer icons. */
  accent: Rgb;
  /** Alternating item rows and the cover band. */
  tint: Rgb;
}

/** Dark ink used for body copy on every palette. */
export const PDF_INK: Rgb = [59, 59, 59];

export const PDF_PALETTES: readonly PdfPalette[] = [
  {
    id: 'salvia',
    primary: [65, 93, 71],
    accent: [219, 143, 130],
    tint: [243, 221, 216],
  },
  {
    id: 'oceano',
    primary: [38, 70, 94],
    accent: [201, 140, 82],
    tint: [228, 236, 242],
  },
  {
    id: 'terracota',
    primary: [122, 62, 46],
    accent: [122, 140, 104],
    tint: [245, 230, 220],
  },
  {
    id: 'grafite',
    primary: [52, 55, 61],
    accent: [176, 138, 90],
    tint: [236, 234, 229],
  },
];

export function pdfPalette(id: PdfPaletteId): PdfPalette {
  return PDF_PALETTES.find((p) => p.id === id) ?? PDF_PALETTES[0];
}

export function rgbCss([r, g, b]: Rgb): string {
  return `rgb(${r} ${g} ${b})`;
}
