/** Default line height (mm) for wrapped address / body text in OMS PDFs. */
export const PDF_LINE_HEIGHT_MM = 5;

/**
 * Split text to fit maxWidth (mm) using the doc's current font settings.
 * Preserves explicit newlines in the source text.
 */
export function splitMultilineText(doc, text, maxWidth) {
  const content = text == null || String(text).trim() === '' ? 'N/A' : String(text);
  const paragraphs = content.split(/\r?\n/);
  const lines = [];
  paragraphs.forEach((paragraph) => {
    const chunk = paragraph.trim() === '' ? ' ' : paragraph;
    const wrapped = doc.splitTextToSize(chunk, maxWidth);
    if (Array.isArray(wrapped)) {
      lines.push(...wrapped);
    } else {
      lines.push(wrapped);
    }
  });
  return lines.length > 0 ? lines : ['N/A'];
}

/**
 * Draw text wrapped to maxWidth. Returns the Y of the last drawn line
 * and the Y where the next content should start (lastLineY + lineHeight).
 */
export function drawMultilineText(
  doc,
  text,
  x,
  y,
  {
    maxWidth = 145,
    lineHeight = PDF_LINE_HEIGHT_MM,
    align,
  } = {}
) {
  const lines = splitMultilineText(doc, text, maxWidth);
  const options = align ? { align } : undefined;
  lines.forEach((line, index) => {
    if (options) {
      doc.text(line, x, y + index * lineHeight, options);
    } else {
      doc.text(line, x, y + index * lineHeight);
    }
  });
  const lastLineY = y + (lines.length - 1) * lineHeight;
  return {
    lines,
    lineCount: lines.length,
    lastLineY,
    nextY: lastLineY + lineHeight,
  };
}

/**
 * Draw company header block (name, wrapped address, optional phone).
 * Returns the Y where content below the header should start.
 */
export function drawWarehouseHeader(
  doc,
  { company_name, address, phone },
  {
    x = 20,
    startY = 20,
    maxWidth = 120,
    lineHeight = PDF_LINE_HEIGHT_MM,
    nameFontSize = 12,
    bodyFontSize = 11,
  } = {}
) {
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(nameFontSize);
  doc.text(company_name || '', x, startY);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(bodyFontSize);
  const addressResult = drawMultilineText(doc, address, x, startY + lineHeight, {
    maxWidth,
    lineHeight,
  });

  let nextY = addressResult.nextY;
  if (phone) {
    doc.text(phone, x, nextY);
    nextY += lineHeight;
  }
  return { nextY, addressLineCount: addressResult.lineCount };
}
