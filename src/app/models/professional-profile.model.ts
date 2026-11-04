export type PdfPaletteId = 'salvia' | 'oceano' | 'terracota' | 'grafite';

/** Logo uploaded by the professional, already downscaled for the PDF. */
export interface ProfessionalLogo {
  dataUrl: string;
  width: number;
  height: number;
}

/** Who signs the PDF. One profile per browser, kept in localStorage. */
export interface ProfessionalProfile {
  name: string;
  /** Line under the name, e.g. "Nutricionista". */
  title: string;
  crn: string;
  phone: string;
  email: string;
  logo: ProfessionalLogo | null;
  palette: PdfPaletteId;
  /** Append the nutrition-facts summary page to the patient PDF. */
  includeSummary: boolean;
}
