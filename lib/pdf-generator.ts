import type { PricingBreakdown, QuoteFormData } from '@/types/quote';

function getQuoteNumber(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const key = `nettoria_quote_counter_${yyyy}_${mm}`;
  let counter = 1;
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(key);
    counter = stored ? parseInt(stored) + 1 : 1;
    localStorage.setItem(key, String(counter));
  }
  return `NETTORIA-${yyyy}-${mm}-${String(counter).padStart(3, '0')}`;
}

export async function generateQuotePDF(
  formData: QuoteFormData,
  breakdown: PricingBreakdown,
  clientName: string,
  clientEmail: string
): Promise<string> {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const quoteNumber = getQuoteNumber();
  const today = new Date().toLocaleDateString('fr-FR');

  // Header
  doc.setFillColor(26, 46, 74);
  doc.rect(0, 0, 210, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('NETTORIA', 15, 22);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Spécialiste du débarras', 15, 32);

  doc.setFontSize(11);
  doc.text(`Devis N° ${quoteNumber}`, 135, 18);
  doc.text(`Date : ${today}`, 135, 26);

  // Client & chantier
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('DESTINATAIRE', 15, 52);
  doc.setFont('helvetica', 'normal');
  doc.text(clientName, 15, 59);
  doc.text(clientEmail, 15, 65);

  doc.setFont('helvetica', 'bold');
  doc.text('ADRESSE DU CHANTIER', 110, 52);
  doc.setFont('helvetica', 'normal');
  const addressLines = doc.splitTextToSize(formData.address, 85);
  doc.text(addressLines, 110, 59);

  // Separator
  doc.setDrawColor(26, 46, 74);
  doc.setLineWidth(0.5);
  doc.line(15, 75, 195, 75);

  // Table
  const rows: (string | number)[][] = [];

  rows.push([
    `Forfait débarras (${breakdown.baseHours}h × 55 €/h)`,
    `${breakdown.baseCost.toFixed(2)} €`,
  ]);

  for (const m of breakdown.majorations) {
    rows.push([`  ↳ Majoration : ${m.label} (+${m.percent}%)`, `+${m.amount.toFixed(2)} €`]);
  }

  if (breakdown.majorations.length > 0) {
    rows.push([
      'Sous-total main-d\'œuvre majorée',
      `${breakdown.majoratedBase.toFixed(2)} €`,
    ]);
  }

  rows.push([
    `Frais de déplacement (${breakdown.distanceKm * 2 + 20} km AR + déchetterie)${breakdown.distanceEstimated ? ' *estimé*' : ''}`,
    `${breakdown.totalDistanceCost.toFixed(2)} €`,
  ]);
  rows.push([`  ↳ Carburant`, `${breakdown.fuelCost.toFixed(2)} €`]);
  rows.push([`  ↳ Usure véhicule`, `${breakdown.wearCost.toFixed(2)} €`]);
  rows.push(['Forfait déchetterie', `${breakdown.dechetterieForfix.toFixed(2)} €`]);
  rows.push(['Forfait camion', `${breakdown.truckForfix.toFixed(2)} €`]);

  for (const t of breakdown.specialTreatments) {
    rows.push([t.label, `+${t.amount.toFixed(2)} €`]);
  }

  for (const f of breakdown.fixedFees) {
    rows.push([f.label, `+${f.amount.toFixed(2)} €`]);
  }

  rows.push(['Sous-total HT', `${breakdown.subtotal.toFixed(2)} €`]);

  if (breakdown.deadlineCoeff > 1) {
    rows.push([
      `Majoration délai "${breakdown.deadlineLabel}" (×${breakdown.deadlineCoeff})`,
      `+${breakdown.deadlineBonus.toFixed(2)} €`,
    ]);
  }

  autoTable(doc, {
    startY: 80,
    head: [['Prestation', 'Montant HT']],
    body: rows,
    theme: 'striped',
    headStyles: { fillColor: [26, 46, 74], textColor: 255, fontStyle: 'bold' },
    columnStyles: { 1: { halign: 'right', cellWidth: 40 } },
    styles: { fontSize: 9, cellPadding: 3 },
    foot: [[{ content: `PRIX TOTAL HT : ${breakdown.totalHT.toFixed(2)} €`, colSpan: 2, styles: { halign: 'right', fontStyle: 'bold', fontSize: 12, fillColor: [46, 125, 50], textColor: 255 } }]],
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;

  // Conditions
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(15, finalY, 180, 28, 3, 3, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(26, 46, 74);
  doc.text('CONDITIONS', 20, finalY + 7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text('• Devis valable 10 jours à compter de la date d\'émission.', 20, finalY + 14);
  doc.text('• Acompte de 30 % à la commande, solde à la fin du chantier.', 20, finalY + 20);
  doc.text('• Prix hors taxes. TVA non applicable — Article 293B du CGI.', 20, finalY + 26);

  // Footer
  doc.setFillColor(26, 46, 74);
  doc.rect(0, 282, 210, 15, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text('NETTORIA — project.nettoria@gmail.com', 105, 290, { align: 'center' });

  return doc.output('datauristring');
}
