import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  WidthType,
  BorderStyle,
  ShadingType,
} from 'docx';
import { MemoDoc } from '../app/core/models/memo.model.js';

export async function generateMemoDocx(memo: MemoDoc, authorName?: string, school?: string): Promise<Buffer> {
  const isAr = memo.language === 'ar';
  const alignment = isAr ? AlignmentType.RIGHT : AlignmentType.LEFT;
  const dirBidi = isAr ? { bidirectional: true } : {};

  const emeraldBorder = {
    top: { style: BorderStyle.SINGLE, size: 6, color: '1B4332' },
    bottom: { style: BorderStyle.SINGLE, size: 6, color: '1B4332' },
    left: { style: BorderStyle.SINGLE, size: 6, color: '1B4332' },
    right: { style: BorderStyle.SINGLE, size: 6, color: '1B4332' },
  };

  const children: (Paragraph | Table)[] = [];

  // 1. Header Block
  children.push(
    new Paragraph({
      alignment,
      ...dirBidi,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: `${memo.grade} · ${memo.subject}`,
          size: 20,
          bold: true,
          color: '2D6A4F',
          font: isAr ? 'Noto Kufi Arabic' : 'Outfit',
        }),
      ],
    }),
    new Paragraph({
      alignment,
      heading: HeadingLevel.HEADING_1,
      ...dirBidi,
      spacing: { after: 100 },
      children: [
        new TextRun({
          text: memo.title || memo.topic,
          size: 36,
          bold: true,
          color: '14251D',
          font: isAr ? 'Noto Kufi Arabic' : 'Fraunces',
        }),
      ],
    }),
  );

  if (memo.subtitle) {
    children.push(
      new Paragraph({
        alignment,
        ...dirBidi,
        spacing: { after: 240 },
        children: [
          new TextRun({
            text: memo.subtitle,
            size: 22,
            italics: true,
            color: '406343',
            font: isAr ? 'Noto Kufi Arabic' : 'Outfit',
          }),
        ],
      }),
    );
  }

  // 2. Steps Section
  if (Array.isArray(memo.steps) && memo.steps.length > 0) {
    children.push(
      new Paragraph({
        alignment,
        heading: HeadingLevel.HEADING_2,
        ...dirBidi,
        spacing: { before: 200, after: 120 },
        children: [
          new TextRun({
            text: isAr ? '📌 خطواتي خطوة بخطوة' : '📌 Ma méthode pas à pas',
            size: 26,
            bold: true,
            color: '1B4332',
          }),
        ],
      }),
    );

    for (const step of memo.steps) {
      children.push(
        new Paragraph({
          alignment,
          ...dirBidi,
          spacing: { after: 80 },
          children: [
            new TextRun({
              text: `${step.n}. ${step.heading} : `,
              bold: true,
              size: 22,
              color: '14251D',
            }),
            new TextRun({
              text: step.body,
              size: 22,
              color: '2D3748',
            }),
          ],
        }),
      );
    }
  }

  // 3. Concepts Cards Section
  if (Array.isArray(memo.cards) && memo.cards.length > 0) {
    children.push(
      new Paragraph({
        alignment,
        heading: HeadingLevel.HEADING_2,
        ...dirBidi,
        spacing: { before: 240, after: 140 },
        children: [
          new TextRun({
            text: isAr ? '💡 المفاهيم الأساسية' : '💡 Concepts clés',
            size: 26,
            bold: true,
            color: '1B4332',
          }),
        ],
      }),
    );

    const tableRows: TableRow[] = [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 30, type: WidthType.PERCENTAGE },
            shading: { fill: '1B4332', type: ShadingType.CLEAR },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: isAr ? 'المفهوم' : 'Concept',
                    bold: true,
                    color: 'FFFFFF',
                    size: 20,
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 70, type: WidthType.PERCENTAGE },
            shading: { fill: '1B4332', type: ShadingType.CLEAR },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: isAr ? 'الشرح والأمثلة' : 'Définition & Exemples',
                    bold: true,
                    color: 'FFFFFF',
                    size: 20,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ];

    for (const card of memo.cards) {
      const examplesText = Array.isArray(card.examples) ? card.examples.join(' · ') : '';
      tableRows.push(
        new TableRow({
          children: [
            new TableCell({
              borders: emeraldBorder,
              shading: { fill: 'FBF8F1', type: ShadingType.CLEAR },
              children: [
                new Paragraph({
                  alignment,
                  ...dirBidi,
                  children: [new TextRun({ text: card.label, bold: true, size: 22, color: '14251D' })],
                }),
              ],
            }),
            new TableCell({
              borders: emeraldBorder,
              children: [
                new Paragraph({
                  alignment,
                  ...dirBidi,
                  spacing: { after: 40 },
                  children: [new TextRun({ text: card.definition, size: 20, color: '2D3748' })],
                }),
                ...(examplesText
                  ? [
                      new Paragraph({
                        alignment,
                        ...dirBidi,
                        children: [
                          new TextRun({
                            text: `${isAr ? 'أمثلة : ' : 'Exemples : '}${examplesText}`,
                            size: 18,
                            italics: true,
                            color: '2D6A4F',
                          }),
                        ],
                      }),
                    ]
                  : []),
              ],
            }),
          ],
        }),
      );
    }

    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: tableRows,
      }),
    );
  }

  // 4. Example and Analysis
  if (memo.example && memo.example.sentence) {
    children.push(
      new Paragraph({
        alignment,
        heading: HeadingLevel.HEADING_2,
        ...dirBidi,
        spacing: { before: 240, after: 120 },
        children: [
          new TextRun({
            text: isAr ? '🔍 مثال تطبيقي وتحليل' : '🔍 Exemple type analysé',
            size: 26,
            bold: true,
            color: '1B4332',
          }),
        ],
      }),
      new Paragraph({
        alignment,
        ...dirBidi,
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: `« ${memo.example.sentence} »`,
            size: 24,
            bold: true,
            color: '14251D',
          }),
        ],
      }),
    );

    if (Array.isArray(memo.example.analysis) && memo.example.analysis.length > 0) {
      const analysisRows: TableRow[] = [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 40, type: WidthType.PERCENTAGE },
              shading: { fill: 'E7DFCF', type: ShadingType.CLEAR },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: isAr ? 'الكلمة / الجزء' : 'Élément', bold: true, size: 20 })],
                }),
              ],
            }),
            new TableCell({
              width: { size: 60, type: WidthType.PERCENTAGE },
              shading: { fill: 'E7DFCF', type: ShadingType.CLEAR },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: isAr ? 'الوظيفة الإعرابية' : 'Fonction / Rôle', bold: true, size: 20 })],
                }),
              ],
            }),
          ],
        }),
      ];

      for (const item of memo.example.analysis) {
        analysisRows.push(
          new TableRow({
            children: [
              new TableCell({
                borders: emeraldBorder,
                children: [
                  new Paragraph({
                    alignment,
                    ...dirBidi,
                    children: [new TextRun({ text: item.word, bold: true, size: 20, color: '14251D' })],
                  }),
                ],
              }),
              new TableCell({
                borders: emeraldBorder,
                children: [
                  new Paragraph({
                    alignment,
                    ...dirBidi,
                    children: [new TextRun({ text: item.role, size: 20, color: '2D6A4F' })],
                  }),
                ],
              }),
            ],
          }),
        );
      }

      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: analysisRows,
        }),
      );
    }
  }

  // 5. Formula Section
  if (memo.formula && Array.isArray(memo.formula.parts) && memo.formula.parts.length > 0) {
    children.push(
      new Paragraph({
        alignment,
        ...dirBidi,
        spacing: { before: 200, after: 80 },
        children: [
          new TextRun({
            text: isAr ? '📐 القاعدة المختصرة : ' : '📐 Règle synthétique : ',
            bold: true,
            size: 22,
            color: '8A5A00',
          }),
          new TextRun({
            text: memo.formula.parts.join(' '),
            bold: true,
            size: 22,
            color: '14251D',
          }),
        ],
      }),
    );
    if (memo.formula.note) {
      children.push(
        new Paragraph({
          alignment,
          ...dirBidi,
          spacing: { after: 120 },
          children: [
            new TextRun({
              text: `ℹ️ ${memo.formula.note}`,
              italics: true,
              size: 20,
              color: '555555',
            }),
          ],
        }),
      );
    }
  }

  // 6. Remember / Incontournables
  if (Array.isArray(memo.remember) && memo.remember.length > 0) {
    children.push(
      new Paragraph({
        alignment,
        heading: HeadingLevel.HEADING_2,
        ...dirBidi,
        spacing: { before: 200, after: 100 },
        children: [
          new TextRun({
            text: isAr ? '⭐ قواعد لا أنساها' : '⭐ À ne pas oublier !',
            size: 24,
            bold: true,
            color: '8A5A00',
          }),
        ],
      }),
    );

    for (const rule of memo.remember) {
      children.push(
        new Paragraph({
          alignment,
          ...dirBidi,
          spacing: { after: 60 },
          children: [
            new TextRun({
              text: `✔ ${rule}`,
              size: 20,
              color: '14251D',
            }),
          ],
        }),
      );
    }
  }

  // 7. Quote
  if (memo.quote) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 120 },
        children: [
          new TextRun({
            text: `💬 « ${memo.quote} »`,
            size: 20,
            italics: true,
            color: '406343',
          }),
        ],
      }),
    );
  }

  // 8. Teacher Attribution & Footer
  const author = authorName || 'Enseignant Madrasati TN';
  const schoolName = school || 'المدرسة الابتدائية التونسية';
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 240, after: 60 },
      children: [
        new TextRun({
          text: `──────────────────────────────────────────────\nMadrasati TN · ${author} · ${schoolName}`,
          size: 16,
          color: '888888',
        }),
      ],
    }),
  );

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}
