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
import { MemoDoc, SummarySection } from '../app/core/models/memo.model.js';
import { normalizeSummary, summarySections } from '../app/core/utils/summary.util.js';

const INK = '14251D';
const GREEN = '1B4332';
const BODY = '2D3748';

/** Word copy of the revision document: same sections, top to bottom. Answers only on the teacher copy. */
export async function generateMemoDocx(
  memo: MemoDoc,
  authorName?: string,
  school?: string,
  teacherCopy = false,
): Promise<Buffer> {
  const doc = normalizeSummary(memo) ?? memo;
  const isAr = doc.language !== 'fr';
  const alignment = isAr ? AlignmentType.RIGHT : AlignmentType.LEFT;
  const dirBidi = isAr ? { bidirectional: true } : {};
  const font = isAr ? 'Noto Kufi Arabic' : 'Outfit';
  const t = (fr: string, ar: string) => (isAr ? ar : fr);

  const border = { style: BorderStyle.SINGLE, size: 6, color: GREEN };
  const cellBorders = { top: border, bottom: border, left: border, right: border };

  const para = (text: string, opts: { bold?: boolean; size?: number; color?: string; italics?: boolean; after?: number; before?: number } = {}) =>
    new Paragraph({
      alignment,
      ...dirBidi,
      spacing: { before: opts.before ?? 0, after: opts.after ?? 80 },
      children: [
        new TextRun({ text, bold: opts.bold, italics: opts.italics, size: opts.size ?? 22, color: opts.color ?? BODY, font }),
      ],
    });

  const labelled = (label: string, text: string) =>
    new Paragraph({
      alignment,
      ...dirBidi,
      spacing: { after: 80 },
      children: [
        new TextRun({ text: `${label} `, bold: true, size: 22, color: INK, font }),
        new TextRun({ text, size: 22, color: BODY, font }),
      ],
    });

  const cell = (text: string, header = false) =>
    new TableCell({
      borders: cellBorders,
      shading: header ? { fill: GREEN, type: ShadingType.CLEAR } : undefined,
      children: [para(text, { bold: header, color: header ? 'FFFFFF' : BODY, size: 20, after: 40 })],
    });

  const table = (rows: string[][]) =>
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      visuallyRightToLeft: isAr,
      rows: rows.map((r, i) => new TableRow({ children: r.map((c) => cell(c, i === 0)) })),
    });

  const children: (Paragraph | Table)[] = [];

  children.push(
    para(`${doc.grade} · ${doc.subject}${doc.trimester ? ` · ${doc.trimester}` : ''}`, { bold: true, size: 20, color: '2D6A4F', after: 120 }),
    new Paragraph({
      alignment,
      heading: HeadingLevel.HEADING_1,
      ...dirBidi,
      spacing: { after: 100 },
      children: [new TextRun({ text: doc.title || doc.topic, size: 36, bold: true, color: INK, font: isAr ? font : 'Fraunces' })],
    }),
  );
  if (doc.subtitle) children.push(para(doc.subtitle, { italics: true, color: '406343', after: 160 }));
  if (doc.objective) children.push(labelled(t('Objectif :', 'الهدف :'), doc.objective));

  summarySections(doc).forEach((s: SummarySection, i) => {
    children.push(
      new Paragraph({
        alignment,
        heading: HeadingLevel.HEADING_2,
        ...dirBidi,
        spacing: { before: 240, after: 120 },
        children: [new TextRun({ text: `${i + 1}. ${s.heading}`, size: 26, bold: true, color: GREEN, font })],
      }),
    );

    if (s.text) {
      children.push(s.type === 'example' ? labelled(t('Énoncé :', 'المعطى :'), s.text) : para(s.text));
    }
    for (const item of s.items ?? []) children.push(para(`• ${item}`));
    for (const step of s.steps ?? []) labelledPush(`${step.n}. ${step.heading}${step.body ? ' :' : ''}`, step.body);
    if (s.solution) children.push(labelled(t('Solution :', 'الحلّ :'), s.solution));

    if (s.table?.rows?.length) {
      const headers = s.table.headers?.length ? s.table.headers : ['', ...s.table.rows[0].cells.map(() => '')];
      children.push(table([headers, ...s.table.rows.map((r) => [r.label, ...r.cells])]));
    }
    if (s.conjugation?.rows?.length) {
      const c = s.conjugation;
      if (c.verb || c.tense) children.push(para([c.verb, c.tense].filter(Boolean).join(' — '), { bold: true, color: INK }));
      const withExample = c.rows.some((r) => r.example);
      children.push(
        table([
          [t('Pronom', 'الضمير'), t('Forme', 'الصيغة'), ...(withExample ? [t('Exemple', 'مثال')] : [])],
          ...c.rows.map((r) => [r.pronoun, r.form, ...(withExample ? [r.example ?? ''] : [])]),
        ]),
      );
    }
    for (const ev of s.timeline ?? []) labelledPush(`${ev.stepOrDate} — ${ev.title}${ev.description ? ' :' : ''}`, ev.description);

    (s.exercises ?? []).forEach((ex, n) => {
      children.push(labelled(`${n + 1}.`, ex.question));
      if (teacherCopy && ex.answer) children.push(para(`${t('Réponse :', 'الإجابة :')} ${ex.answer}`, { italics: true, color: '2D6A4F' }));
      else children.push(para('……………………………………………………………………', { color: '999999' }));
    });
  });

  function labelledPush(label: string, text: string) {
    children.push(text ? labelled(label, text) : para(label, { bold: true, color: INK }));
  }

  const author = authorName || 'Enseignant Madrasati TN';
  const schoolName = school || 'المدرسة الابتدائية التونسية';
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 320, after: 60 },
      children: [new TextRun({ text: `Madrasati TN · ${author} · ${schoolName}`, size: 16, color: '888888', font })],
    }),
  );

  const out = new Document({ sections: [{ properties: {}, children }] });
  return await Packer.toBuffer(out);
}
