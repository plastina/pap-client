import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Meal } from '../models/meal.model';
import { PatientData } from '../models/patient-data.model';
import { PlanTotals } from '../models/plan-totals.model';

/** jsPDF augmented with the property jspdf-autotable sets after each table. */
type AutoTableDoc = jsPDF & { lastAutoTable: { finalY: number } };

@Injectable({
  providedIn: 'root',
})
export class PdfExportService {
  generateDietPlanPdf(
    meals: Meal[],
    totals: PlanTotals,
    patientData?: PatientData,
  ) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 14;
    const contentWidth = pageWidth - marginX * 2;
    const appName = 'Plano Alimentar Personalizado';
    const generatedAt = new Date().toLocaleDateString('pt-BR');

    const palette = {
      navy: [16, 43, 89] as [number, number, number],
      cobalt: [26, 86, 219] as [number, number, number],
      sky: [56, 139, 253] as [number, number, number],
      baby: [219, 234, 254] as [number, number, number],
      surfaceBlue: [239, 246, 255] as [number, number, number],
      borderBlue: [147, 197, 253] as [number, number, number],
      slate: [51, 65, 85] as [number, number, number],
      muted: [100, 116, 139] as [number, number, number],
      white: [255, 255, 255] as [number, number, number],
    };

    const spacing = {
      sectionGap: 9, // big gap between different contexts
      sectionHeaderHeight: 10,
      titleToContent: 3, // small gap inside same context
      lineHeight: 4,
      contentRowGap: 2,
      mealTitleToTable: 3,
      cardPaddingX: 4,
      cardPaddingY: 4,
      cardBottomGap: 4,
    };

    let yPos = 17;

    const ensureSpace = (requiredHeight: number): void => {
      if (yPos + requiredHeight > pageHeight - 20) {
        doc.addPage();
        yPos = 18;
      }
    };

    const drawCard = (y: number, h: number): void => {
      doc.setFillColor(...palette.surfaceBlue);
      doc.setDrawColor(...palette.borderBlue);
      doc.roundedRect(marginX, y, contentWidth, h, 2, 2, 'FD');
    };

    const drawSectionHeading = (
      text: string,
      topGap = spacing.sectionGap,
    ): void => {
      yPos += topGap;
      ensureSpace(spacing.sectionHeaderHeight + spacing.titleToContent);
      doc.setFillColor(...palette.baby);
      doc.roundedRect(marginX, yPos - 4, contentWidth, 10, 1.8, 1.8, 'F');
      doc.setFillColor(...palette.cobalt);
      doc.rect(marginX, yPos - 4, 3, 10, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...palette.navy);
      doc.text(text, marginX + 6, yPos + 1, { baseline: 'middle' });
      yPos += spacing.sectionHeaderHeight + spacing.titleToContent;
    };

    doc.setFont('helvetica', 'normal');

    // Premium header block
    doc.setFillColor(...palette.baby);
    doc.roundedRect(marginX, yPos - 7, contentWidth, 31, 2, 2, 'F');

