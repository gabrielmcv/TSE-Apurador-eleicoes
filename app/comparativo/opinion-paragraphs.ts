/** Preserve authored paragraph breaks and group legacy prose at sentence boundaries. */
export function opinionParagraphs(text: string): string[] {
  const authored = text.trim().split(/\n\s*\n|\n/).map(part => part.trim()).filter(Boolean);
  if (authored.length !== 1) return authored;

  const sentences = [...new Intl.Segmenter('pt-BR', {granularity: 'sentence'}).segment(authored[0])]
    .map(part => part.segment.trim());
  const paragraphs: string[] = [];
  let paragraph = '';
  for (const sentence of sentences) {
    if (paragraph && paragraph.length + sentence.length > 520) {
      paragraphs.push(paragraph);
      paragraph = '';
    }
    paragraph += (paragraph ? ' ' : '') + sentence;
  }
  if (paragraph) paragraphs.push(paragraph);
  return paragraphs;
}
