import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { PDF_PALETTES, rgbCss } from '../../models/pdf-palette';
import {
  PdfPaletteId,
  ProfessionalProfile,
} from '../../models/professional-profile.model';
import { TranslatePipe } from '../../pipes/t.pipe';
import { I18nService } from '../../services/i18n.service';
import { ProfessionalProfileService } from '../../services/professional-profile.service';

/** Longest side of the stored logo; enough for ~45 mm at print resolution. */
const LOGO_MAX_PX = 600;

type TextField = 'name' | 'title' | 'crn' | 'phone' | 'email';

@Component({
  selector: 'app-professional-section',
  standalone: true,
  imports: [CommonModule, FormsModule, InputTextModule, TranslatePipe],
  templateUrl: './professional-section.component.html',
  styleUrls: ['./professional-section.component.scss'],
})
export class ProfessionalSectionComponent {
  private readonly profiles = inject(ProfessionalProfileService);
  private readonly messages = inject(MessageService);
  private readonly i18n = inject(I18nService);

  readonly palettes = PDF_PALETTES.map((p) => ({
    id: p.id,
    primary: rgbCss(p.primary),
    accent: rgbCss(p.accent),
    tint: rgbCss(p.tint),
  }));

  /** Starts open until the professional has signed at least once. */
  readonly startExpanded = !this.profiles.profile.name.trim();

  get profile(): ProfessionalProfile {
    return this.profiles.profile;
  }

  get summary(): string {
    const { name, crn } = this.profile;
    return [name.trim(), crn.trim()].filter(Boolean).join(' · ');
  }

  setField(field: TextField, value: string): void {
    this.profiles.update({ [field]: value });
  }

  setPalette(id: PdfPaletteId): void {
    this.profiles.update({ palette: id });
  }

  setIncludeSummary(value: boolean): void {
    this.profiles.update({ includeSummary: value });
  }

  removeLogo(): void {
    this.profiles.update({ logo: null });
  }

  async onLogoSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    try {
      this.profiles.update({ logo: await this.downscale(file) });
    } catch {
      this.messages.add({
        severity: 'error',
        summary: this.i18n.t('toast.error'),
        detail: this.i18n.t('toast.logoError'),
      });
    }
  }

  /** Re-encodes the upload so localStorage holds a small, PDF-ready image. */
  private async downscale(file: File) {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, LOGO_MAX_PX / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    // PNG keeps transparent backgrounds; photos are smaller as JPEG.
    const dataUrl =
      file.type === 'image/png'
        ? canvas.toDataURL('image/png')
        : canvas.toDataURL('image/jpeg', 0.9);
    return { dataUrl, width, height };
  }
}
