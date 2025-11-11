import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, Table, TableCell, TableRow } from 'docx';

export interface FoodNormsRow {
  product: string;
  norm: number;
  actual: number;
  deviation: number;
  status?: string;
}

interface ExportFoodNormsParams {
  rows: FoodNormsRow[];
  note: string;
  month: string;
  year: string;
  group: string;
}

export function exportFoodNormsToDocx({
  rows,
  note,
  month,
  year,
  group,
}: ExportFoodNormsParams) {
  const tableRows = [
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph('№')] }),
        new TableCell({
          children: [new Paragraph('Наименование пищевой продукции')],
        }),
        new TableCell({
          children: [new Paragraph('Норма (г/мл брутто на 1 ребенка в день)')],
        }),
        new TableCell({ children: [new Paragraph('Фактически')] }),
        new TableCell({ children: [new Paragraph('Отклонение от нормы (%)')] }),
      ],
    }),
    ...rows.map(
      (row: FoodNormsRow, idx: number) =>
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph(String(idx + 1))] }),
            new TableCell({ children: [new Paragraph(row.product)] }),
            new TableCell({ children: [new Paragraph(String(row.norm))] }),
            new TableCell({ children: [new Paragraph(String(row.actual))] }),
            new TableCell({ children: [new Paragraph(row.deviation + '%')] }),
          ],
        }),
    ),
  ];

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: `Ведомость контроля за выполнением норм пищевой продукции (Форма 4)`,
            heading: 'Heading1',
          }),
          new Paragraph({
            text: `${month} ${year}${group ? ' • ' + group : ''}`,
            spacing: { after: 200 },
          }),
          new Table({ rows: tableRows }),
          new Paragraph({
            text: 'Примечание:',
            spacing: { before: 300, after: 100 },
          }),
          new Paragraph(note || ''),
        ],
      },
    ],
  });

  Packer.toBlob(doc).then((blob) => {
    saveAs(blob, `Ведомость_Форма4_${month}_${year}.docx`);
  });
}