    doc.setFillColor(...palette.navy);
    doc.roundedRect(pageWidth - marginX - 22, yPos - 4, 18, 10, 1.6, 1.6, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...palette.white);
    doc.text('PAP', pageWidth - marginX - 13, yPos + 1, {
      align: 'center',
      baseline: 'middle',
    });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(...palette.navy);
    doc.text(appName, marginX + 4, yPos + 1.5, {
      align: 'left',
      baseline: 'middle',
    });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...palette.cobalt);
    doc.text('Relatório nutricional completo', marginX + 4, yPos + 9, {
      align: 'left',
      baseline: 'middle',
    });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...palette.muted);
    doc.text(`Gerado em ${generatedAt}`, marginX + 4, yPos + 15, {
      align: 'left',
      baseline: 'middle',
    });

    doc.setDrawColor(...palette.borderBlue);
    doc.setLineWidth(0.3);
    doc.line(marginX + 4, yPos + 20, pageWidth - (marginX + 4), yPos + 20);

    yPos += 33;

    if (
      patientData?.name ||
      patientData?.dob ||
      patientData?.weight ||
      patientData?.height
    ) {
      drawSectionHeading('Informações do Paciente');

      const leftRows: string[] = [];
      const rightRows: string[] = [];

      if (patientData?.name) {
        leftRows.push(`Nome: ${patientData.name}`);
      }
      if (patientData?.dob) {
        const formattedDob = patientData.dob.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
        leftRows.push(`Nascimento: ${formattedDob}`);
      }
      if (patientData?.weight) {
        rightRows.push(`Peso: ${patientData.weight.toFixed(1)} kg`);
      }
      if (patientData?.height) {
        rightRows.push(`Altura: ${patientData.height.toFixed(0)} cm`);
      }

      const rows = Math.max(leftRows.length, rightRows.length, 1);
      const cardContentHeight =
        rows * spacing.lineHeight + (rows - 1) * spacing.contentRowGap;
      const patientCardHeight = spacing.cardPaddingY * 2 + cardContentHeight;

      ensureSpace(
        patientCardHeight + spacing.cardBottomGap + spacing.sectionGap,
      );
      drawCard(yPos - 1, patientCardHeight);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(...palette.slate);
      const leftX = marginX + spacing.cardPaddingX;
      const rightX = marginX + contentWidth / 2 + 2;
      const baseY = yPos + spacing.cardPaddingY;

      leftRows.forEach((text, index) => {
        const rowY =
          baseY + index * (spacing.lineHeight + spacing.contentRowGap);
        doc.text(text, leftX, rowY);
      });

      rightRows.forEach((text, index) => {
        const rowY =
          baseY + index * (spacing.lineHeight + spacing.contentRowGap);
        doc.text(text, rightX, rowY);
      });

      // Real breathing space below patient card before next section.
      yPos += patientCardHeight + spacing.cardBottomGap;
    }

    if (patientData?.goals) {
      drawSectionHeading('Objetivos');
      ensureSpace(spacing.sectionGap);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(...palette.slate);
      const goalsLines = doc.splitTextToSize(patientData.goals, contentWidth);
      doc.text(goalsLines, marginX, yPos);
      yPos += goalsLines.length * spacing.lineHeight;
    }

    if (patientData?.observations) {
      drawSectionHeading('Observações');
      ensureSpace(spacing.sectionGap);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(...palette.slate);
      const obsLines = doc.splitTextToSize(
        patientData.observations,
        contentWidth,
      );
      doc.text(obsLines, marginX, yPos);
      yPos += obsLines.length * spacing.lineHeight;
    }

    meals.forEach((meal, mealIndex) => {
      drawSectionHeading(`Refeição ${mealIndex + 1}`);
      ensureSpace(12);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11.5);
      doc.setTextColor(...palette.navy);
      doc.text(meal.name, marginX, yPos);
      yPos += spacing.mealTitleToTable;

      const head = [
        ['Alimento', 'Qtd', 'Kcal', 'Prot (g)', 'Carb (g)', 'Gord (g)'],
      ];
      const body = meal.items.map((item) => {
        const food = item.food || {};
        const qty =
          typeof item.displayQuantity === 'number' ? item.displayQuantity : 0;
        const factor = qty / 100;
        return [
          food.name || 'N/A',
          `${qty.toFixed(0)} ${food.unit === 'ml' ? 'mL' : 'g'}`,
          ((food.energy_kcal || 0) * factor).toFixed(0),
          ((food.protein_g || 0) * factor).toFixed(1),
          ((food.carbohydrate_g || 0) * factor).toFixed(1),
          ((food.fat_g || 0) * factor).toFixed(1),
        ];
      });

      if (body.length > 0) {
        autoTable(doc, {
          head,
          body,
          startY: yPos,
          theme: 'grid',
          headStyles: {
            fillColor: palette.sky,
            textColor: palette.white,
            fontStyle: 'bold',
            halign: 'center',
            valign: 'middle',
            lineColor: palette.borderBlue,
            lineWidth: 0.2,
          },
          styles: {
            font: 'helvetica',
            fontSize: 9,
            cellPadding: { top: 2.2, right: 2, bottom: 2.2, left: 2 },
            textColor: palette.slate,
            lineColor: palette.borderBlue,
            lineWidth: 0.15,
            halign: 'center',
            valign: 'middle',
          },
          columnStyles: {
            0: { cellWidth: 76, halign: 'left', valign: 'middle' },
            1: { cellWidth: 20, halign: 'center', valign: 'middle' },
            2: { cellWidth: 18, halign: 'center', valign: 'middle' },
            3: { cellWidth: 20, halign: 'center', valign: 'middle' },
            4: { cellWidth: 20, halign: 'center', valign: 'middle' },
            5: { cellWidth: 20, halign: 'center', valign: 'middle' },
          },
          margin: { left: marginX, right: marginX },
          alternateRowStyles: { fillColor: palette.surfaceBlue },
        });
        yPos = (doc as AutoTableDoc).lastAutoTable.finalY;
      } else {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9);
        doc.setTextColor(...palette.muted);
        doc.text('Refeição vazia.', marginX, yPos + 2);
        doc.setFont('helvetica', 'normal');
        yPos += spacing.lineHeight + 3;
      }
    });

    drawSectionHeading(`Totais - ${appName}`);
    ensureSpace(28);

    const cardGap = 4;
    const cardW = (contentWidth - cardGap * 2) / 3;
    const cardH = 12;
    const totalCards = [
      `Calorias\n${totals.totalKcal.toFixed(0)} kcal`,
      `Proteínas\n${totals.totalProtein.toFixed(1)} g`,
      `Carboidratos\n${totals.totalCarbs.toFixed(1)} g`,
      `Gorduras\n${totals.totalFat.toFixed(1)} g`,
      `Fibras\n${totals.totalFiber.toFixed(1)} g`,
      `Refeições\n${meals.length}`,
    ];

    totalCards.forEach((card, index) => {
      const row = Math.floor(index / 3);
      const col = index % 3;
      const x = marginX + col * (cardW + cardGap);
      const y = yPos + row * (cardH + 4);

      doc.setFillColor(...palette.surfaceBlue);
      doc.setDrawColor(...palette.borderBlue);
      doc.roundedRect(x, y, cardW, cardH, 1.8, 1.8, 'FD');

      const [label, value] = card.split('\n');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...palette.muted);
      doc.text(label, x + cardW / 2, y + 4, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...palette.navy);
      doc.text(value, x + cardW / 2, y + 9, { align: 'center' });
    });

    const pageCount = doc.getNumberOfPages();
    for (let page = 1; page <= pageCount; page++) {
      doc.setPage(page);

      // Decorative page lines
      doc.setDrawColor(...palette.borderBlue);
      doc.setLineWidth(0.2);
      doc.line(marginX, 10, pageWidth - marginX, 10);
      doc.line(marginX, pageHeight - 12, pageWidth - marginX, pageHeight - 12);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...palette.muted);
      doc.text(
        `${appName} • Gerado em ${generatedAt} • Página ${page}/${pageCount}`,
        pageWidth / 2,
        pageHeight - 8,
        { align: 'center' },
      );
    }

    doc.save('plano-alimentar-personalizado.pdf');
  }
}
